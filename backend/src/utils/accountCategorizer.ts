import { AccountType, FinancialCategory } from "../entities/Account";

interface AccountMetadata {
  type: AccountType;
  category: string;
  subcategory: string;
  financialCategory: FinancialCategory;
  financialSubcategory: string;
}

// Valid financial subcategory names to prevent display issues
const VALID_FINANCIAL_SUBCATEGORIES = [
  'ACCOUNTS_PAYABLE',
  'ACCOUNTS_RECEIVABLE',
  'CASH_AND_EQUIVALENTS',
  'PREPAID_EXPENSES',
  'INVENTORY',
  'FIXED_ASSETS',
  'ACCUMULATED_DEPRECIATION',
  'SHORT_TERM_DEBT',
  'LONG_TERM_DEBT',
  'RETAINED_EARNINGS',
  'COMMON_STOCK',
  'PREFERRED_STOCK',
  'OPERATING_REVENUE',
  'NON_OPERATING_REVENUE',
  'OPERATING_EXPENSE',
  'NON_OPERATING_EXPENSE',
  'COST_OF_GOODS_SOLD',
  'SALES_REVENUE',
  'SERVICE_REVENUE',
  'INTEREST_EXPENSE',
  'TAX_EXPENSE',
  'DEPRECIATION_EXPENSE',
  'AMORTIZATION_EXPENSE',
  'BAD_DEBT_EXPENSE',
  'RENT_EXPENSE',
  'UTILITIES_EXPENSE',
  'SALARY_EXPENSE',
  'WAGE_EXPENSE',
  'INSURANCE_EXPENSE',
  'ADVERTISING_EXPENSE',
  'MAINTENANCE_EXPENSE',
  'TRAVEL_EXPENSE',
  'MEAL_EXPENSE',
  'OFFICE_SUPPLIES',
  'TECHNOLOGY_EXPENSE',
  'LEGAL_EXPENSE',
  'ACCOUNTING_EXPENSE',
  'BANK_FEES',
  'CREDIT_CARD_FEES',
  'INTEREST_INCOME',
  'DIVIDEND_INCOME',
  'GAIN_ON_SALE',
  'LOSS_ON_SALE',
  'UNCATEGORIZED'
] as const;

type ValidFinancialSubcategory = typeof VALID_FINANCIAL_SUBCATEGORIES[number];

/**
 * Validates and cleans up financial subcategory names
 */
export const validateAndCleanFinancialSubcategory = (subcategory: string): string => {
  if (!subcategory) return 'UNCATEGORIZED';
  
  // If it's already a valid subcategory, return as is
  if (VALID_FINANCIAL_SUBCATEGORIES.includes(subcategory as ValidFinancialSubcategory)) {
    return subcategory;
  }
  
  // Try to match common variations
  const lowerSubcategory = subcategory.toLowerCase();
  
  // Common mappings for user-friendly names to proper subcategories
  const subcategoryMappings: Record<string, ValidFinancialSubcategory> = {
    'accounts payable': 'ACCOUNTS_PAYABLE',
    'payables': 'ACCOUNTS_PAYABLE',
    'accounts receivable': 'ACCOUNTS_RECEIVABLE',
    'receivables': 'ACCOUNTS_RECEIVABLE',
    'cash': 'CASH_AND_EQUIVALENTS',
    'cash and cash equivalents': 'CASH_AND_EQUIVALENTS',
    'prepaid expenses': 'PREPAID_EXPENSES',
    'inventory': 'INVENTORY',
    'fixed assets': 'FIXED_ASSETS',
    'accumulated depreciation': 'ACCUMULATED_DEPRECIATION',
    'short term debt': 'SHORT_TERM_DEBT',
    'long term debt': 'LONG_TERM_DEBT',
    'retained earnings': 'RETAINED_EARNINGS',
    'common stock': 'COMMON_STOCK',
    'preferred stock': 'PREFERRED_STOCK',
    'operating revenue': 'OPERATING_REVENUE',
    'non operating revenue': 'NON_OPERATING_REVENUE',
    'operating expense': 'OPERATING_EXPENSE',
    'non operating expense': 'NON_OPERATING_EXPENSE',
    'cost of goods sold': 'COST_OF_GOODS_SOLD',
    'cogs': 'COST_OF_GOODS_SOLD',
    'sales revenue': 'SALES_REVENUE',
    'service revenue': 'SERVICE_REVENUE',
    'interest expense': 'INTEREST_EXPENSE',
    'tax expense': 'TAX_EXPENSE',
    'depreciation expense': 'DEPRECIATION_EXPENSE',
    'amortization expense': 'AMORTIZATION_EXPENSE',
    'bad debt expense': 'BAD_DEBT_EXPENSE',
    'rent expense': 'RENT_EXPENSE',
    'utilities expense': 'UTILITIES_EXPENSE',
    'salary expense': 'SALARY_EXPENSE',
    'wage expense': 'WAGE_EXPENSE',
    'insurance expense': 'INSURANCE_EXPENSE',
    'advertising expense': 'ADVERTISING_EXPENSE',
    'maintenance expense': 'MAINTENANCE_EXPENSE',
    'travel expense': 'TRAVEL_EXPENSE',
    'meal expense': 'MEAL_EXPENSE',
    'office supplies': 'OFFICE_SUPPLIES',
    'technology expense': 'TECHNOLOGY_EXPENSE',
    'legal expense': 'LEGAL_EXPENSE',
    'accounting expense': 'ACCOUNTING_EXPENSE',
    'bank fees': 'BANK_FEES',
    'credit card fees': 'CREDIT_CARD_FEES',
    'interest income': 'INTEREST_INCOME',
    'dividend income': 'DIVIDEND_INCOME',
    'gain on sale': 'GAIN_ON_SALE',
    'loss on sale': 'LOSS_ON_SALE',
    'uncategorized': 'UNCATEGORIZED'
  };
  
  // Check for exact matches in mappings
  if (subcategoryMappings[lowerSubcategory]) {
    return subcategoryMappings[lowerSubcategory];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(subcategoryMappings)) {
    if (lowerSubcategory.includes(key) || key.includes(lowerSubcategory)) {
      return value;
    }
  }
  
  // If no match found, convert to uppercase and replace spaces with underscores
  const cleaned = subcategory
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
  
  // If the cleaned version is valid, use it
  if (VALID_FINANCIAL_SUBCATEGORIES.includes(cleaned as ValidFinancialSubcategory)) {
    return cleaned;
  }
  
  // Final fallback
  return 'UNCATEGORIZED';
};

