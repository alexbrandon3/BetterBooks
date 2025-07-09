import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { JournalEntry } from "../entities/JournalEntry";
import { Account, FinancialCategory } from "../entities/Account";
import { Between } from "typeorm";
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

export interface BalanceSheet {
  assets: {
    current: {
      subcategories: Record<string, number>;
      total: number;
    };
    longTerm: {
      subcategories: Record<string, number>;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      subcategories: Record<string, number>;
      total: number;
    };
    longTerm: {
      subcategories: Record<string, number>;
      total: number;
    };
    total: number;
  };
  equity: {
    subcategories: Record<string, number>;
    total: number;
  };
}

export interface IncomeStatement {
  revenue: {
    subcategories: Record<string, number>;
    total: number;
  };
  expenses: {
    subcategories: Record<string, number>;
    total: number;
  };
  netIncome: number;
}

export interface CashFlow {
  operating: {
    subcategories: Record<string, number>;
    total: number;
  };
  investing: {
    subcategories: Record<string, number>;
    total: number;
  };
  financing: {
    subcategories: Record<string, number>;
    total: number;
  };
  netCashFlow: number;
}

export interface DrillDownTransaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  accountName: string;
  accountType: string;
  financialCategory: string;
  financialSubcategory: string;
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

  async getDrillDown(
    userId: number,
    type: string,
    accountId?: number,
    subcategory?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DrillDownTransaction[]> {
    console.log('🔍 Drill-down request:', {
      userId,
      type,
      accountId,
      subcategory,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });

    // Build the base query
    const queryBuilder = this.journalEntryRepo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.transaction', 'transaction')
      .leftJoinAndSelect('entry.account', 'account')
      .where('transaction.user.id = :userId', { userId });

    // Add date range filter if provided
    if (startDate && endDate) {
      queryBuilder.andWhere('transaction.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    // Add account filter if accountId is provided
    if (accountId) {
      queryBuilder.andWhere('account.id = :accountId', { accountId });
    }

    // Add subcategory filter if subcategory is provided
    if (subcategory) {
      // If we're drilling down by subcategory, we want to see all entries for transactions
      // that have at least one entry for an account in this subcategory
      queryBuilder.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('je.transactionId')
          .from('journal_entry', 'je')
          .leftJoin('account', 'acc', 'je.accountId = acc.id')
          .where('acc.financialSubcategory = :subcategory', { subcategory });
        return 'transaction.id IN ' + subQuery.getQuery();
      });
    }

    // For drill-down, we want to show all transactions that involve the selected account
    // So we don't filter by account type - we want to see all entries for transactions
    // that have at least one entry matching our criteria
    if (accountId) {
      // If we're drilling down by account, we want to see all entries for transactions
      // that have at least one entry for this account
      queryBuilder.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('je.transactionId')
          .from('journal_entry', 'je')
          .where('je.accountId = :accountId', { accountId });
        return 'transaction.id IN ' + subQuery.getQuery();
      });
    }

    // Order by date descending (most recent first)
    queryBuilder.orderBy('transaction.date', 'DESC');

    const entries = await queryBuilder.getMany();

    console.log('📊 Found entries for drill-down:', entries.length);
    console.log('🔍 Query parameters:', {
      userId,
      type,
      accountId,
      subcategory,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });

    // Transform to DrillDownTransaction format
    const transactions: DrillDownTransaction[] = entries.map(entry => ({
      id: Number(entry.transaction.id),
      date: entry.transaction.date.toISOString().split('T')[0],
      description: entry.transaction.description || 'No description',
      amount: entry.amount,
      type: entry.type as 'DEBIT' | 'CREDIT',
      accountName: entry.account.name,
      accountType: entry.account.type,
      financialCategory: entry.account.financialCategory,
      financialSubcategory: entry.account.financialSubcategory
    }));

    return transactions;
  }
}
