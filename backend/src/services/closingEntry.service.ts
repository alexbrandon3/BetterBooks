import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { JournalEntry } from "../entities/JournalEntry";
import { Account, AccountType, FinancialCategory } from "../entities/Account";
import { TransactionService } from "./transaction.service";
import { CreateTransactionDTO, EntryType, TransactionType } from "../types/transaction.types";
import { logInfo, logSuccess, logError } from '../utils/logger';
import { Between, In } from "typeorm";

export interface ClosingEntryRequest {
  periodEndDate: string;
  periodType: 'monthly';
}

export interface ClosingEntryResult {
  success: boolean;
  message: string;
  transactionId?: string;
  netIncome?: number;
  entriesCreated?: number;
}

export interface ClosingEntryPreview {
  revenueAccounts: Array<{
    accountId: number;
    accountName: string;
    balance: number;
  }>;
  expenseAccounts: Array<{
    accountId: number;
    accountName: string;
    balance: number;
  }>;
  netIncome: number;
  totalEntries: number;
}

export class ClosingEntryService {
  private transactionRepo = AppDataSource.getRepository(Transaction);
  private accountRepo = AppDataSource.getRepository(Account);
  private journalEntryRepo = AppDataSource.getRepository(JournalEntry);
  private transactionService = new TransactionService();

  /**
   * Check if books have already been closed for the specified period
   */
  async isPeriodAlreadyClosed(userId: number, periodEndDate: string): Promise<boolean> {
    logInfo(`Checking if period ${periodEndDate} is already closed for user ${userId}`, 'ClosingEntryService');

    const existingClosingEntry = await this.transactionRepo.findOne({
      where: {
        user: { id: userId },
        type: TransactionType.CLOSING_ENTRY,
        date: new Date(periodEndDate)
      }
    });

    const isClosed = !!existingClosingEntry;
    logInfo(`Period ${periodEndDate} ${isClosed ? 'is already closed' : 'is not closed'} for user ${userId}`, 'ClosingEntryService');
    
    return isClosed;
  }

  /**
   * Get all income and expense accounts for a user
   */
  async getIncomeExpenseAccounts(userId: number): Promise<Account[]> {
    logInfo(`Fetching income and expense accounts for user ${userId}`, 'ClosingEntryService');

    const accounts = await this.accountRepo.find({
      where: {
        user: { id: userId },
        type: In([AccountType.INCOME, AccountType.EXPENSE])
      }
    });

    logSuccess(`Found ${accounts.length} income/expense accounts for user ${userId}`, 'ClosingEntryService');
    return accounts;
  }

  /**
   * Calculate account balances for a specific period
   */
  async calculateAccountBalancesForPeriod(
    userId: number, 
    startDate: Date, 
    endDate: Date
  ): Promise<Map<number, number>> {
    logInfo(`Calculating account balances for period ${startDate.toISOString()} to ${endDate.toISOString()} for user ${userId}`, 'ClosingEntryService');

    const journalEntries = await this.journalEntryRepo.find({
      where: {
        transaction: {
          user: { id: userId },
          date: Between(startDate, endDate)
        }
      },
      relations: ['account', 'transaction']
    });

    const accountBalances = new Map<number, number>();

    journalEntries.forEach((entry: JournalEntry) => {
      const currentBalance = accountBalances.get(entry.account.id) || 0;
      
      // Calculate balance change based on entry type and account type
      let balanceChange = 0;
      
      if (entry.type === EntryType.DEBIT) {
        // For EXPENSE accounts, debit increases balance
        // For INCOME accounts, debit decreases balance
        if (entry.account.type === AccountType.EXPENSE) {
          balanceChange = entry.amount;
        } else if (entry.account.type === AccountType.INCOME) {
          balanceChange = -entry.amount;
        }
      } else if (entry.type === EntryType.CREDIT) {
        // For EXPENSE accounts, credit decreases balance
        // For INCOME accounts, credit increases balance
        if (entry.account.type === AccountType.EXPENSE) {
          balanceChange = -entry.amount;
        } else if (entry.account.type === AccountType.INCOME) {
          balanceChange = entry.amount;
        }
      }

      accountBalances.set(entry.account.id, currentBalance + balanceChange);
    });

    logSuccess(`Calculated balances for ${accountBalances.size} accounts for user ${userId}`, 'ClosingEntryService');
    return accountBalances;
  }

  /**
   * Generate preview of closing entries
   */
  async generateClosingEntryPreview(
    userId: number, 
    periodEndDate: string
  ): Promise<ClosingEntryPreview> {
    logInfo(`Generating closing entry preview for period ending ${periodEndDate} for user ${userId}`, 'ClosingEntryService');

    // Parse the period end date
    const endDate = new Date(periodEndDate);
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1); // Start of month

    // Get all income and expense accounts
    const accounts = await this.getIncomeExpenseAccounts(userId);
    
    // Calculate balances for the period
    const accountBalances = await this.calculateAccountBalancesForPeriod(userId, startDate, endDate);

