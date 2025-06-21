import { getSuggestedMetadata, validateAndCleanFinancialSubcategory, validateAccountMetadata } from '../utils/accountCategorizer';
import { AccountType, FinancialCategory } from '../entities/Account';
import { SuggestionService } from "../services/suggestion.service";
import { AppDataSource } from "../data-source";

// Mock the data source
jest.mock("../data-source", () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

describe("getSuggestedMetadata", () => {
  it("returns suggestion for Petty Cash", () => {
    const result = getSuggestedMetadata("Petty Cash");
    expect(result).toMatchObject({
      type: AccountType.ASSET,
      category: "Cash",
      subcategory: "Petty Cash",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "CASH_AND_CASH_EQUIVALENTS"
    });
  });

  it("returns suggestion for Supplies Expense", () => {
    const result = getSuggestedMetadata("Office Supplies Expense");
    expect(result).toMatchObject({
      type: AccountType.EXPENSE,
      category: "Office",
      subcategory: "Supplies",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "GENERAL_ADMINISTRATIVE"
    });
  });

  it("returns suggestion for Loan Payable", () => {
    const result = getSuggestedMetadata("Business Loan Debt");
    expect(result).toMatchObject({
      type: AccountType.LIABILITY,
      category: "Loans",
      subcategory: "Business Loan",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "BANK_LOANS"
    });
  });

  it("returns suggestion for Accounts Payable", () => {
    const result = getSuggestedMetadata("Accounts Payable");
    expect(result).toMatchObject({
      type: AccountType.LIABILITY,
      category: "Current Liabilities",
      subcategory: "Accounts Payable",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "ACCOUNTS_PAYABLE"
    });
  });

  it("returns null for unrecognized description", () => {
    const result = getSuggestedMetadata("Unicorn NFT");
    expect(result).toBeNull();
  });

  it("should categorize accounts payable correctly", () => {
    const result = getSuggestedMetadata("Accounts Payable");
    expect(result).toEqual({
      type: AccountType.LIABILITY,
      category: "Current Liabilities",
      subcategory: "Accounts Payable",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "ACCOUNTS_PAYABLE"
    });
  });

  it("should categorize accounts receivable correctly", () => {
    const result = getSuggestedMetadata("Accounts Receivable");
    expect(result).toEqual({
      type: AccountType.ASSET,
      category: "Sales",
      subcategory: "Accounts Receivable",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "ACCOUNTS_RECEIVABLE"
    });
  });

  it("should return null for unknown account types", () => {
    const result = getSuggestedMetadata("Unknown Account Type");
    expect(result).toBeNull();
  });
});

describe("SuggestionService - suggestAccountForDescription", () => {
  let suggestionService: SuggestionService;
  let mockAccountRepo: any;

  beforeEach(() => {
    mockAccountRepo = {
      find: jest.fn()
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockAccountRepo);
    suggestionService = new SuggestionService();
  });

  it("returns null for empty description", async () => {
    const result = await suggestionService.suggestAccountForDescription("", 1);
    expect(result).toBeNull();
  });

  it("returns null for whitespace-only description", async () => {
    const result = await suggestionService.suggestAccountForDescription("   ", 1);
    expect(result).toBeNull();
  });

  it("suggests food account for restaurant description", async () => {
    const mockAccounts = [
      {
        id: 1,
        name: "Meals & Entertainment",
        type: "EXPENSE",
        category: "Food",
        subcategory: "Dining",
        updatedAt: new Date()
      }
    ];

    mockAccountRepo.find.mockResolvedValue(mockAccounts);

    const result = await suggestionService.suggestAccountForDescription("Dinner at restaurant", 1);
    
    expect(result).toMatchObject({
      suggestedAccountId: 1,
      suggestedAccountName: "Meals & Entertainment",
      reason: "Matched keyword: 'restaurant' → Category: Food"
    });
  });

  it("suggests transportation account for gas description", async () => {
    const mockAccounts = [
      {
        id: 2,
        name: "Fuel",
        type: "EXPENSE",
        category: "Transportation",
        subcategory: "Fuel",
        updatedAt: new Date()
      }
    ];

    mockAccountRepo.find.mockResolvedValue(mockAccounts);

    const result = await suggestionService.suggestAccountForDescription("Gas station", 1);
    
    expect(result).toMatchObject({
      suggestedAccountId: 2,
      suggestedAccountName: "Fuel",
      reason: "Matched keyword: 'gas' → Category: Transportation"
    });
  });

  it("returns null when no matching account found", async () => {
    const mockAccounts = [
      {
        id: 1,
        name: "Checking",
        type: "ASSET",
        category: "Bank",
        subcategory: "Checking",
        updatedAt: new Date()
      }
    ];

    mockAccountRepo.find.mockResolvedValue(mockAccounts);

    const result = await suggestionService.suggestAccountForDescription("Dinner at restaurant", 1);
    expect(result).toBeNull();
  });
});

describe('validateAndCleanFinancialSubcategory', () => {
  it('should return valid subcategories as-is', () => {
    expect(validateAndCleanFinancialSubcategory('ACCOUNTS_PAYABLE')).toBe('ACCOUNTS_PAYABLE');
    expect(validateAndCleanFinancialSubcategory('CASH_AND_EQUIVALENTS')).toBe('CASH_AND_EQUIVALENTS');
  });

  it('should map user-friendly names to proper subcategories', () => {
    expect(validateAndCleanFinancialSubcategory('accounts payable')).toBe('ACCOUNTS_PAYABLE');
    expect(validateAndCleanFinancialSubcategory('payables')).toBe('ACCOUNTS_PAYABLE');
    expect(validateAndCleanFinancialSubcategory('Accounts Payable')).toBe('ACCOUNTS_PAYABLE');
    expect(validateAndCleanFinancialSubcategory('cash')).toBe('CASH_AND_EQUIVALENTS');
    expect(validateAndCleanFinancialSubcategory('office supplies')).toBe('OFFICE_SUPPLIES');
  });

  it('should handle partial matches', () => {
    expect(validateAndCleanFinancialSubcategory('payable')).toBe('ACCOUNTS_PAYABLE');
    expect(validateAndCleanFinancialSubcategory('receivable')).toBe('ACCOUNTS_RECEIVABLE');
  });

  it('should clean and format unknown subcategories', () => {
    expect(validateAndCleanFinancialSubcategory('my custom expense')).toBe('MY_CUSTOM_EXPENSE');
    expect(validateAndCleanFinancialSubcategory('test account')).toBe('TEST_ACCOUNT');
  });

  it('should return UNCATEGORIZED for empty or invalid input', () => {
    expect(validateAndCleanFinancialSubcategory('')).toBe('UNCATEGORIZED');
    expect(validateAndCleanFinancialSubcategory('   ')).toBe('UNCATEGORIZED');
    expect(validateAndCleanFinancialSubcategory('invalid@#$%')).toBe('UNCATEGORIZED');
  });
});

describe('validateAccountMetadata', () => {
  it('should validate and clean complete metadata', () => {
    const input = {
      type: AccountType.LIABILITY,
      category: 'Current Liabilities',
      subcategory: 'Accounts Payable',
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: 'accounts payable'
    };

    const result = validateAccountMetadata(input);

    expect(result).toEqual({
      type: AccountType.LIABILITY,
      category: 'Current Liabilities',
      subcategory: 'Accounts Payable',
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: 'ACCOUNTS_PAYABLE'
    });
  });

  it('should provide defaults for missing fields', () => {
    const input = {
      type: AccountType.ASSET
    };

    const result = validateAccountMetadata(input);

    expect(result).toEqual({
      type: AccountType.ASSET,
      category: 'Uncategorized',
      subcategory: '',
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: 'UNCATEGORIZED'
    });
  });

  it('should handle empty input', () => {
    const result = validateAccountMetadata({});

    expect(result).toEqual({
      type: AccountType.ASSET,
      category: 'Uncategorized',
      subcategory: '',
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: 'UNCATEGORIZED'
    });
  });
}); 