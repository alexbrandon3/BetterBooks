import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { JournalEntry } from "../entities/JournalEntry";
import { Account } from "../entities/Account";
import { Between } from "typeorm";
import { FinancialCategory } from "../entities/Account";
import { EntryType } from "../types/transaction.types";

interface AccountBalance {
  id: number;
  name: string;
  balance: number;
}

interface SubcategoryGroup {
  subcategoryName: string;
  accounts: AccountBalance[];
  subtotal: number;
  displayOrder: number;
}

interface BalanceSheetResponse {
  assets: SubcategoryGroup[];
  liabilities: SubcategoryGroup[];
  equity: SubcategoryGroup[];
}

export class ReportService {
  private transactionRepo = AppDataSource.getRepository(Transaction);
  private journalEntryRepo = AppDataSource.getRepository(JournalEntry);

  async getIncomeTransactions(userId: number) {
    return this.transactionRepo.find({
      where: { user: { id: userId } },
      relations: ["entries", "entries.account"],
    });
  }

  async getExpenseTransactions(userId: number) {
    return this.transactionRepo.find({
      where: { user: { id: userId } },
      relations: ["entries", "entries.account"],
    });
  }

  async getNetWorth(userId: number) {
    const entries = await this.journalEntryRepo.find({
      where: { transaction: { user: { id: userId } } },
      relations: ["account", "transaction"],
    });

    let totalAssets = 0;
    let totalLiabilities = 0;

    entries.forEach((entry: JournalEntry) => {
      if (entry.account.financialCategory === FinancialCategory.CURRENT_ASSET || 
          entry.account.financialCategory === FinancialCategory.FIXED_ASSET) {
        totalAssets += entry.amount;
      } else if (entry.account.financialCategory === FinancialCategory.CURRENT_LIABILITY || 
                 entry.account.financialCategory === FinancialCategory.LONG_TERM_LIABILITY) {
        totalLiabilities += entry.amount;
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };
  }

  async getCashFlow(userId: number, startDate: Date, endDate: Date) {
    const entries = await this.journalEntryRepo.find({
      where: {
        transaction: {
          user: { id: userId },
          date: Between(startDate, endDate),
        },
      },
      relations: ["account", "transaction"],
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    entries.forEach((entry: JournalEntry) => {
      if (entry.type === EntryType.CREDIT) {
        totalIncome += entry.amount;
      } else if (entry.type === EntryType.DEBIT) {
        totalExpenses += entry.amount;
      }
    });

    return {
      totalIncome,
      totalExpenses,
      netCashFlow: totalIncome - totalExpenses,
    };
  }

  /**
   * Get balance sheet for a user
   * Note: This method always calculates account balances fresh from journal entries
   * to ensure consistency with the actual transaction data, regardless of the
   * stored account.balance field values.
   */
  async getBalanceSheet(userId: number): Promise<BalanceSheetResponse> {
    console.log('🔍 Getting balance sheet for user:', userId);
    
    const journalEntries = await this.journalEntryRepo.find({
      where: { transaction: { user: { id: userId } } },
      relations: ['account', 'transaction']
    });

    console.log('📊 Found journal entries:', journalEntries.length);

    const accounts = await AppDataSource.getRepository(Account).find({
      where: { user: { id: userId } }
    });

    console.log('🏦 Found accounts:', accounts.length);

    // Calculate balances for each account from journal entries (always fresh calculation)
    const accountBalances = new Map<number, number>();
    accounts.forEach((account: any) => {
      accountBalances.set(account.id, 0);
    });

    journalEntries.forEach((entry: JournalEntry) => {
      const currentBalance = accountBalances.get(entry.account.id) || 0;
      
      // Determine the normal balance direction for this account type
      let normalBalanceMultiplier = 1;
      switch (entry.account.financialCategory) {
        case FinancialCategory.CURRENT_ASSET:
        case FinancialCategory.FIXED_ASSET:
          // Assets normally have debit balances (positive)
          normalBalanceMultiplier = 1;
          break;
        case FinancialCategory.CURRENT_LIABILITY:
        case FinancialCategory.LONG_TERM_LIABILITY:
          // Liabilities normally have credit balances (positive)
          normalBalanceMultiplier = -1;
          break;
        case FinancialCategory.EQUITY:
        case FinancialCategory.RETAINED_EARNINGS:
        case FinancialCategory.DRAWINGS:
          // Equity accounts normally have credit balances (positive)
          normalBalanceMultiplier = -1;
          break;
        default:
          // For other categories, use default behavior
          normalBalanceMultiplier = 1;
      }
      
      // Calculate the balance change
      const balanceChange = entry.type === EntryType.DEBIT ? entry.amount : -entry.amount;
      const adjustedChange = balanceChange * normalBalanceMultiplier;
      
      console.log(`📝 Entry: Account ${entry.account.name} (${entry.account.financialCategory}) - Type: ${entry.type}, Amount: ${entry.amount}, Balance Change: ${adjustedChange}`);
      
      accountBalances.set(entry.account.id, currentBalance + adjustedChange);
    });

    console.log('💰 Account balances (calculated from journal entries):', Object.fromEntries(accountBalances));

    // Group accounts by category and subcategory
    const groupedAccounts = new Map<string, Map<string, AccountBalance[]>>();
    const subcategoryOrder = new Map<string, number>();
    let orderCounter = 0;

    accounts.forEach((account: any) => {
      let category: string;
      switch (account.financialCategory) {
        case FinancialCategory.CURRENT_ASSET:
        case FinancialCategory.FIXED_ASSET:
          category = 'asset';
          break;
        case FinancialCategory.CURRENT_LIABILITY:
        case FinancialCategory.LONG_TERM_LIABILITY:
          category = 'liability';
          break;
        case FinancialCategory.EQUITY:
        case FinancialCategory.RETAINED_EARNINGS:
        case FinancialCategory.DRAWINGS:
          category = 'equity';
          break;
        default:
          return; // Skip other categories
      }
      
      const subcategory = account.financialSubcategory;
      
      if (!groupedAccounts.has(category)) {
        groupedAccounts.set(category, new Map());
      }
      
      const categoryMap = groupedAccounts.get(category)!;
      if (!categoryMap.has(subcategory)) {
        categoryMap.set(subcategory, []);
        subcategoryOrder.set(subcategory, orderCounter++);
      }
      
      const balance = accountBalances.get(account.id) || 0;
      categoryMap.get(subcategory)!.push({
        id: account.id,
        name: account.name,
        balance
      });
    });

    // Convert to response format
    const response: BalanceSheetResponse = {
      assets: [],
      liabilities: [],
      equity: []
    };

    // Helper function to create subcategory groups
    const createSubcategoryGroups = (category: string): SubcategoryGroup[] => {
      const categoryMap = groupedAccounts.get(category);
      if (!categoryMap) return [];

      return Array.from(categoryMap.entries())
        .map(([subcategory, accounts]) => ({
          subcategoryName: subcategory,
          accounts: accounts.sort((a, b) => a.name.localeCompare(b.name)),
          subtotal: accounts.reduce((sum, acc) => sum + acc.balance, 0),
          displayOrder: subcategoryOrder.get(subcategory) || 0
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder);
    };

    // Populate response
    response.assets = createSubcategoryGroups('asset');
    response.liabilities = createSubcategoryGroups('liability');
    response.equity = createSubcategoryGroups('equity');

    console.log('📈 Balance sheet response:', response);
    return response;
  }

  async generateIncomeStatement(userId: number, startDate: string, endDate: string) {
    console.log('🔍 Generating income statement for user:', userId, 'from', startDate, 'to', endDate);
    
    // Ensure we have valid dates
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1); // Start of year
    const end = endDate ? new Date(endDate) : new Date(); // Today
    
    console.log('📅 Using date range:', { start: start.toISOString(), end: end.toISOString() });
    
    const entries = await this.journalEntryRepo.find({
      where: {
        transaction: {
          user: { id: userId },
          date: Between(start, end),
        },
      },
      relations: ["account", "transaction"],
    });

    console.log('📊 Found entries for income statement:', entries.length);

    // Get all accounts for the user
    const accounts = await AppDataSource.getRepository(Account).find({
      where: { user: { id: userId } }
    });

    // Calculate account balances for the period
    const accountBalances = new Map<number, number>();
    accounts.forEach((account: any) => {
      accountBalances.set(account.id, 0);
    });

    entries.forEach((entry: JournalEntry) => {
      const currentBalance = accountBalances.get(entry.account.id) || 0;
      const amount = parseFloat(entry.amount.toString());
      
      // For income statement accounts, we need to consider the normal balance direction
      let balanceChange = 0;
      
      if (entry.account.financialCategory === FinancialCategory.OPERATING_REVENUE || 
          entry.account.financialCategory === FinancialCategory.NON_OPERATING_REVENUE) {
        // Revenue accounts: credits increase income (positive), debits decrease income (negative)
        balanceChange = entry.type === EntryType.CREDIT ? amount : -amount;
      } else if (entry.account.financialCategory === FinancialCategory.OPERATING_EXPENSE || 
                 entry.account.financialCategory === FinancialCategory.NON_OPERATING_EXPENSE) {
        // Expense accounts: debits increase expenses (positive), credits decrease expenses (negative)
        balanceChange = entry.type === EntryType.DEBIT ? amount : -amount;
      }
      
      accountBalances.set(entry.account.id, currentBalance + balanceChange);
    });

    // Group accounts by revenue and expense categories
    const revenueAccounts = new Map<string, AccountBalance[]>();
    const expenseAccounts = new Map<string, AccountBalance[]>();
    const subcategoryOrder = new Map<string, number>();
    let orderCounter = 0;

    accounts.forEach((account: any) => {
      const balance = accountBalances.get(account.id) || 0;
      
      // Skip accounts with zero balance for the period
      if (balance === 0) return;
      
      if (account.financialCategory === FinancialCategory.OPERATING_REVENUE || 
          account.financialCategory === FinancialCategory.NON_OPERATING_REVENUE) {
        const subcategory = account.financialSubcategory || 'OTHER_REVENUE';
        
        if (!revenueAccounts.has(subcategory)) {
          revenueAccounts.set(subcategory, []);
          subcategoryOrder.set(subcategory, orderCounter++);
        }
        
        revenueAccounts.get(subcategory)!.push({
          id: account.id,
          name: account.name,
          balance
        });
      } else if (account.financialCategory === FinancialCategory.OPERATING_EXPENSE || 
                 account.financialCategory === FinancialCategory.NON_OPERATING_EXPENSE) {
        const subcategory = account.financialSubcategory || 'OTHER_EXPENSE';
        
        if (!expenseAccounts.has(subcategory)) {
          expenseAccounts.set(subcategory, []);
          subcategoryOrder.set(subcategory, orderCounter++);
        }
        
        expenseAccounts.get(subcategory)!.push({
          id: account.id,
          name: account.name,
          balance
        });
      }
    });

    // Helper function to create subcategory groups
    const createSubcategoryGroups = (accountMap: Map<string, AccountBalance[]>): SubcategoryGroup[] => {
      return Array.from(accountMap.entries())
        .map(([subcategory, accounts]) => ({
          subcategoryName: subcategory,
          accounts: accounts.sort((a, b) => a.name.localeCompare(b.name)),
          subtotal: accounts.reduce((sum, acc) => sum + acc.balance, 0),
          displayOrder: subcategoryOrder.get(subcategory) || 0
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder);
    };

    const revenueGroups = createSubcategoryGroups(revenueAccounts);
    const expenseGroups = createSubcategoryGroups(expenseAccounts);

    const totalIncome = revenueGroups.reduce((sum, group) => sum + group.subtotal, 0);
    const totalExpenses = expenseGroups.reduce((sum, group) => sum + group.subtotal, 0);

    const result = {
      revenue: revenueGroups,
      expenses: expenseGroups,
      totalIncome: Number(totalIncome),
      totalExpenses: Number(totalExpenses),
      netIncome: Number(totalIncome - totalExpenses),
    };

    console.log('💰 Enhanced income statement result:', result);
    return result;
  }
}