/**
 * Validates account metadata and ensures proper formatting
 */
export const validateAccountMetadata = (metadata: Partial<AccountMetadata>): AccountMetadata => {
  const validated: AccountMetadata = {
    type: metadata.type || AccountType.ASSET,
    category: metadata.category || 'Uncategorized',
    subcategory: metadata.subcategory || '',
    financialCategory: metadata.financialCategory || FinancialCategory.CURRENT_ASSET,
    financialSubcategory: validateAndCleanFinancialSubcategory(metadata.financialSubcategory || ''),
  };
  
  return validated;
};

export const getSuggestedMetadata = (name: string): AccountMetadata | null => {
  // Normalize account name: lowercase, remove punctuation, trim whitespace
  const normalizedName = name.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  // Alias map for common variations and synonyms
  const aliasMap: Record<string, string> = {
    // Cash and banking aliases
    'atm': 'cash',
    'withdrawal': 'cash',
    'deposit': 'cash',
    'checking': 'cash',
    'savings': 'cash',
    'bank account': 'cash',
    'credit union': 'cash',
    
    // Loan and debt aliases
    'credit line': 'loan',
    'line of credit': 'loan',
    'credit card': 'loan',
    'mortgage': 'loan',
    'car loan': 'loan',
    'student loan': 'loan',
    'personal loan': 'loan',
    'business loan': 'loan',
    
    // Income aliases
    'paycheck': 'salary',
    'direct deposit': 'salary',
    'wages': 'salary',
    'commission': 'salary',
    'bonus': 'salary',
    'freelance': 'salary',
    'consulting': 'salary',
    'business income': 'salary',
    'sales': 'salary',
    'revenue': 'salary',
    
    // Receivable aliases
    'invoice': 'receivable',
    'billing': 'receivable',
    'customer payment': 'receivable',
    'client payment': 'receivable',
    'money owed': 'receivable',
    
    // Payable aliases
    'bills': 'payable',
    'creditors': 'payable',
    'vendor': 'payable',
    'supplier': 'payable',
    'money owed to': 'payable',
    'expenses payable': 'payable',
    
    // Equity aliases
    'owner investment': 'equity',
    'capital': 'equity',
    'investment': 'equity',
    'retained earnings': 'equity',
    'profit': 'equity',
    'loss': 'equity',
    
    // Supply aliases
    'office supplies': 'supplies',
    'materials': 'supplies',
    'inventory': 'supplies',
    'stock': 'supplies',
    'merchandise': 'supplies'
  };

  // Apply aliases to normalized name
  let processedName = normalizedName;
  for (const [alias, target] of Object.entries(aliasMap)) {
    if (processedName.includes(alias)) {
      processedName = processedName.replace(alias, target);
    }
  }

  const keywordMap = [
    {
      keywords: ["cash", "petty"],
      result: {
        type: AccountType.ASSET,
        category: "Cash",
        subcategory: "Petty Cash",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "CASH_AND_EQUIVALENTS",
      },
    },
    {
      keywords: ["supplies", "office"],
      result: {
        type: AccountType.EXPENSE,
        category: "Office",
        subcategory: "Supplies",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "OFFICE_SUPPLIES",
      },
    },
    {
      keywords: ["loan", "debt", "credit"],
      result: {
        type: AccountType.LIABILITY,
        category: "Loans",
        subcategory: "Business Loan",
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: "SHORT_TERM_DEBT",
      },
    },
    {
      keywords: ["sales", "income", "revenue"],
      result: {
        type: AccountType.INCOME,
        category: "Sales",
        subcategory: "Product Sales",
        financialCategory: FinancialCategory.OPERATING_REVENUE,
        financialSubcategory: "SALES_REVENUE",
      },
    },
    {
      keywords: ["equity", "owner"],
      result: {
        type: AccountType.EQUITY,
        category: "Equity",
        subcategory: "Owner's Equity",
        financialCategory: FinancialCategory.EQUITY,
        financialSubcategory: "RETAINED_EARNINGS",
      },
    },
    {
      keywords: ["receivable", "invoice"],
      result: {
        type: AccountType.ASSET,
        category: "Sales",
        subcategory: "Accounts Receivable",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "ACCOUNTS_RECEIVABLE",
      },
    },
    {
      keywords: ["payable", "bills", "creditors"],
      result: {
        type: AccountType.LIABILITY,
        category: "Current Liabilities",
        subcategory: "Accounts Payable",
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: "ACCOUNTS_PAYABLE",
      },
    },
    // Additional personal finance categories
    {
      keywords: ["food", "dining", "restaurant", "grocery"],
      result: {
        type: AccountType.EXPENSE,
        category: "Food & Dining",
        subcategory: "Meals",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "MEAL_EXPENSE",
      },
    },
    {
      keywords: ["transportation", "gas", "fuel", "uber", "lyft"],
      result: {
        type: AccountType.EXPENSE,
        category: "Transportation",
        subcategory: "Fuel & Transit",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "TRAVEL_EXPENSE",
      },
    },
    {
      keywords: ["entertainment", "netflix", "spotify", "movie"],
      result: {
        type: AccountType.EXPENSE,
        category: "Entertainment",
        subcategory: "Streaming & Media",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "ADVERTISING_EXPENSE",
      },
    },
    {
      keywords: ["healthcare", "medical", "doctor", "pharmacy"],
      result: {
        type: AccountType.EXPENSE,
        category: "Healthcare",
        subcategory: "Medical Expenses",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "INSURANCE_EXPENSE",
      },
    },
    {
      keywords: ["housing", "rent", "mortgage", "utilities"],
      result: {
        type: AccountType.EXPENSE,
        category: "Housing",
        subcategory: "Rent & Utilities",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "RENT_EXPENSE",
      },
    },
    {
      keywords: ["insurance", "car insurance", "health insurance"],
      result: {
        type: AccountType.EXPENSE,
        category: "Insurance",
        subcategory: "Various Policies",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "INSURANCE_EXPENSE",
      },
    },
    {
      keywords: ["education", "tuition", "school", "books"],
      result: {
        type: AccountType.EXPENSE,
        category: "Education",
        subcategory: "Tuition & Books",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "ADVERTISING_EXPENSE",
      },
    },
    {
      keywords: ["travel", "vacation", "hotel", "airline"],
      result: {
        type: AccountType.EXPENSE,
        category: "Travel",
        subcategory: "Vacation & Business",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "TRAVEL_EXPENSE",
      },
    },
    {
      keywords: ["childcare", "daycare", "babysitter"],
      result: {
        type: AccountType.EXPENSE,
        category: "Family",
        subcategory: "Childcare",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "SALARY_EXPENSE",
      },
    },
    {
      keywords: ["pets", "veterinary", "pet food"],
      result: {
        type: AccountType.EXPENSE,
        category: "Pets",
        subcategory: "Veterinary & Supplies",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "MAINTENANCE_EXPENSE",
      },
    },
    {
      keywords: ["shopping", "clothing", "electronics", "amazon"],
      result: {
        type: AccountType.EXPENSE,
        category: "Shopping",
        subcategory: "Retail Purchases",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "ADVERTISING_EXPENSE",
      },
    },
    {
      keywords: ["fitness", "gym", "workout"],
      result: {
        type: AccountType.EXPENSE,
        category: "Fitness",
        subcategory: "Gym & Wellness",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "MAINTENANCE_EXPENSE",
      },
    }
  ];

  // Check both original normalized name and processed name (with aliases applied)
  for (const entry of keywordMap) {
    if (entry.keywords.some(kw => processedName.includes(kw)) || 
        entry.keywords.some(kw => normalizedName.includes(kw))) {
      return validateAccountMetadata(entry.result);
    }
  }

  return null;
}; 