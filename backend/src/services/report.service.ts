import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { JournalEntry, EntryType } from "../entities/JournalEntry";
import { Between } from "typeorm";
import { FinancialCategory } from "../entities/Account";

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
          entry.account.financialCategory === FinancialCategory.LONG_TERM_ASSET) {
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
          startDate: Between(startDate, endDate),
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

  async getBalanceSheet(userId: number): Promise<BalanceSheetResponse> {
    const journalEntries = await this.journalEntryRepo.find({
      where: { user: { id: userId } },
      relations: ['account']
    });

    const accounts = await AppDataSource.getRepository('Account').find({
      where: { user: { id: userId } }
    });

    // Calculate balances for each account
    const accountBalances = new Map<number, number>();
    accounts.forEach((account: any) => {
      accountBalances.set(account.id, 0);
    });

    journalEntries.forEach((entry: JournalEntry) => {
      const currentBalance = accountBalances.get(entry.account.id) || 0;
      const amount = entry.type === EntryType.DEBIT ? entry.amount : -entry.amount;
      accountBalances.set(entry.account.id, currentBalance + amount);
    });

    // Group accounts by category and subcategory
    const groupedAccounts = new Map<string, Map<string, AccountBalance[]>>();
    const subcategoryOrder = new Map<string, number>();
    let orderCounter = 0;

    accounts.forEach((account: any) => {
      let category: string;
      switch (account.financialCategory) {
        case FinancialCategory.CURRENT_ASSET:
        case FinancialCategory.LONG_TERM_ASSET:
          category = 'asset';
          break;
        case FinancialCategory.CURRENT_LIABILITY:
        case FinancialCategory.LONG_TERM_LIABILITY:
          category = 'liability';
          break;
        case FinancialCategory.EQUITY:
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

    return response;
  }

  async generateIncomeStatement(userId: number, startDate: string, endDate: string) {
    const entries = await this.journalEntryRepo.find({
      where: {
        transaction: {
          user: { id: userId },
          startDate: Between(new Date(startDate), new Date(endDate)),
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
      netIncome: totalIncome - totalExpenses,
      period: {
        startDate,
        endDate
      }
    };
  }
}
