import { AppDataSource } from "../config/data-source";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { TransactionService } from "./transaction.service";
import { CreateTransactionDTO, EntryType, TransactionType } from "../types/transaction.types";
import { logInfo, logSuccess, logError } from '../utils/logger';
import { RecurrencePattern } from "../entities/Transaction";

export class RecurringTransactionJob {
  private recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
  private transactionService = new TransactionService();
  private accountRepo = AppDataSource.getRepository("Account");
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(): void {
    logInfo('Starting recurring transaction job', 'RecurringTransactionJob');
    this.interval = setInterval(() => {
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

      // Create transaction data from recurring transaction
      // For a "Sold" transaction, this should be INCOME (credit Sales Revenue, debit Cash)
      const transactionData: CreateTransactionDTO = {
        description: recurringTransaction.description,
        date: now,
        type: TransactionType.INCOME, // Changed from EXPENSE to INCOME for "Sold" transactions
        category: 'Recurring Transaction',
        amount: recurringTransaction.amount,
        entries: [
          {
            amount: recurringTransaction.amount,
            type: EntryType.CREDIT,
            accountId: recurringTransaction.account.id // Credit the selected account (Sales Revenue)
          },
          {
            amount: recurringTransaction.amount,
            type: EntryType.DEBIT,
            accountId: 320 // Debit Cash (account 320)
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

  private async findCashAccount(userId: number): Promise<any> {
    logInfo(`🔍 Finding cash account for user ${userId}...`, 'RecurringTransactionJob');
    
    // Find any account for the user that can be used for the credit side
    // Try ASSET accounts first (cash/bank), then any other account
    let cashAccounts = await this.accountRepo.find({
      where: {
        user: { id: userId },
        type: "ASSET"
      },
      order: { balance: 'DESC' }
    });

    logInfo(`📊 Found ${cashAccounts.length} ASSET accounts for user ${userId}`, 'RecurringTransactionJob');
    cashAccounts.forEach((account, index) => {
      logInfo(`   ${index + 1}. ${account.name} (ID: ${account.id}, Balance: ${account.balance})`, 'RecurringTransactionJob');
    });

    // If no ASSET accounts found, try any account
    if (cashAccounts.length === 0) {
      logInfo(`🔍 No ASSET accounts found, trying any account...`, 'RecurringTransactionJob');
      cashAccounts = await this.accountRepo.find({
        where: {
          user: { id: userId }
        },
        order: { balance: 'DESC' }
      });
      
      logInfo(`📊 Found ${cashAccounts.length} total accounts for user ${userId}`, 'RecurringTransactionJob');
      cashAccounts.forEach((account, index) => {
        logInfo(`   ${index + 1}. ${account.name} (ID: ${account.id}, Type: ${account.type}, Balance: ${account.balance})`, 'RecurringTransactionJob');
      });
    }

    if (cashAccounts.length === 0) {
      logError(`❌ No accounts found for user ${userId}`, 'RecurringTransactionJob');
      throw new Error(`No accounts found for user ${userId}`);
    }

    const selectedAccount = cashAccounts[0];
    logInfo(`✅ Selected account: ${selectedAccount.name} (ID: ${selectedAccount.id}, Type: ${selectedAccount.type}, Balance: ${selectedAccount.balance})`, 'RecurringTransactionJob');
    return selectedAccount;
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