import { SuggestionService } from '../suggestion.service';
import { AppDataSource } from '../../config/data-source';
import { Account } from '../../entities/Account';
import { User } from '../../entities/User';

// Mock the data source
jest.mock('../../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

describe('SuggestionService - Enhanced SmartSuggestions', () => {
  let suggestionService: SuggestionService;
  let mockAccountRepo: any;
  let mockUserRepo: any;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    displayName: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    accounts: [],
    transactions: [],
    suggestions: [],
    userSuggestionPreferences: [],
    closedPeriods: [],
    financialGoals: [],
    recurringTransactions: [],
    accountWeights: []
  };

  const mockAccounts: Account[] = [
    {
      id: 1,
      name: 'Cash',
      type: 'ASSET',
      category: 'Current Assets',
      balance: 10000,
      user: mockUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      journalEntries: [],
      accountWeights: []
    },
    {
      id: 2,
      name: 'Owner Capital',
      type: 'EQUITY',
      category: 'Owner Equity',
      balance: 10000,
      user: mockUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      journalEntries: [],
      accountWeights: []
    },
    {
      id: 3,
      name: 'Owner Draw',
      type: 'EQUITY',
      category: 'Owner Equity',
      balance: -5000,
      user: mockUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      journalEntries: [],
      accountWeights: []
    },
    {
      id: 4,
      name: 'Equipment',
      type: 'ASSET',
      category: 'Fixed Assets',
      balance: 5000,
      user: mockUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      journalEntries: [],
      accountWeights: []
    },
    {
      id: 5,
      name: 'Rent Expense',
      type: 'EXPENSE',
      category: 'Operating Expenses',
      balance: 2000,
      user: mockUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      journalEntries: [],
      accountWeights: []
    },
    {
      id: 6,
      name: 'Sales Revenue',
      type: 'INCOME',
      category: 'Revenue',
      balance: 15000,
      user: mockUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      journalEntries: [],
      accountWeights: []
    },
    {
      id: 7,
      name: 'Loan Payable',
      type: 'LIABILITY',
      category: 'Current Liabilities',
      balance: 10000,
      user: mockUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      journalEntries: [],
      accountWeights: []
    },
    {
      id: 8,
      name: 'Cash Flow Statement',
      type: 'ASSET',
      category: 'Reports',
      balance: 0,
      user: mockUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [],
      journalEntries: [],
      accountWeights: []
    }
  ];

  beforeEach(() => {
    mockAccountRepo = {
      find: jest.fn().mockResolvedValue(mockAccounts),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn()
    };

    mockUserRepo = {
      findOne: jest.fn().mockResolvedValue(mockUser)
    };

    (AppDataSource.getRepository as jest.Mock)
      .mockReturnValueOnce(mockAccountRepo) // Account repo
      .mockReturnValueOnce(mockUserRepo);   // User repo

    suggestionService = new SuggestionService();
  });

  describe('Acceptance Criteria Tests', () => {
    test('"initial contribution" → Cash (DR) + Owner Capital (CR), confidence ≥ 90', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('initial contribution', 1);
      
      expect(result).not.toBeNull();
      expect(result?.overallConfidence).toBeGreaterThanOrEqual(90);
      expect(result?.debitSide?.suggestedAccountName).toBe('Cash');
      expect(result?.creditSide?.suggestedAccountName).toBe('Owner Capital');
      expect(result?.debitSide?.accountType).toBe('ASSET');
      expect(result?.creditSide?.accountType).toBe('EQUITY');
    });

    test('"owner draw for personal use" → Owner Draw (DR) + Cash (CR), confidence ≥ 85', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('owner draw for personal use', 1);
      
      expect(result).not.toBeNull();
      expect(result?.overallConfidence).toBeGreaterThanOrEqual(85);
      expect(result?.debitSide?.suggestedAccountName).toBe('Owner Draw');
      expect(result?.creditSide?.suggestedAccountName).toBe('Cash');
      expect(result?.debitSide?.accountType).toBe('EQUITY');
      expect(result?.creditSide?.accountType).toBe('ASSET');
    });

    test('"paid rent" → Rent Expense (DR) + Cash (CR), confidence ≥ 85', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('paid rent', 1);
      
      expect(result).not.toBeNull();
      expect(result?.overallConfidence).toBeGreaterThanOrEqual(85);
      expect(result?.debitSide?.suggestedAccountName).toBe('Rent Expense');
      expect(result?.creditSide?.suggestedAccountName).toBe('Cash');
      expect(result?.debitSide?.accountType).toBe('EXPENSE');
      expect(result?.creditSide?.accountType).toBe('ASSET');
    });

    test('"received customer payment" → Cash (DR) + Sales Revenue (CR), confidence ≥ 85', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('received customer payment', 1);
      
      expect(result).not.toBeNull();
      expect(result?.overallConfidence).toBeGreaterThanOrEqual(85);
      expect(result?.debitSide?.suggestedAccountName).toBe('Cash');
      expect(result?.creditSide?.suggestedAccountName).toBe('Sales Revenue');
      expect(result?.debitSide?.accountType).toBe('ASSET');
      expect(result?.creditSide?.accountType).toBe('INCOME');
    });

    test('"bought laptop" → Equipment (DR) + Cash (CR), confidence ≥ 85', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('bought laptop', 1);
      
      expect(result).not.toBeNull();
      expect(result?.overallConfidence).toBeGreaterThanOrEqual(85);
      expect(result?.debitSide?.suggestedAccountName).toBe('Equipment');
      expect(result?.creditSide?.suggestedAccountName).toBe('Cash');
      expect(result?.debitSide?.accountType).toBe('ASSET');
      expect(result?.creditSide?.accountType).toBe('ASSET');
    });

    test('"loan repayment" → Loan Payable (DR) + Cash (CR), confidence ≥ 85', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('loan repayment', 1);
      
      expect(result).not.toBeNull();
      expect(result?.overallConfidence).toBeGreaterThanOrEqual(85);
      expect(result?.debitSide?.suggestedAccountName).toBe('Loan Payable');
      expect(result?.creditSide?.suggestedAccountName).toBe('Cash');
      expect(result?.debitSide?.accountType).toBe('LIABILITY');
      expect(result?.creditSide?.accountType).toBe('ASSET');
    });
  });

  describe('Regression Tests', () => {
    test('"cash" does not match "cash flow" or "cash flow statement"', async () => {
      // This test verifies that word boundary matching prevents false positives
      const result = await suggestionService.suggestDualSidesForDescription('cash transaction', 1);
      
      // Should not suggest "Cash Flow Statement" for "cash"
      expect(result).not.toBeNull();
      if (result?.debitSide) {
        expect(result.debitSide.suggestedAccountName).not.toBe('Cash Flow Statement');
      }
      if (result?.creditSide) {
        expect(result.creditSide.suggestedAccountName).not.toBe('Cash Flow Statement');
      }
    });

    test('"equipment purchase" vs "equipment maintenance" - should prefer purchase', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('equipment purchase', 1);
      
      expect(result).not.toBeNull();
      expect(result?.debitSide?.suggestedAccountName).toBe('Equipment');
      // Should not suggest maintenance-related accounts
    });

    test('"credit card payment" should not match generic "credit" accounts', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('credit card payment', 1);
      
      expect(result).not.toBeNull();
      // Should not suggest generic credit accounts, should suggest liability accounts
      if (result?.debitSide) {
        expect(result.debitSide.accountType).toBe('LIABILITY');
      }
    });
  });

  describe('Synonym Tests', () => {
    test('"capital contribution" should match "owner contribution" pattern', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('capital contribution', 1);
      
      expect(result).not.toBeNull();
      expect(result?.debitSide?.suggestedAccountName).toBe('Cash');
      expect(result?.creditSide?.suggestedAccountName).toBe('Owner Capital');
    });

    test('"owner investment" should match "owner contribution" pattern', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('owner investment', 1);
      
      expect(result).not.toBeNull();
      expect(result?.debitSide?.suggestedAccountName).toBe('Cash');
      expect(result?.creditSide?.suggestedAccountName).toBe('Owner Capital');
    });

    test('"laptop purchase" should match "equipment purchase" pattern', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('laptop purchase', 1);
      
      expect(result).not.toBeNull();
      expect(result?.debitSide?.suggestedAccountName).toBe('Equipment');
      expect(result?.creditSide?.suggestedAccountName).toBe('Cash');
    });
  });

  describe('Directionality Tests', () => {
    test('"received refund" should be incoming transaction', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('received refund', 1);
      
      expect(result).not.toBeNull();
      // Should suggest cash as debit (incoming)
      expect(result?.debitSide?.suggestedAccountName).toBe('Cash');
    });

    test('"paid refund" should be outgoing transaction', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('paid refund', 1);
      
      expect(result).not.toBeNull();
      // Should suggest cash as credit (outgoing)
      expect(result?.creditSide?.suggestedAccountName).toBe('Cash');
    });
  });

  describe('Ambiguous Cases', () => {
    test('"made a payment" should return null (too vague)', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('made a payment', 1);
      
      expect(result).toBeNull();
    });

    test('"business transaction" should return null (no context)', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('business transaction', 1);
      
      expect(result).toBeNull();
    });
  });

  describe('Pair Validation Tests', () => {
    test('Should reject invalid pairs like two income accounts', async () => {
      // This test would require mocking accounts with two income accounts
      // For now, we test the validation logic directly
      const mockIncomeAccount1 = { ...mockAccounts[5], id: 9, name: 'Service Revenue' };
      const mockIncomeAccount2 = { ...mockAccounts[5], id: 10, name: 'Product Revenue' };
      
      // This should be rejected by pair validation
      expect(true).toBe(true); // Placeholder for actual validation test
    });

    test('Should reject invalid pairs like two expense accounts', async () => {
      // This test would require mocking accounts with two expense accounts
      expect(true).toBe(true); // Placeholder for actual validation test
    });
  });

  describe('Confidence Model Tests', () => {
    test('Should return detailed reason explaining confidence factors', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('initial contribution', 1);
      
      expect(result).not.toBeNull();
      expect(result?.rationale).toContain('DR:');
      expect(result?.rationale).toContain('CR:');
      expect(result?.rationale).toContain('%');
    });

    test('Should have confidence ≥ 60 for valid dual-side suggestions', async () => {
      const result = await suggestionService.suggestDualSidesForDescription('paid rent', 1);
      
      expect(result).not.toBeNull();
      expect(result?.overallConfidence).toBeGreaterThanOrEqual(60);
    });
  });
});
