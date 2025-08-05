import { AppDataSource } from "../config/data-source";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { TransactionService } from "./transaction.service";
import { CreateTransactionDTO, EntryType, TransactionType } from "../types/transaction.types";
import { logInfo, logSuccess, logError } from '../utils/logger';
import { RecurrencePattern } from "../entities/Transaction";

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
        .leftJoinAndSelect('recurringTransaction.primaryAccount', 'primaryAccount')
        .leftJoinAndSelect('recurringTransaction.secondaryAccount', 'secondaryAccount')
        .getMany();
      
      logInfo(`Total recurring transactions in database: ${allRecurringTransactions.length}`, 'RecurringTransactionJob');
      
      // Log details of each recurring transaction
      for (const rt of allRecurringTransactions) {
        logInfo(`Recurring transaction ${rt.id}: isActive=${rt.isActive}, nextRun=${rt.nextRun}, description=${rt.description}, primaryAccount=${rt.primaryAccount?.name}, secondaryAccount=${rt.secondaryAccount?.name}`, 'RecurringTransactionJob');
      }
      
      const dueRecurringTransactions = await this.recurringTransactionRepo
        .createQueryBuilder('recurringTransaction')
        .leftJoinAndSelect('recurringTransaction.user', 'user')
        .leftJoinAndSelect('recurringTransaction.primaryAccount', 'primaryAccount')
        .leftJoinAndSelect('recurringTransaction.secondaryAccount', 'secondaryAccount')
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
      logInfo(`   - Primary Account ID: ${recurringTransaction.primaryAccount.id}`, 'RecurringTransactionJob');
      logInfo(`   - Primary Account Name: ${recurringTransaction.primaryAccount.name}`, 'RecurringTransactionJob');
      logInfo(`   - Secondary Account ID: ${recurringTransaction.secondaryAccount.id}`, 'RecurringTransactionJob');
      logInfo(`   - Secondary Account Name: ${recurringTransaction.secondaryAccount.name}`, 'RecurringTransactionJob');

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

      // Create transaction data from recurring transaction using the stored accounts
      const transactionData: CreateTransactionDTO = {
        description: recurringTransaction.description,
        date: now,
        type: TransactionType.INCOME, // Default to INCOME, but this should be configurable
        category: 'Recurring Transaction',
        amount: recurringTransaction.amount,
        entries: [
          {
            amount: recurringTransaction.amount,
            type: recurringTransaction.primaryEntryType as EntryType,
            accountId: recurringTransaction.primaryAccount.id
          },
          {
            amount: recurringTransaction.amount,
            type: recurringTransaction.secondaryEntryType as EntryType,
            accountId: recurringTransaction.secondaryAccount.id
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