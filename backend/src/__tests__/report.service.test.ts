import { AppDataSource } from '../config/data-source';
import { ReportService } from '../services/report.service';
import { Account, AccountType, FinancialCategory } from '../entities/Account';
import { JournalEntry, EntryType } from '../entities/JournalEntry';
import { User } from '../entities/User';
import { Transaction } from '../entities/Transaction';
import { TransactionType } from '../types/transaction.types';

interface AccountBalance {
  id: number;
  name: string;
  balance: number;
}

// Mock TypeORM repositories
jest.mock('../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

describe('ReportService', () => {
  let reportService: ReportService;
  let mockUser: User;
  let mockAccounts: Account[];
  let mockJournalEntries: JournalEntry[];
  let mockTransaction: Transaction;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock user
    mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashed_password',
      accounts: [],
      transactions: [],
      journalEntries: []
    };

    // Create mock transaction
    mockTransaction = {
      id: 1,
      description: 'Test Transaction',
      startDate: new Date(),
      type: TransactionType.EXPENSE,
      isRecurring: false,
      user: mockUser,
      entries: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      get date() { return this.startDate; }
    };

    // Create mock accounts
    mockAccounts = [
      {
        id: 1,
        name: 'Checking',
        type: AccountType.ASSET,
        balance: 0,
        category: 'Bank',
        subcategory: 'Checking',
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: 'CASH_AND_CASH_EQUIVALENTS',
        user: mockUser,
        transactions: [],
        journalEntries: []
      },
      {
        id: 2,
        name: 'Equipment',
        type: AccountType.ASSET,
        balance: 0,
        category: 'Fixed Assets',
        subcategory: 'Equipment',
        financialCategory: FinancialCategory.LONG_TERM_ASSET,
        financialSubcategory: 'FIXED_ASSETS',
        user: mockUser,
        transactions: [],
        journalEntries: []
      },
      {
        id: 3,
        name: 'Accounts Payable',
        type: AccountType.LIABILITY,
        balance: 0,
        category: 'Current Liabilities',
        subcategory: 'Trade Payables',
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: 'ACCOUNTS_PAYABLE',
        user: mockUser,
        transactions: [],
        journalEntries: []
      },
      {
        id: 4,
        name: 'Long-term Loan',
        type: AccountType.LIABILITY,
        balance: 0,
        category: 'Long-term Liabilities',
        subcategory: 'Loans',
        financialCategory: FinancialCategory.LONG_TERM_LIABILITY,
        financialSubcategory: 'BANK_LOANS',
        user: mockUser,
        transactions: [],
        journalEntries: []
      },
      {
        id: 5,
        name: 'Owner\'s Capital',
        type: AccountType.EQUITY,
        balance: 0,
        category: 'Equity',
        subcategory: 'Capital',
        financialCategory: FinancialCategory.EQUITY,
        financialSubcategory: 'OWNERS_EQUITY',
        user: mockUser,
        transactions: [],
        journalEntries: []
      }
    ];

    // Create mock journal entries
    mockJournalEntries = [
      {
        id: 1,
        account: mockAccounts[0], // Checking
        type: EntryType.DEBIT,
        amount: 5000,
        user: mockUser,
        transaction: mockTransaction,
        createdAt: new Date()
      },
      {
        id: 2,
        account: mockAccounts[1], // Equipment
        type: EntryType.DEBIT,
        amount: 10000,
        user: mockUser,
        transaction: mockTransaction,
        createdAt: new Date()
      },
      {
        id: 3,
        account: mockAccounts[2], // Accounts Payable
        type: EntryType.CREDIT,
        amount: 2000,
        user: mockUser,
        transaction: mockTransaction,
        createdAt: new Date()
      },
      {
        id: 4,
        account: mockAccounts[3], // Long-term Loan
        type: EntryType.CREDIT,
        amount: 50000,
        user: mockUser,
        transaction: mockTransaction,
        createdAt: new Date()
      },
      {
        id: 5,
        account: mockAccounts[4], // Owner's Capital
        type: EntryType.CREDIT,
        amount: 20000,
        user: mockUser,
        transaction: mockTransaction,
        createdAt: new Date()
      }
    ];

    // Mock repository methods
    const mockJournalEntryRepo = {
      find: jest.fn().mockResolvedValue(mockJournalEntries)
    };

    const mockAccountRepo = {
      find: jest.fn().mockResolvedValue(mockAccounts)
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === JournalEntry) return mockJournalEntryRepo;
      if (entity === Account) return mockAccountRepo;
      return null;
    });

    reportService = new ReportService();
  });

  describe('getBalanceSheet', () => {
    it('groups accounts by financial category and subcategory', async () => {
      const balanceSheet = await reportService.getBalanceSheet(mockUser.id);

      // Verify assets
      expect(balanceSheet.assets).toHaveLength(2);
      expect(balanceSheet.assets[0].subcategoryName).toBe('CASH_AND_CASH_EQUIVALENTS');
      expect(balanceSheet.assets[1].subcategoryName).toBe('FIXED_ASSETS');

      // Verify liabilities
      expect(balanceSheet.liabilities).toHaveLength(2);
      expect(balanceSheet.liabilities[0].subcategoryName).toBe('ACCOUNTS_PAYABLE');
      expect(balanceSheet.liabilities[1].subcategoryName).toBe('BANK_LOANS');

      // Verify equity
      expect(balanceSheet.equity).toHaveLength(1);
      expect(balanceSheet.equity[0].subcategoryName).toBe('OWNERS_EQUITY');
    });

    it('calculates correct account balances', async () => {
      const balanceSheet = await reportService.getBalanceSheet(mockUser.id);

      // Verify Checking account balance
      const checkingAccount = balanceSheet.assets[0].accounts.find((acc: AccountBalance) => acc.name === 'Checking');
      expect(checkingAccount?.balance).toBe(5000);

      // Verify Equipment account balance
      const equipmentAccount = balanceSheet.assets[1].accounts.find((acc: AccountBalance) => acc.name === 'Equipment');
      expect(equipmentAccount?.balance).toBe(10000);

      // Verify Accounts Payable balance
      const accountsPayable = balanceSheet.liabilities[0].accounts.find((acc: AccountBalance) => acc.name === 'Accounts Payable');
      expect(accountsPayable?.balance).toBe(-2000);

      // Verify Long-term Loan balance
      const longTermLoan = balanceSheet.liabilities[1].accounts.find((acc: AccountBalance) => acc.name === 'Long-term Loan');
      expect(longTermLoan?.balance).toBe(-50000);

      // Verify Owner's Capital balance
      const ownersCapital = balanceSheet.equity[0].accounts.find((acc: AccountBalance) => acc.name === 'Owner\'s Capital');
      expect(ownersCapital?.balance).toBe(-20000);
    });

    it('calculates correct subtotals', async () => {
      const balanceSheet = await reportService.getBalanceSheet(mockUser.id);

      // Verify asset subtotals
      expect(balanceSheet.assets[0].subtotal).toBe(5000); // Cash and equivalents
      expect(balanceSheet.assets[1].subtotal).toBe(10000); // Fixed assets

      // Verify liability subtotals
      expect(balanceSheet.liabilities[0].subtotal).toBe(-2000); // Current liabilities
      expect(balanceSheet.liabilities[1].subtotal).toBe(-50000); // Long-term liabilities

      // Verify equity subtotal
      expect(balanceSheet.equity[0].subtotal).toBe(-20000); // Owner's equity
    });

    it('maintains display order', async () => {
      const balanceSheet = await reportService.getBalanceSheet(mockUser.id);

      // Verify assets order
      expect(balanceSheet.assets[0].displayOrder).toBeLessThan(balanceSheet.assets[1].displayOrder);

      // Verify liabilities order
      expect(balanceSheet.liabilities[0].displayOrder).toBeLessThan(balanceSheet.liabilities[1].displayOrder);
    });
  });
}); 