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
      keywords: ["cash", "petty", "bank", "checking", "savings", "money market", "acount", "acct", "account", "business checking", "business savings", "merchant account"],
      result: {
        type: AccountType.ASSET,
        category: "Bank",
        subcategory: "Bank Accounts",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "CASH_AND_EQUIVALENTS",
        explanation: "This appears to be a cash or bank account based on the name. Bank accounts are classified as current assets for business accounting.",
        confidence: 0.95
      },
    },
    {
      keywords: ["credit card", "loan", "debt", "credit", "mortgage", "car loan", "student loan", "business loan", "line of credit", "sba loan", "equipment financing"],
      result: {
        type: AccountType.LIABILITY,
        category: "Loans & Credit",
        subcategory: "Credit Cards & Loans",
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: "SHORT_TERM_DEBT",
        explanation: "This appears to be a credit card or loan account. Credit cards and short-term loans are classified as current liabilities in business accounting.",
        confidence: 0.9
      },
    },
    {
      keywords: ["salary", "income", "revenue", "sales", "commission", "bonus", "paycheck", "service income", "product sales", "consulting revenue", "retail sales", "wholesale sales"],
      result: {
        type: AccountType.INCOME,
        category: "Income",
        subcategory: "Salary & Revenue",
        financialCategory: FinancialCategory.OPERATING_REVENUE,
        financialSubcategory: "SALES_REVENUE",
        explanation: "This appears to be an income or revenue account. Business income accounts are classified as operating revenue.",
        confidence: 0.9
      },
    },
    {
      keywords: ["receivable", "invoice", "billing", "customer payment", "client payment", "accounts receivable", "outstanding invoices", "money owed"],
      result: {
        type: AccountType.ASSET,
        category: "Accounts Receivable",
        subcategory: "Customer Invoices",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "ACCOUNTS_RECEIVABLE",
        explanation: "This appears to be money owed to your business by customers. Accounts receivable are classified as current assets in business accounting.",
        confidence: 0.85
      },
    },
    {
      keywords: ["payable", "bills", "creditors", "vendor", "supplier", "accounts payable", "vendor bills", "money owed to", "supplier invoices"],
      result: {
        type: AccountType.LIABILITY,
        category: "Accounts Payable",
        subcategory: "Vendor Bills",
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: "ACCOUNTS_PAYABLE",
        explanation: "This appears to be money your business owes to vendors or suppliers. Accounts payable are classified as current liabilities in business accounting.",
        confidence: 0.85
      },
    },
    {
      keywords: ["equity", "owner", "capital", "investment", "retained earnings", "owner equity", "partner equity", "member equity", "stockholder equity"],
      result: {
        type: AccountType.EQUITY,
        category: "Owner's Equity",
        subcategory: "Capital & Retained Earnings",
        financialCategory: FinancialCategory.EQUITY,
        financialSubcategory: "RETAINED_EARNINGS",
        explanation: "This appears to be an equity account representing owner investment or retained earnings. Equity accounts show the owner's stake in the business.",
        confidence: 0.8
      },
    },
    {
      keywords: ["equipment", "machinery", "vehicle", "computer", "furniture", "building", "land", "property", "office equipment", "production equipment", "manufacturing equipment"],
      result: {
        type: AccountType.ASSET,
        category: "Fixed Assets",
        subcategory: "Equipment & Property",
        financialCategory: FinancialCategory.FIXED_ASSET,
        financialSubcategory: "FIXED_ASSETS",
        explanation: "This appears to be a fixed asset like equipment, vehicles, or property. Fixed assets are long-term assets used in business operations.",
        confidence: 0.8
      },
    },
    {
      keywords: ["supplies", "office", "materials", "inventory", "stock", "merchandise", "raw materials", "office supplies", "business supplies", "production materials"],
      result: {
        type: AccountType.ASSET,
        category: "Inventory & Supplies",
        subcategory: "Office Supplies & Inventory",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "INVENTORY",
        explanation: "This appears to be inventory or supplies. These are typically classified as current assets in business accounting.",
        confidence: 0.75
      },
    },
    // Business-specific expense categories
    {
      keywords: ["payroll", "salary expense", "wage expense", "employee expense", "payroll tax", "employee benefits", "workers comp", "payroll processing"],
      result: {
        type: AccountType.EXPENSE,
        category: "Payroll",
        subcategory: "Employee Compensation",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "SALARY_EXPENSE",
        explanation: "This appears to be a payroll or employee compensation expense account. Payroll expenses are operating expenses in business accounting.",
        confidence: 0.9
      },
    },
    {
      keywords: ["marketing", "advertising", "promotion", "campaign", "social media", "google ads", "facebook ads", "seo", "branding", "website", "digital marketing"],
      result: {
        type: AccountType.EXPENSE,
        category: "Marketing",
        subcategory: "Advertising & Promotion",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "ADVERTISING_EXPENSE",
        explanation: "This appears to be a marketing or advertising expense account. Marketing expenses are operating expenses in business accounting.",
        confidence: 0.85
      },
    },
    {
      keywords: ["professional services", "legal", "accounting", "consulting", "cpa", "attorney", "lawyer", "audit", "tax preparation", "business consulting"],
      result: {
        type: AccountType.EXPENSE,
        category: "Professional Services",
        subcategory: "Legal & Accounting",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "LEGAL_EXPENSE",
        explanation: "This appears to be a professional services expense account. Professional services are operating expenses in business accounting.",
        confidence: 0.85
      },
    },
    {
      keywords: ["insurance", "business insurance", "liability insurance", "property insurance", "workers compensation", "professional liability", "general liability"],
      result: {
        type: AccountType.EXPENSE,
        category: "Insurance",
        subcategory: "Business Insurance",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "INSURANCE_EXPENSE",
        explanation: "This appears to be a business insurance expense account. Insurance premiums are operating expenses in business accounting.",
        confidence: 0.85
      },
    },
    {
      keywords: ["utility", "utilities", "electric", "water", "gas", "internet", "phone", "cable", "wifi", "electricity", "power", "sewer", "trash", "office utilities"],
      result: {
        type: AccountType.EXPENSE,
        category: "Utilities",
        subcategory: "Office Utilities",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "UTILITIES_EXPENSE",
        explanation: "This appears to be a utility expense account. Utility expenses are operating expenses in business accounting.",
        confidence: 0.85
      },
    },
    {
      keywords: ["rent", "lease", "rental", "landlord", "property", "real estate", "office space", "warehouse", "storage", "office rent"],
      result: {
        type: AccountType.EXPENSE,
        category: "Rent",
        subcategory: "Office & Warehouse Rent",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "RENT_EXPENSE",
        explanation: "This appears to be a rent expense account. Rent expenses are operating expenses in business accounting.",
        confidence: 0.85
      },
    },
    {
      keywords: ["software", "subscription", "saas", "cloud", "microsoft", "adobe", "quickbooks", "salesforce", "hubspot", "mailchimp", "stripe", "paypal"],
      result: {
        type: AccountType.EXPENSE,
        category: "Software",
        subcategory: "Subscriptions & SaaS",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "TECHNOLOGY_EXPENSE",
        explanation: "This appears to be a software or subscription expense account. Software expenses are operating expenses in business accounting.",
        confidence: 0.8
      },
    },
    {
      keywords: ["maintenance", "repair", "service call", "technician", "janitorial", "cleaning", "landscaping", "security", "building maintenance"],
      result: {
        type: AccountType.EXPENSE,
        category: "Maintenance",
        subcategory: "Building & Equipment",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "MAINTENANCE_EXPENSE",
        explanation: "This appears to be a maintenance expense account. Maintenance expenses are operating expenses in business accounting.",
        confidence: 0.8
      },
    },
    {
      keywords: ["travel", "business travel", "conference", "trade show", "meeting", "client visit", "business trip", "mileage", "airfare", "hotel", "car rental"],
      result: {
        type: AccountType.EXPENSE,
        category: "Travel",
        subcategory: "Business Travel",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "TRAVEL_EXPENSE",
        explanation: "This appears to be a business travel expense account. Travel expenses are operating expenses in business accounting.",
        confidence: 0.8
      },
    },
    {
      keywords: ["food", "restaurant", "dining", "meal", "lunch", "dinner", "breakfast", "cafe", "business meal", "client dinner", "catering", "office lunch"],
      result: {
        type: AccountType.EXPENSE,
        category: "Food & Dining",
        subcategory: "Business Meals",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "MEAL_EXPENSE",
        explanation: "This appears to be a food or dining expense account. Business meal expenses are operating expenses in business accounting.",
        confidence: 0.8
      },
    },
    {
      keywords: ["gas", "fuel", "petrol", "exxon", "shell", "bp", "chevron", "mobil", "business fuel", "delivery vehicle", "company car", "fleet"],
      result: {
        type: AccountType.EXPENSE,
        category: "Transportation",
        subcategory: "Fuel & Vehicle",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "TRAVEL_EXPENSE",
        explanation: "This appears to be a transportation expense account. Transportation costs are operating expenses in business accounting.",
        confidence: 0.8
      },
    },
    {
      keywords: ["tax", "taxes", "taxation", "irs", "federal", "state", "local", "property tax", "income tax", "sales tax", "business tax", "payroll tax"],
      result: {
        type: AccountType.EXPENSE,
        category: "Taxes",
        subcategory: "Business Taxes",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "TAX_EXPENSE",
        explanation: "This appears to be a tax expense account. Tax expenses are operating expenses in business accounting.",
        confidence: 0.9
      },
    },
    {
      keywords: ["draw", "drawing", "withdrawal", "owner draw", "partner draw", "member distribution", "owner withdrawal"],
      result: {
        type: AccountType.EQUITY,
        category: "Drawings",
        subcategory: "Owner Withdrawals",
        financialCategory: FinancialCategory.EQUITY,
        financialSubcategory: "DRAWINGS",
        explanation: "This appears to be an owner draw or withdrawal account. Drawings reduce owner equity in business accounting.",
        confidence: 0.85
      },
    },
    // Personal finance categories (lower priority for business context)
    {
      keywords: ["entertainment", "netflix", "spotify", "hulu", "disney", "game", "concert", "theater", "youtube", "apple music", "amazon prime", "hbo", "peacock", "paramount"],
      result: {
        type: AccountType.EXPENSE,
        category: "Entertainment",
        subcategory: "Streaming & Media",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "ADVERTISING_EXPENSE",
        explanation: "This appears to be an entertainment expense account. Entertainment costs are operating expenses.",
        confidence: 0.75
      },
    },
    {
      keywords: ["healthcare", "medical", "doctor", "pharmacy", "dental", "vision", "hospital", "clinic", "urgent care", "emergency room", "er", "prescription", "medication", "health insurance"],
      result: {
        type: AccountType.EXPENSE,
        category: "Healthcare",
        subcategory: "Medical Expenses",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "INSURANCE_EXPENSE",
        explanation: "This appears to be a healthcare expense account. Medical expenses are operating expenses.",
        confidence: 0.75
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
        confidence: 0.75
      },
    },
    {
      keywords: ["education", "tuition", "school", "books", "training", "course", "college", "university", "textbook", "class", "workshop", "seminar", "business training", "employee training", "professional development"],
      result: {
        type: AccountType.EXPENSE,
        category: "Education",
        subcategory: "Tuition & Training",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "ADVERTISING_EXPENSE",
        explanation: "This appears to be an education expense account. Education costs are operating expenses.",
        confidence: 0.75
      },
    },
    {
      keywords: ["childcare", "daycare", "babysitter", "nanny", "preschool", "after school", "summer camp", "child care", "dependent care"],
      result: {
        type: AccountType.EXPENSE,
        category: "Family",
        subcategory: "Childcare",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "SALARY_EXPENSE",
        explanation: "This appears to be a childcare expense account. Childcare costs are operating expenses.",
        confidence: 0.75
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
        confidence: 0.7
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
        confidence: 0.7
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
        confidence: 0.7
      },
    },
    {
      keywords: ["interest expense", "interest cost", "loan interest", "credit card interest", "mortgage interest"],
      result: {
        type: AccountType.EXPENSE,
        category: "Interest",
        subcategory: "Interest Expenses",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "INTEREST_EXPENSE",
        explanation: "This appears to be an interest expense account. Interest expenses are operating expenses.",
        confidence: 0.9
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
        category: "Bank",
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
        category: "Bank", 
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