    // Separate accounts by type
    const revenueAccounts = accounts
      .filter(account => account.type === AccountType.INCOME)
      .map(account => ({
        accountId: account.id,
        accountName: account.name,
        balance: accountBalances.get(account.id) || 0
      }))
      .filter(account => Math.abs(account.balance) > 0.01); // Only include accounts with non-zero balances

    const expenseAccounts = accounts
      .filter(account => account.type === AccountType.EXPENSE)
      .map(account => ({
        accountId: account.id,
        accountName: account.name,
        balance: accountBalances.get(account.id) || 0
      }))
      .filter(account => Math.abs(account.balance) > 0.01); // Only include accounts with non-zero balances

    // Calculate net income
    const totalRevenue = revenueAccounts.reduce((sum, account) => sum + account.balance, 0);
    const totalExpenses = expenseAccounts.reduce((sum, account) => sum + account.balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    const preview: ClosingEntryPreview = {
      revenueAccounts,
      expenseAccounts,
      netIncome,
      totalEntries: revenueAccounts.length + expenseAccounts.length + (Math.abs(netIncome) > 0.01 ? 1 : 0) // +1 for retained earnings entry
    };

    logSuccess(`Generated closing entry preview with ${preview.totalEntries} entries for user ${userId}`, 'ClosingEntryService');
    return preview;
  }

  /**
   * Create closing entries for a specified period
   */
  async createClosingEntries(
    userId: number, 
    request: ClosingEntryRequest
  ): Promise<ClosingEntryResult> {
    logInfo(`Creating closing entries for period ending ${request.periodEndDate} for user ${userId}`, 'ClosingEntryService');

    try {
      // Check if period is already closed
      const isAlreadyClosed = await this.isPeriodAlreadyClosed(userId, request.periodEndDate);
      if (isAlreadyClosed) {
        logError(`Period ${request.periodEndDate} is already closed for user ${userId}`, 'ClosingEntryService');
        return {
          success: false,
          message: `Books have already been closed for ${request.periodEndDate}. Cannot close the same period twice.`
        };
      }

      // Generate preview to get account balances
      const preview = await this.generateClosingEntryPreview(userId, request.periodEndDate);

      // Check if there are any transactions in the period
      if (preview.totalEntries === 0) {
        logError(`No transactions found for period ending ${request.periodEndDate} for user ${userId}`, 'ClosingEntryService');
        return {
          success: false,
          message: `No transactions found for the period ending ${request.periodEndDate}. Cannot close books with no activity.`
        };
      }

      // Get retained earnings account
      const retainedEarningsAccount = await this.accountRepo.findOne({
        where: {
          user: { id: userId },
          financialCategory: FinancialCategory.RETAINED_EARNINGS
        }
      });

      if (!retainedEarningsAccount) {
        logError(`Retained earnings account not found for user ${userId}`, 'ClosingEntryService');
        return {
          success: false,
          message: "Retained earnings account not found. Please ensure you have a retained earnings account set up."
        };
      }

      // Build journal entries for closing
      const entries: Array<{
        amount: number;
        type: EntryType;
        accountId: number;
      }> = [];

      // Close revenue accounts (debit to zero them)
      preview.revenueAccounts.forEach(account => {
        if (account.balance > 0.01) {
          entries.push({
            amount: account.balance,
            type: EntryType.DEBIT,
            accountId: account.accountId
          });
        }
      });

      // Close expense accounts (credit to zero them)
      preview.expenseAccounts.forEach(account => {
        if (account.balance > 0.01) {
          entries.push({
            amount: account.balance,
            type: EntryType.CREDIT,
            accountId: account.accountId
          });
        }
      });

      // Add retained earnings entry
      if (Math.abs(preview.netIncome) > 0.01) {
        entries.push({
          amount: Math.abs(preview.netIncome),
          type: preview.netIncome > 0 ? EntryType.CREDIT : EntryType.DEBIT,
          accountId: retainedEarningsAccount.id
        });
      }

      // Create the closing transaction
      const closingTransactionData: CreateTransactionDTO = {
        description: `Closing Entries - ${request.periodEndDate}`,
        date: new Date(request.periodEndDate),
        type: TransactionType.CLOSING_ENTRY,
        category: "Closing Entries",
        amount: Math.abs(preview.netIncome),
        entries,
        userId
      };

      const result = await this.transactionService.createTransaction(closingTransactionData);
      
      logSuccess(`Successfully created closing entries for period ${request.periodEndDate} for user ${userId}`, 'ClosingEntryService');

      return {
        success: true,
        message: `Books closed for ${request.periodEndDate}. Net income: $${preview.netIncome.toFixed(2)} transferred to Retained Earnings.`,
        transactionId: result.transaction.id.toString(),
        netIncome: preview.netIncome,
        entriesCreated: entries.length
      };

    } catch (error) {
      logError(`Error creating closing entries: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ClosingEntryService');
      return {
        success: false,
        message: `Failed to create closing entries: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 