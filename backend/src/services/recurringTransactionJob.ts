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
      logInfo(`Processing recurring transaction ${transactionId} for user ${userId}`, 'RecurringTransactionJob');

      // Check if this transaction was already executed recently (idempotency)
      const now = new Date();
      const timeSinceLastExecution = recurringTransaction.lastExecuted 
        ? now.getTime() - recurringTransaction.lastExecuted.getTime()
        : Infinity;

      // If executed within the last 5 minutes, skip to prevent duplicates
      if (timeSinceLastExecution < 5 * 60 * 1000) {
        logInfo(`Skipping transaction ${transactionId} - executed recently`, 'RecurringTransactionJob');
        await this.updateRecurringTransaction(recurringTransaction, 'SKIPPED');
        return;
      }

      // For recurring transactions, we need to create a proper double-entry transaction
      // The recurring transaction account is typically the account being affected
      // We'll create a simple expense transaction: debit the expense account, credit cash/bank
      
      // Find a cash/bank account for the credit side (assuming this is an expense)
      const cashAccount = await this.findCashAccount(userId);
      if (!cashAccount) {
        throw new Error('No cash/bank account found for recurring transaction');
      }

      // Create transaction data from recurring transaction
      const transactionData: CreateTransactionDTO = {
        description: recurringTransaction.description,
        date: now,
        type: TransactionType.EXPENSE, // Default to expense, could be made configurable
        category: 'Recurring Transaction',
        amount: recurringTransaction.amount,
        entries: [
          {
            amount: recurringTransaction.amount,
            type: EntryType.DEBIT,
            accountId: recurringTransaction.account.id // Debit the expense account
          },
          {
            amount: recurringTransaction.amount,
            type: EntryType.CREDIT,
            accountId: cashAccount.id // Credit the cash/bank account
          }
        ],
        userId: userId
      };

      // Create the actual transaction
      const result = await this.transactionService.createTransaction(transactionData);
      
      logSuccess(`Created transaction ${result.transaction.id} from recurring transaction ${transactionId}`, 'RecurringTransactionJob');

      // Calculate next run date
      const nextRun = this.calculateNextRun(recurringTransaction.recurrencePattern, now);

      // Update recurring transaction
      await this.updateRecurringTransaction(recurringTransaction, 'SUCCESS', nextRun);

    } catch (error) {
      logError(`Failed to process recurring transaction ${transactionId}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'RecurringTransactionJob');
      await this.updateRecurringTransaction(recurringTransaction, 'FAILED');
    }
  }

  private async findCashAccount(userId: number): Promise<any> {
    // Find any account for the user that can be used for the credit side
    // Try ASSET accounts first (cash/bank), then any other account
    let cashAccounts = await this.accountRepo.find({
      where: {
        user: { id: userId },
        type: "ASSET"
      },
      order: { balance: 'DESC' }
    });

    // If no ASSET accounts found, try any account
    if (cashAccounts.length === 0) {
      cashAccounts = await this.accountRepo.find({
        where: {
          user: { id: userId }
        },
        order: { balance: 'DESC' }
      });
    }

    if (cashAccounts.length === 0) {
      throw new Error(`No accounts found for user ${userId}`);
    }

    logInfo(`Found ${cashAccounts.length} accounts for user ${userId}, using: ${cashAccounts[0].name}`, 'RecurringTransactionJob');
    return cashAccounts[0];
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