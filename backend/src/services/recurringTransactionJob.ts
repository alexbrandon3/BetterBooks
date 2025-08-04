import { AppDataSource } from "../config/data-source";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import {  AccountType } from "../entities/Account";
import { TransactionService } from "./transaction.service";
import { CreateTransactionDTO, EntryType, TransactionType } from "../types/transaction.types";
import { logInfo, logSuccess, logError } from '../utils/logger';
import { RecurrencePattern } from "../entities/Transaction";
import { Account } from "../entities/Account";

export class RecurringTransactionJob {
  private recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
  private transactionService = new TransactionService();
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(): void {
    logInfo('Starting recurring transaction job', 'RecurringTransactionJob');
    logInfo('Job will run every 60 seconds', 'RecurringTransactionJob');
    this.interval = setInterval(() => {
      logInfo('Recurring transaction job interval triggered', 'RecurringTransactionJob');
      this.processRecurringTransactions();
    }, 60000); // 60 seconds
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logInfo('Stopped recurring transaction job', 'RecurringTransactionJob');
    }
  }

  private async processRecurringTransactions(): Promise<void> {
    if (this.isRunning) {
      logInfo('Previous job still running, skipping this iteration', 'RecurringTransactionJob');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logInfo('Starting recurring transaction processing', 'RecurringTransactionJob');

      // Find all active recurring transactions that are due
      const now = new Date();
      logInfo(`Current time: ${now.toISOString()}`, 'RecurringTransactionJob');
      
      // First, let's see all recurring transactions
      const allRecurringTransactions = await this.recurringTransactionRepo
        .createQueryBuilder('recurringTransaction')
        .leftJoinAndSelect('recurringTransaction.user', 'user')
        .leftJoinAndSelect('recurringTransaction.account', 'account')
        .getMany();
      
      logInfo(`Total recurring transactions in database: ${allRecurringTransactions.length}`, 'RecurringTransactionJob');
      
      // Log details of each recurring transaction
      for (const rt of allRecurringTransactions) {
        logInfo(`Recurring transaction ${rt.id}: isActive=${rt.isActive}, nextRun=${rt.nextRun}, description=${rt.description}`, 'RecurringTransactionJob');
      }
      
      const dueRecurringTransactions = await this.recurringTransactionRepo
        .createQueryBuilder('recurringTransaction')
        .leftJoinAndSelect('recurringTransaction.user', 'user')
        .leftJoinAndSelect('recurringTransaction.account', 'account')
        .where('recurringTransaction.isActive = :isActive', { isActive: true })
        .andWhere('recurringTransaction.nextRun <= :now', { now })
        .getMany();

      logInfo(`Found ${dueRecurringTransactions.length} due recurring transactions`, 'RecurringTransactionJob');

      for (const recurringTransaction of dueRecurringTransactions) {
        await this.processSingleRecurringTransaction(recurringTransaction);
      }

      const duration = Date.now() - startTime;
      logSuccess(`Recurring transaction processing completed in ${duration}ms`, 'RecurringTransactionJob');

    } catch (error) {
      logError(`Error in recurring transaction processing: ${error instanceof Error ? error.message : 'Unknown error'}`, 'RecurringTransactionJob');
    } finally {
      this.isRunning = false;
    }
  }

  private async processSingleRecurringTransaction(recurringTransaction: RecurringTransaction): Promise<void> {
    const transactionId = recurringTransaction.id;
    const userId = recurringTransaction.user.id;

    try {
      logInfo(`🔍 Processing recurring transaction ${transactionId} for user ${userId}`, 'RecurringTransactionJob');
      logInfo(`📋 Recurring transaction details:`, 'RecurringTransactionJob');
      logInfo(`   - Description: ${recurringTransaction.description}`, 'RecurringTransactionJob');
      logInfo(`   - Amount: ${recurringTransaction.amount}`, 'RecurringTransactionJob');
      logInfo(`   - Account ID: ${recurringTransaction.account.id}`, 'RecurringTransactionJob');
      logInfo(`   - Account Name: ${recurringTransaction.account.name}`, 'RecurringTransactionJob');

      // Check if this transaction was already executed recently (idempotency)
      const now = new Date();
      const timeSinceLastExecution = recurringTransaction.lastExecuted 
        ? now.getTime() - recurringTransaction.lastExecuted.getTime()
        : Infinity;

      logInfo(`⏰ Time since last execution: ${timeSinceLastExecution}ms`, 'RecurringTransactionJob');

      // If executed within the last 5 minutes, skip to prevent duplicates
      if (timeSinceLastExecution < 5 * 60 * 1000) {
        logInfo(`⏭️ Skipping transaction ${transactionId} - executed recently`, 'RecurringTransactionJob');
        await this.updateRecurringTransaction(recurringTransaction, 'SKIPPED');
        return;
      }

      // For now, we'll create a simple transaction using the selected account
      // In the future, we should store both debit and credit accounts in the recurring transaction
      logInfo(`🔍 Using selected account: ${recurringTransaction.account.name} (ID: ${recurringTransaction.account.id})`, 'RecurringTransactionJob');

      // Find a suitable account for the other side of the transaction
      // For INCOME transactions: credit income account, debit cash/asset account
      // For EXPENSE transactions: debit expense account, credit cash/asset account
      // For ASSET transactions: debit asset account, credit another asset account
      const accountRepo = AppDataSource.getRepository(Account);
      let otherAccount = null;
      
      if (recurringTransaction.account.type === AccountType.INCOME) {
        // For income, find a cash/asset account to debit
        otherAccount = await accountRepo.findOne({
          where: {
            user: { id: userId },
            type: AccountType.ASSET,
            name: "Cash"
          }
        });
      } else if (recurringTransaction.account.type === AccountType.EXPENSE) {
        // For expense, find a cash/asset account to credit
        otherAccount = await accountRepo.findOne({
          where: {
            user: { id: userId },
            type: AccountType.ASSET,
            name: "Cash"
          }
        });
      } else if (recurringTransaction.account.type === AccountType.ASSET) {
        // For asset transactions, find another asset account
        otherAccount = await accountRepo.findOne({
          where: {
            user: { id: userId },
            type: AccountType.ASSET,
            name: "Checking Account"
          }
        });
        
        // If no checking account, try savings
        if (!otherAccount) {
          otherAccount = await accountRepo.findOne({
            where: {
              user: { id: userId },
              type: AccountType.ASSET,
              name: "Savings Account"
            }
          });
        }
      } else if (recurringTransaction.account.type === AccountType.LIABILITY) {
        // For liability transactions, find a cash/asset account to debit
        otherAccount = await accountRepo.findOne({
          where: {
            user: { id: userId },
            type: AccountType.ASSET,
            name: "Cash"
          }
        });
      } else if (recurringTransaction.account.type === AccountType.EQUITY) {
        // For equity transactions, find a cash/asset account to debit
        otherAccount = await accountRepo.findOne({
          where: {
            user: { id: userId },
            type: AccountType.ASSET,
            name: "Cash"
          }
        });
      }
      
      if (!otherAccount) {
        logError(`❌ No suitable account found for the other side of transaction`, 'RecurringTransactionJob');
        await this.updateRecurringTransaction(recurringTransaction, 'FAILED');
        return;
      }

      logInfo(`🔍 Found other account: ${otherAccount.name} (ID: ${otherAccount.id})`, 'RecurringTransactionJob');

      // Create transaction data from recurring transaction
      // The account from the recurring transaction is the primary account
      const transactionData: CreateTransactionDTO = {
        description: recurringTransaction.description,
        date: now,
        type: TransactionType.INCOME, // Default to INCOME, but this should be configurable
        category: 'Recurring Transaction',
        amount: recurringTransaction.amount,
        entries: [
          {
            amount: recurringTransaction.amount,
            type: EntryType.CREDIT,
            accountId: recurringTransaction.account.id // Use the account from the recurring transaction
          },
          {
            amount: recurringTransaction.amount,
            type: EntryType.DEBIT,
            accountId: otherAccount.id // Use the found account for the other side
          }
        ],
        userId: userId
      };

      logInfo(`📤 Creating transaction with data:`, 'RecurringTransactionJob');
      logInfo(`   - User ID: ${transactionData.userId}`, 'RecurringTransactionJob');
      logInfo(`   - Amount: ${transactionData.amount}`, 'RecurringTransactionJob');
      logInfo(`   - Entries:`, 'RecurringTransactionJob');
      transactionData.entries.forEach((entry, index) => {
        logInfo(`     ${index + 1}. ${entry.type} ${entry.amount} to account ${entry.accountId}`, 'RecurringTransactionJob');
      });

      // Create the actual transaction
      logInfo(`🚀 Calling transactionService.createTransaction...`, 'RecurringTransactionJob');
      const result = await this.transactionService.createTransaction(transactionData);
      
      logSuccess(`✅ Created transaction ${result.transaction.id} from recurring transaction ${transactionId}`, 'RecurringTransactionJob');

      // Calculate next run date
      const nextRun = this.calculateNextRun(recurringTransaction.recurrencePattern, now);
      logInfo(`📅 Next run date: ${nextRun}`, 'RecurringTransactionJob');

      // Update recurring transaction
      await this.updateRecurringTransaction(recurringTransaction, 'SUCCESS', nextRun);

    } catch (error) {
      logError(`❌ Failed to process recurring transaction ${transactionId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'RecurringTransactionJob');
      if (error instanceof Error) {
        logError(`❌ Error stack: ${error.stack}`, 'RecurringTransactionJob');
      }
      await this.updateRecurringTransaction(recurringTransaction, 'FAILED');
    }
  }



  private calculateNextRun(recurrencePattern: RecurrencePattern, currentDate: Date): Date {
    const nextRun = new Date(currentDate);

    switch (recurrencePattern) {
      case RecurrencePattern.DAILY:
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case RecurrencePattern.WEEKLY:
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case RecurrencePattern.MONTHLY:
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      default:
        throw new Error(`Unknown recurrence pattern: ${recurrencePattern}`);
    }

    return nextRun;
  }

  private async updateRecurringTransaction(
    recurringTransaction: RecurringTransaction, 
    result: 'SUCCESS' | 'FAILED' | 'SKIPPED',
    nextRun?: Date
  ): Promise<void> {
    try {
      recurringTransaction.lastExecuted = new Date();
      recurringTransaction.lastExecutionResult = result;
      
      if (nextRun) {
        recurringTransaction.nextRun = nextRun;
      }

      // Check if we've reached the end date
      if (recurringTransaction.endDate && new Date() >= recurringTransaction.endDate) {
        recurringTransaction.isActive = false;
        logInfo(`Deactivated recurring transaction ${recurringTransaction.id} - reached end date`, 'RecurringTransactionJob');
      }

      await this.recurringTransactionRepo.save(recurringTransaction);
      logSuccess(`Updated recurring transaction ${recurringTransaction.id} with result: ${result}`, 'RecurringTransactionJob');

    } catch (error) {
      logError(`Failed to update recurring transaction ${recurringTransaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'RecurringTransactionJob');
    }
  }
}

// Singleton instance
let jobInstance: RecurringTransactionJob | null = null;

export const startRecurringTransactionJob = (): void => {
  if (!jobInstance) {
    jobInstance = new RecurringTransactionJob();
    jobInstance.start();
  }
};

export const stopRecurringTransactionJob = (): void => {
  if (jobInstance) {
    jobInstance.stop();
    jobInstance = null;
  }
}; 