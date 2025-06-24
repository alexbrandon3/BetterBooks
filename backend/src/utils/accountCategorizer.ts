import { AccountType, FinancialCategory } from "../entities/Account";

interface AccountMetadata {
  type: AccountType;
  category: string;
  subcategory: string;
  financialCategory: FinancialCategory;
  financialSubcategory: string;
  explanation?: string;
  confidence?: number;
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
    explanation: metadata.explanation,
    confidence: metadata.confidence || 0.5,
  };
  
  return validated;
};

/**
 * Enhanced account metadata suggestion with explanations and confidence levels
 */
export const getSuggestedMetadata = (name: string): AccountMetadata | null => {
  console.log(`🔍 Categorizing account: "${name}"`);
  
  // Normalize account name: lowercase, remove punctuation, trim whitespace
  const normalizedName = name.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  console.log(`📝 Normalized name: "${normalizedName}"`);

  // Enhanced alias map for common variations and synonyms
  const aliasMap: Record<string, string> = {
    // Cash and banking aliases
    'atm': 'cash',
    'withdrawal': 'cash',
    'deposit': 'cash',
    'checking': 'cash',
    'savings': 'cash',
    'bank account': 'cash',
    'credit union': 'cash',
    'money market': 'cash',
    'certificate of deposit': 'cash',
    'cd': 'cash',
    'acount': 'account', // Common typo
    'acct': 'account', // Abbreviation
    'acc': 'account', // Abbreviation
    'first bank': 'bank', // Handle "My first bank account"
    'my bank': 'bank', // Handle "My bank account"
    
    // Loan and debt aliases
    'credit line': 'loan',
    'line of credit': 'loan',
    'credit card': 'loan',
    'mortgage': 'loan',
    'car loan': 'loan',
    'student loan': 'loan',
    'personal loan': 'loan',
    'business loan': 'loan',
    'auto loan': 'loan',
    'home loan': 'loan',
    
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
    'earnings': 'salary',
    'profit': 'salary',
    
    // Receivable aliases
    'invoice': 'receivable',
    'billing': 'receivable',
    'customer payment': 'receivable',
    'client payment': 'receivable',
    'money owed': 'receivable',
    'outstanding': 'receivable',
    
    // Payable aliases
    'bills': 'payable',
    'creditors': 'payable',
    'vendor': 'payable',
    'supplier': 'payable',
    'money owed to': 'payable',
    'expenses payable': 'payable',
    'accounts payable': 'payable',
    
    // Equity aliases
    'owner investment': 'equity',
    'capital': 'equity',
    'investment': 'equity',
    'retained earnings': 'equity',
    'owner equity': 'equity',
    'stockholders equity': 'equity',
    'shareholders equity': 'equity',
    
    // Supply aliases
    'office supplies': 'supplies',
    'materials': 'supplies',
    'inventory': 'supplies',
    'stock': 'supplies',
    'merchandise': 'supplies',
    'goods': 'supplies',
    
    // Equipment aliases
    'equipment': 'fixed asset',
    'machinery': 'fixed asset',
    'vehicle': 'fixed asset',
    'computer': 'fixed asset',
    'furniture': 'fixed asset',
    'building': 'fixed asset',
    'land': 'fixed asset',
    'property': 'fixed asset',
    
    // Expense aliases
    'expense': 'operating expense',
    'cost': 'operating expense',
    'bill': 'operating expense',
    'payment': 'operating expense',
    'fee': 'operating expense',
    'charge': 'operating expense'
  };

  // Apply aliases to normalized name
  let processedName = normalizedName;
  for (const [alias, target] of Object.entries(aliasMap)) {
    if (processedName.includes(alias)) {
      processedName = processedName.replace(alias, target);
      console.log(`🔄 Applied alias: "${alias}" -> "${target}", processed name: "${processedName}"`);
    }
  }

  console.log(`🔧 Final processed name: "${processedName}"`);

  // Enhanced keyword map with explanations and confidence levels
  const keywordMap = [
    {
      keywords: ["cash", "petty", "bank", "checking", "savings", "money market", "acount", "acct", "account"],
      result: {
        type: AccountType.ASSET,
        category: "Cash & Cash Equivalents",
        subcategory: "Bank Accounts",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "CASH_AND_EQUIVALENTS",
        explanation: "This appears to be a cash or bank account based on the name. Cash accounts are classified as current assets.",
        confidence: 0.95
      },
    },
    {
      keywords: ["credit card", "loan", "debt", "credit", "mortgage", "car loan", "student loan"],
      result: {
        type: AccountType.LIABILITY,
        category: "Loans & Credit",
        subcategory: "Credit Cards & Loans",
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: "SHORT_TERM_DEBT",
        explanation: "This appears to be a credit card or loan account. Credit cards and short-term loans are classified as current liabilities.",
        confidence: 0.9
      },
    },
    {
      keywords: ["salary", "income", "revenue", "sales", "commission", "bonus", "paycheck"],
      result: {
        type: AccountType.INCOME,
        category: "Income",
        subcategory: "Salary & Revenue",
        financialCategory: FinancialCategory.OPERATING_REVENUE,
        financialSubcategory: "SALES_REVENUE",
        explanation: "This appears to be an income or revenue account. Income accounts are classified as operating revenue.",
        confidence: 0.9
      },
    },
    {
      keywords: ["receivable", "invoice", "billing", "customer payment", "client payment"],
      result: {
        type: AccountType.ASSET,
        category: "Accounts Receivable",
        subcategory: "Customer Invoices",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "ACCOUNTS_RECEIVABLE",
        explanation: "This appears to be money owed to you by customers. Accounts receivable are classified as current assets.",
        confidence: 0.85
      },
    },
    {
      keywords: ["payable", "bills", "creditors", "vendor", "supplier"],
      result: {
        type: AccountType.LIABILITY,
        category: "Accounts Payable",
        subcategory: "Vendor Bills",
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: "ACCOUNTS_PAYABLE",
        explanation: "This appears to be money you owe to vendors or suppliers. Accounts payable are classified as current liabilities.",
        confidence: 0.85
      },
    },
    {
      keywords: ["equity", "owner", "capital", "investment", "retained earnings"],
      result: {
        type: AccountType.EQUITY,
        category: "Owner's Equity",
        subcategory: "Capital & Retained Earnings",
        financialCategory: FinancialCategory.EQUITY,
        financialSubcategory: "RETAINED_EARNINGS",
        explanation: "This appears to be an equity account representing owner investment or retained earnings.",
        confidence: 0.8
      },
    },
    {
      keywords: ["equipment", "machinery", "vehicle", "computer", "furniture", "building", "land", "property"],
      result: {
        type: AccountType.ASSET,
        category: "Fixed Assets",
        subcategory: "Equipment & Property",
        financialCategory: FinancialCategory.FIXED_ASSET,
        financialSubcategory: "FIXED_ASSETS",
        explanation: "This appears to be a fixed asset like equipment, vehicles, or property. Fixed assets are long-term assets.",
        confidence: 0.8
      },
    },
    {
      keywords: ["supplies", "office", "materials", "inventory", "stock", "merchandise"],
      result: {
        type: AccountType.ASSET,
        category: "Inventory & Supplies",
        subcategory: "Office Supplies & Inventory",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "INVENTORY",
        explanation: "This appears to be inventory or supplies. These are typically classified as current assets.",
        confidence: 0.75
      },
    },
    // Personal finance categories
    {
      keywords: ["food", "dining", "restaurant", "grocery", "meal", "lunch", "dinner"],
      result: {
        type: AccountType.EXPENSE,
        category: "Food & Dining",
        subcategory: "Meals & Groceries",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "MEAL_EXPENSE",
        explanation: "This appears to be a food or dining expense account. Food expenses are operating expenses.",
        confidence: 0.85
      },
    },
    {
      keywords: ["transportation", "gas", "fuel", "uber", "lyft", "parking", "toll"],
      result: {
        type: AccountType.EXPENSE,
        category: "Transportation",
        subcategory: "Fuel & Transit",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "TRAVEL_EXPENSE",
        explanation: "This appears to be a transportation expense account. Transportation costs are operating expenses.",
        confidence: 0.8
      },
    },
    {
      keywords: ["entertainment", "netflix", "spotify", "movie", "concert", "theater"],
      result: {
        type: AccountType.EXPENSE,
        category: "Entertainment",
        subcategory: "Streaming & Media",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "ADVERTISING_EXPENSE",
        explanation: "This appears to be an entertainment expense account. Entertainment costs are operating expenses.",
        confidence: 0.8
      },
    },
    {
      keywords: ["healthcare", "medical", "doctor", "pharmacy", "dental", "vision"],
      result: {
        type: AccountType.EXPENSE,
        category: "Healthcare",
        subcategory: "Medical Expenses",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "INSURANCE_EXPENSE",
        explanation: "This appears to be a healthcare expense account. Medical expenses are operating expenses.",
        confidence: 0.8
      },
    },
    {
      keywords: ["housing", "rent", "mortgage", "utilities", "electric", "water", "internet"],
      result: {
        type: AccountType.EXPENSE,
        category: "Housing",
        subcategory: "Rent & Utilities",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "RENT_EXPENSE",
        explanation: "This appears to be a housing expense account. Housing costs are operating expenses.",
        confidence: 0.85
      },
    },
    {
      keywords: ["insurance", "car insurance", "health insurance", "life insurance"],
      result: {
        type: AccountType.EXPENSE,
        category: "Insurance",
        subcategory: "Various Policies",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "INSURANCE_EXPENSE",
        explanation: "This appears to be an insurance expense account. Insurance premiums are operating expenses.",
        confidence: 0.85
      },
    },
    {
      keywords: ["education", "tuition", "school", "books", "training", "course"],
      result: {
        type: AccountType.EXPENSE,
        category: "Education",
        subcategory: "Tuition & Books",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "ADVERTISING_EXPENSE",
        explanation: "This appears to be an education expense account. Education costs are operating expenses.",
        confidence: 0.8
      },
    },
    {
      keywords: ["travel", "vacation", "hotel", "airline", "flight", "airbnb"],
      result: {
        type: AccountType.EXPENSE,
        category: "Travel",
        subcategory: "Vacation & Business",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "TRAVEL_EXPENSE",
        explanation: "This appears to be a travel expense account. Travel costs are operating expenses.",
        confidence: 0.8
      },
    },
    {
      keywords: ["childcare", "daycare", "babysitter", "nanny"],
      result: {
        type: AccountType.EXPENSE,
        category: "Family",
        subcategory: "Childcare",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "SALARY_EXPENSE",
        explanation: "This appears to be a childcare expense account. Childcare costs are operating expenses.",
        confidence: 0.8
      },
    },
    {
      keywords: ["pets", "veterinary", "vet", "pet food", "pet supplies"],
      result: {
        type: AccountType.EXPENSE,
        category: "Pets",
        subcategory: "Veterinary & Supplies",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "MAINTENANCE_EXPENSE",
        explanation: "This appears to be a pet-related expense account. Pet expenses are operating expenses.",
        confidence: 0.75
      },
    },
    {
      keywords: ["shopping", "clothing", "electronics", "amazon", "retail"],
      result: {
        type: AccountType.EXPENSE,
        category: "Shopping",
        subcategory: "Retail Purchases",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "ADVERTISING_EXPENSE",
        explanation: "This appears to be a shopping expense account. Shopping expenses are operating expenses.",
        confidence: 0.75
      },
    },
    {
      keywords: ["fitness", "gym", "workout", "yoga", "pilates"],
      result: {
        type: AccountType.EXPENSE,
        category: "Fitness",
        subcategory: "Gym & Wellness",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "MAINTENANCE_EXPENSE",
        explanation: "This appears to be a fitness expense account. Fitness expenses are operating expenses.",
        confidence: 0.75
      },
    }
  ];

  // Check both original normalized name and processed name (with aliases applied)
  for (const entry of keywordMap) {
    console.log(`🔍 Checking keywords: [${entry.keywords.join(', ')}] against "${processedName}" and "${normalizedName}"`);
    
    // Check if any keyword matches in the processed name
    if (entry.keywords.some(kw => processedName.includes(kw)) || 
        entry.keywords.some(kw => normalizedName.includes(kw))) {
      console.log(`✅ Found match! Categorizing as: ${entry.result.category}`);
      return validateAccountMetadata(entry.result);
    }
    
    // Also check if the processed name contains any keyword (for better matching)
    if (entry.keywords.some(kw => processedName.includes(kw))) {
      console.log(`✅ Found match in processed name! Categorizing as: ${entry.result.category}`);
      return validateAccountMetadata(entry.result);
    }
  }

  // Additional flexible matching for common patterns
  const flexibleMatches = [
    {
      pattern: /bank/i,
      result: {
        type: AccountType.ASSET,
        category: "Cash & Cash Equivalents",
        subcategory: "Bank Accounts",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "CASH_AND_EQUIVALENTS",
        explanation: "This appears to be a bank account based on the name. Bank accounts are classified as current assets.",
        confidence: 0.9
      }
    },
    {
      pattern: /account/i,
      result: {
        type: AccountType.ASSET,
        category: "Cash & Cash Equivalents", 
        subcategory: "Bank Accounts",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "CASH_AND_EQUIVALENTS",
        explanation: "This appears to be a bank account based on the name. Bank accounts are classified as current assets.",
        confidence: 0.8
      }
    }
  ];

  for (const match of flexibleMatches) {
    console.log(`🔍 Checking pattern: ${match.pattern} against "${normalizedName}"`);
    if (match.pattern.test(normalizedName)) {
      console.log(`✅ Pattern match found! Categorizing as: ${match.result.category}`);
      return validateAccountMetadata(match.result);
    }
  }

  console.log(`❌ No matches found, using default categorization`);

  // If no specific match found, provide a reasonable default with low confidence
  return validateAccountMetadata({
    type: AccountType.ASSET,
    category: "Uncategorized",
    subcategory: "",
    financialCategory: FinancialCategory.CURRENT_ASSET,
    financialSubcategory: "UNCATEGORIZED",
    explanation: "No specific category match found. This account has been classified as a current asset by default. You may want to adjust the classification based on the account's purpose.",
    confidence: 0.3
  });
}; 