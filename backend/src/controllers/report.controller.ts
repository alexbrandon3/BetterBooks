import { Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { JournalEntry, EntryType } from '../entities/JournalEntry';
import { Account, FinancialCategory } from '../entities/Account';
import { getUser } from '../utils/getUser';
import { AuthenticatedRequest } from '../types/express';
import { ReportService } from '../services/report.service';

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

const journalEntryRepo = AppDataSource.getRepository(JournalEntry);
const accountRepo = AppDataSource.getRepository(Account);
const reportService = new ReportService();

export const getBalanceSheet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await getUser(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const journalEntries = await journalEntryRepo.find({
      where: { user: { id: user.id } },
      relations: ['account']
    });

    const accounts = await accountRepo.find({
      where: { user: { id: user.id } }
    });

    // Calculate balances for each account
    const accountBalances = new Map<number, number>();
    accounts.forEach((account: Account) => {
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

    accounts.forEach((account: Account) => {
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

    res.json(response);
  } catch (error) {
    console.error('Error generating balance sheet:', error);
    res.status(500).json({ message: 'Failed to generate balance sheet' });
  }
};

export const getIncomeStatement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await getUser(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { startDate, endDate } = req.query;
    const result = await reportService.generateIncomeStatement(user.id, startDate as string, endDate as string);
    res.json(result);
  } catch (error) {
    console.error('Error generating income statement:', error);
    res.status(500).json({ message: 'Failed to generate income statement' });
  }
};
