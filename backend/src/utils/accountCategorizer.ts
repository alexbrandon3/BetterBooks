import { AccountType, FinancialCategory } from "../entities/Account";

interface AccountMetadata {
  type: AccountType;
  category: string;
  subcategory: string;
  financialCategory: FinancialCategory;
  financialSubcategory: string;
  explanation?: string;
  confidence?: "high" | "medium" | "low";
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
  'DELIVERY_EXPENSE',
  'OTHER_EXPENSE',
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
    'delivery expense': 'DELIVERY_EXPENSE',
    'other expense': 'OTHER_EXPENSE',
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
    confidence: metadata.confidence || "medium",
  };
  
  return validated;
};

/**
 * Extracts meaningful keywords from account names and categories
 * This function is used for indexing accounts for SmartSuggestions
 */
export const extractKeywords = (text: string): string[] => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Normalize text: lowercase, remove punctuation, trim whitespace
  const normalizedText = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  // Split into words and filter out common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'account', 'accounts', 'expense', 'expenses', 'income', 'revenue', 'asset', 'assets',
    'liability', 'liabilities', 'equity', 'capital', 'fund', 'funds'
  ]);

  const words = normalizedText.split(' ')
    .filter(word => word.length > 2 && !stopWords.has(word))
    .map(word => word.trim());

  // Remove duplicates while preserving order
  const uniqueWords = [...new Set(words)];

  // Also extract common business terms and abbreviations
  const businessTerms: string[] = [];
  
  // Check for common business abbreviations and terms
  const businessPatterns = [
    /cogs/i, /cost of goods/i, /accounts payable/i, /accounts receivable/i,
    /payroll/i, /salary/i, /wages/i, /rent/i, /utilities/i, /insurance/i,
    /marketing/i, /advertising/i, /legal/i, /accounting/i, /software/i,
    /equipment/i, /inventory/i, /supplies/i, /travel/i, /meals/i,
    /depreciation/i, /amortization/i, /interest/i, /tax/i, /taxes/i,
    /loan/i, /credit/i, /debit/i, /cash/i, /bank/i, /checking/i,
    /savings/i, /investment/i, /equity/i, /capital/i, /draw/i,
    /withdrawal/i, /contribution/i, /revenue/i, /income/i, /expense/i,
    // New patterns for expanded coverage
    /contractor/i, /freelancer/i, /independent contractor/i, /1099/i, /gig worker/i,
    /legal fees/i, /attorney fees/i, /lawyer fees/i, /legal retainer/i,
    /processing fee/i, /transaction fee/i, /stripe fee/i, /paypal fee/i,
    /software/i, /subscription/i, /saas/i, /cloud/i, /microsoft/i, /adobe/i,
    /quickbooks/i, /salesforce/i, /hubspot/i, /mailchimp/i, /zoom/i, /slack/i,
    /internet/i, /phone/i, /mobile/i, /cellular/i, /broadband/i,
    /employee benefits/i, /hsa/i, /fsa/i, /health savings/i, /flexible spending/i,
    /office supplies/i, /postage/i, /printing/i, /stationery/i,
    /mileage/i, /fuel/i, /lease payment/i, /car lease/i, /vehicle lease/i,
    /business meal/i, /client dinner/i, /catering/i, /entertainment/i,
    /maintenance/i, /repair/i, /service call/i, /technician/i,
    /continuing education/i, /certification/i, /training/i, /professional development/i,
    /government fee/i, /inspection cost/i, /regulatory cost/i, /compliance cost/i,
    /product sales/i, /merchandise sales/i, /inventory sales/i, /retail sales/i,
    /service revenue/i, /service income/i, /consulting revenue/i, /professional services/i,
    /rental income/i, /rental revenue/i, /rental fee/i, /lease income/i,
    /commission income/i, /commission revenue/i, /affiliate revenue/i, /affiliate income/i,
    /equipment purchase/i, /equipment lease/i, /equipment financing/i, /machinery purchase/i,
    /business checking/i, /business savings/i, /merchant account/i, /business bank/i,
    /prepaid expenses/i, /prepaid insurance/i, /prepaid rent/i, /security deposit/i,
    /credit card/i, /visa/i, /mastercard/i, /amex/i, /american express/i,
    /line of credit/i, /business loan/i, /sba loan/i, /equipment financing/i,
    /payroll taxes payable/i, /sales tax payable/i, /income tax payable/i,
    /deferred revenue/i, /unearned revenue/i, /advance payment/i,
    /owner contribution/i, /owner investment/i, /capital contribution/i,
    /partner equity/i, /member equity/i, /stockholder equity/i, /shareholder equity/i,
    /retained earnings/i, /accumulated earnings/i, /earned surplus/i,
    /attorney retainer/i, /legal retainer/i, /retainer invoice/i,
    /bank of america fee/i, /chase fee/i, /wells fargo fee/i, /citibank fee/i, /banking fee/i, /account fee/i
  ];

  for (const pattern of businessPatterns) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) {
        businessTerms.push(match[0].toLowerCase());
      }
    }
  }

  // Combine regular words with business terms
  const allKeywords = [...uniqueWords, ...businessTerms];
  
  // Remove duplicates and return
  return [...new Set(allKeywords)];
};

// Personal keywords that should be demoted for business accounting
const PERSONAL_KEYWORDS_DEMOTE_LIST = [
  "netflix", "spotify", "hulu", "disney", "apple music", "youtube", "amazon prime",
  "concert", "theater", "pets", "veterinary", "babysitter", "nanny", "childcare",
  "preschool", "summer camp", "mortgage", "rent (if not commercial)", "gym", "fitness",
  "yoga", "pilates", "doctor", "hospital", "clinic", "pharmacy", "prescription",
  "shopping", "clothing", "electronics", "retail", "personal care"
];

/**
 * Enhanced account metadata suggestion with explanations and confidence levels
 */
export const getSuggestedMetadata = (name: string): AccountMetadata | null => {
  // Normalize account name: lowercase, remove punctuation, trim whitespace
  const normalizedName = name.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  // Check for personal keywords and demote confidence
  const hasPersonalKeywords = PERSONAL_KEYWORDS_DEMOTE_LIST.some(keyword => 
    normalizedName.includes(keyword.toLowerCase())
  );

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
    
    // Equipment aliases
    'equipment': 'fixed asset',
    'machinery': 'fixed asset',
    'vehicle': 'fixed asset',
    'computer': 'fixed asset',
    'furniture': 'fixed asset',
    'building': 'fixed asset',
    'land': 'fixed asset',
    'property': 'fixed asset',
  };

  // Apply aliases to normalized name
  let processedName = normalizedName;
  for (const [alias, target] of Object.entries(aliasMap)) {
    if (processedName.includes(alias)) {
      processedName = processedName.replace(alias, target);
    }
  }

  // Comprehensive business-focused keyword mappings
  const BUSINESS_ACCOUNT_KEYWORD_MAPPINGS = [
    // ===== EXPENSES - Missing Categories =====
    
    // Contract Labor / Freelance / Gig Work
    {
      keywords: ["contractor", "freelancer", "independent contractor", "1099", "gig worker", "subcontractor", "contract labor", "freelance work", "gig work", "consultant payment", "vendor payment", "service provider"],
      result: {
        type: AccountType.EXPENSE,
        category: "Contract Labor",
        subcategory: "Freelancers & Gig Workers",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "SALARY_EXPENSE",
        explanation: "External workers hired on a contract basis for business services.",
        confidence: "high" as const
      }
    },
    
    // Legal Fees & Consulting
    {
      keywords: ["legal fees", "attorney fees", "lawyer fees", "legal consultation", "legal advice", "contract review", "legal services", "law firm", "legal counsel", "legal bill", "attorney retainer", "legal retainer", "retainer invoice"],
      result: {
        type: AccountType.EXPENSE,
        category: "Legal Services",
        subcategory: "Legal Fees & Retainers",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "LEGAL_EXPENSE",
        explanation: "Legal services, attorney fees, and retainer payments for business legal needs.",
        confidence: "high" as const
      }
    },
    
    // Bank & Merchant Fees
    {
      keywords: ["processing fee", "transaction fee", "stripe fee", "paypal fee", "credit card processing", "merchant fee", "bank fee", "overdraft fee", "monthly service charge", "atm fee", "account maintenance", "wire transfer fee", "ach fee", "bank charges", "credit card fee", "payment processing", "merchant services", "bank of america fee", "chase fee", "wells fargo fee", "citibank fee", "banking fee", "account fee"],
      result: {
        type: AccountType.EXPENSE,
        category: "Bank & Merchant Fees",
        subcategory: "Payment Processing & Bank Charges",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "BANK_FEES",
        explanation: "Fees from payment processors, banks, and financial service providers.",
        confidence: "high" as const
      }
    },
    
    // Software Subscriptions / SaaS
    {
      keywords: ["software", "subscription", "saas", "cloud", "microsoft", "adobe", "quickbooks", "salesforce", "hubspot", "mailchimp", "stripe", "paypal", "zoom", "slack", "dropbox", "google workspace", "office 365", "aws", "azure", "web hosting", "domain", "website hosting", "app subscription", "software license"],
      result: {
        type: AccountType.EXPENSE,
        category: "Software & Technology",
        subcategory: "Subscriptions & SaaS",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "TECHNOLOGY_EXPENSE",
        explanation: "Software subscriptions, SaaS tools, and technology services for business operations.",
        confidence: "high" as const
      }
    },
    
    // Internet, Phone, Utilities
    {
      keywords: ["utility", "utilities", "electric", "water", "gas", "internet", "phone", "cable", "wifi", "electricity", "power", "sewer", "trash", "office utilities", "internet service", "phone service", "mobile service", "cellular", "broadband", "fiber", "dsl", "cable internet", "landline"],
      result: {
        type: AccountType.EXPENSE,
        category: "Utilities",
        subcategory: "Office Utilities & Communications",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "UTILITIES_EXPENSE",
        explanation: "Utility expenses including internet, phone, electricity, and other office utilities.",
        confidence: "high" as const
      }
    },
    
    // Employee Benefits
    {
      keywords: ["employee benefits", "hsa", "fsa", "health savings", "flexible spending", "insurance premium", "health insurance", "dental insurance", "vision insurance", "401k", "retirement", "pension", "workers comp", "disability insurance", "life insurance", "benefit plan", "employee health", "group insurance"],
      result: {
        type: AccountType.EXPENSE,
        category: "Employee Benefits",
        subcategory: "Health & Retirement Benefits",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "INSURANCE_EXPENSE",
        explanation: "Employee benefit expenses including health insurance, retirement plans, and other benefits.",
        confidence: "high" as const
      }
    },
    
    // Office Supplies & Postage
    {
      keywords: ["office supplies", "postage", "printing", "stationery", "paper", "ink", "toner", "envelopes", "stamps", "shipping supplies", "packaging", "business cards", "letterhead", "office materials", "desk supplies", "filing supplies", "mailing supplies"],
      result: {
        type: AccountType.EXPENSE,
        category: "Office Expenses",
        subcategory: "Office Supplies & Postage",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "OFFICE_SUPPLIES",
        explanation: "Office supplies, postage, printing, and general office materials.",
        confidence: "high" as const
      }
    },
    
    // Vehicle-Related Costs
    {
      keywords: ["mileage", "fuel", "lease payment", "car lease", "vehicle lease", "auto lease", "gas", "petrol", "exxon", "shell", "bp", "chevron", "mobil", "business fuel", "delivery vehicle", "company car", "fleet", "vehicle maintenance", "car insurance", "auto insurance", "vehicle registration", "parking", "tolls"],
      result: {
        type: AccountType.EXPENSE,
        category: "Transportation",
        subcategory: "Vehicle & Fuel Expenses",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "TRAVEL_EXPENSE",
        explanation: "Vehicle-related expenses including fuel, lease payments, maintenance, and insurance.",
        confidence: "high" as const
      }
    },
    
    // Meals, Entertainment, Travel
    {
      keywords: ["food", "restaurant", "dining", "meal", "lunch", "dinner", "breakfast", "cafe", "business meal", "client dinner", "catering", "office lunch", "entertainment", "client entertainment", "business entertainment", "travel", "business travel", "conference", "trade show", "meeting", "client visit", "business trip", "airfare", "hotel", "car rental", "lodging", "accommodation"],
      result: {
        type: AccountType.EXPENSE,
        category: "Food & Entertainment",
        subcategory: "Business Meals & Travel",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "MEAL_EXPENSE",
        explanation: "Business meals, entertainment, and travel expenses for client meetings and business development.",
        confidence: "high" as const
      }
    },
    
    // Repairs and Maintenance
    {
      keywords: ["maintenance", "repair", "service call", "technician", "janitorial", "cleaning", "landscaping", "security", "building maintenance", "equipment repair", "facility maintenance", "preventive maintenance", "emergency repair", "maintenance service", "repair service"],
      result: {
        type: AccountType.EXPENSE,
        category: "Maintenance",
        subcategory: "Building & Equipment Maintenance",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "MAINTENANCE_EXPENSE",
        explanation: "Building and equipment maintenance, repairs, and facility services.",
        confidence: "high" as const
      }
    },
    
    // Continuing Education & Certifications
    {
      keywords: ["continuing education", "certification", "training", "professional development", "skills development", "workshop", "seminar", "conference", "course", "class", "education", "learning", "certification exam", "license renewal", "professional license", "continuing education credits", "ceu"],
      result: {
        type: AccountType.EXPENSE,
        category: "Education & Training",
        subcategory: "Professional Development",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "ADVERTISING_EXPENSE",
        explanation: "Continuing education, professional certifications, and skill development for business growth.",
        confidence: "high" as const
      }
    },
    
    // Government Fees, Licenses, Permits
    {
      keywords: ["license", "permit", "compliance fee", "regulatory fee", "business license", "license renewal", "government fee", "inspection cost", "regulatory cost", "compliance cost", "business permit", "occupational license", "professional license", "state fee", "federal fee", "local fee", "municipal fee", "county fee"],
      result: {
        type: AccountType.EXPENSE,
        category: "Licenses & Permits",
        subcategory: "Government & Regulatory Fees",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "LEGAL_EXPENSE",
        explanation: "Government fees, business licenses, permits, and regulatory compliance costs.",
        confidence: "high" as const
      }
    },
    
    // ===== INCOME - Missing Categories =====
    
    // Product Sales
    {
      keywords: ["product sales", "merchandise sales", "inventory sales", "retail sales", "wholesale sales", "product revenue", "merchandise revenue", "inventory revenue", "retail revenue", "wholesale revenue", "goods sold", "product income", "merchandise income"],
      result: {
        type: AccountType.INCOME,
        category: "Product Sales",
        subcategory: "Merchandise & Inventory Sales",
        financialCategory: FinancialCategory.OPERATING_REVENUE,
        financialSubcategory: "SALES_REVENUE",
        explanation: "Revenue from selling products, merchandise, or inventory items.",
        confidence: "high" as const
      }
    },
    
    // Service Revenue
    {
      keywords: ["service revenue", "service income", "consulting revenue", "professional services", "service fee", "consulting fee", "project income", "service sales", "consulting income", "professional income", "service billing", "consulting billing"],
      result: {
        type: AccountType.INCOME,
        category: "Service Revenue",
        subcategory: "Professional Services & Consulting",
        financialCategory: FinancialCategory.OPERATING_REVENUE,
        financialSubcategory: "SERVICE_REVENUE",
        explanation: "Revenue from providing professional services, consulting, or project-based work.",
        confidence: "high" as const
      }
    },
    
    // Rental Income
    {
      keywords: ["rental income", "rental revenue", "rental fee", "lease income", "lease revenue", "rental property", "property rental", "equipment rental", "space rental", "office rental", "warehouse rental", "storage rental"],
      result: {
        type: AccountType.INCOME,
        category: "Rental Income",
        subcategory: "Property & Equipment Rentals",
        financialCategory: FinancialCategory.OPERATING_REVENUE,
        financialSubcategory: "SALES_REVENUE",
        explanation: "Income from renting property, equipment, or space to others.",
        confidence: "high" as const
      }
    },
    
    // Commission & Affiliate Revenue
    {
      keywords: ["commission income", "commission revenue", "affiliate revenue", "affiliate income", "commission fee", "affiliate fee", "referral income", "referral revenue", "commission sales", "affiliate sales", "referral fee", "commission payment"],
      result: {
        type: AccountType.INCOME,
        category: "Commission Income",
        subcategory: "Affiliate & Referral Revenue",
        financialCategory: FinancialCategory.OPERATING_REVENUE,
        financialSubcategory: "SALES_REVENUE",
        explanation: "Income from commissions, affiliate programs, and referral fees.",
        confidence: "high" as const
      }
    },
    
    // ===== ASSETS - Missing Categories =====
    
    // Equipment Purchase
    {
      keywords: ["equipment purchase", "equipment lease", "equipment financing", "machinery purchase", "vehicle purchase", "computer purchase", "furniture purchase", "office equipment", "production equipment", "manufacturing equipment", "business equipment", "capital equipment"],
      result: {
        type: AccountType.ASSET,
        category: "Fixed Assets",
        subcategory: "Equipment & Machinery",
        financialCategory: FinancialCategory.FIXED_ASSET,
        financialSubcategory: "FIXED_ASSETS",
        explanation: "Long-term assets like equipment, machinery, and business tools.",
        confidence: "high" as const
      }
    },
    
    // Business Banking
    {
      keywords: ["business checking", "business savings", "merchant account", "business bank", "commercial account", "business account", "operating account", "business deposit", "business cash", "petty cash", "cash on hand"],
      result: {
        type: AccountType.ASSET,
        category: "Bank",
        subcategory: "Business Bank Accounts",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "CASH_AND_EQUIVALENTS",
        explanation: "Business bank accounts and cash management accounts.",
        confidence: "high" as const
      }
    },
    
    // Prepaid Expenses & Deposits
    {
      keywords: ["prepaid expenses", "prepaid insurance", "prepaid rent", "prepaid utilities", "security deposit", "rental deposit", "lease deposit", "utility deposit", "prepaid service", "advance payment", "prepayment"],
      result: {
        type: AccountType.ASSET,
        category: "Prepaid Expenses",
        subcategory: "Prepaid Services & Deposits",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "PREPAID_EXPENSES",
        explanation: "Prepaid expenses and security deposits for future services.",
        confidence: "high" as const
      }
    },
    
    // Inventory
    {
      keywords: ["inventory", "stock", "merchandise", "raw materials", "finished goods", "work in progress", "inventory items", "product inventory", "goods inventory", "stock inventory", "inventory goods"],
      result: {
        type: AccountType.ASSET,
        category: "Inventory",
        subcategory: "Product & Material Inventory",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "INVENTORY",
        explanation: "Inventory of products, materials, and goods for sale or production.",
        confidence: "high" as const
      }
    },
    
    // ===== LIABILITIES - Missing Categories =====
    
    // Credit Card
    {
      keywords: ["credit card", "visa", "mastercard", "amex", "american express", "discover", "business credit card", "corporate card", "company card", "credit line", "credit limit"],
      result: {
        type: AccountType.LIABILITY,
        category: "Credit Cards",
        subcategory: "Business Credit Cards",
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: "SHORT_TERM_DEBT",
        explanation: "Business credit cards and revolving credit accounts.",
        confidence: "high" as const
      }
    },
    
    // Loans & Lines of Credit
    {
      keywords: ["line of credit", "loan", "business loan", "sba loan", "equipment financing", "term loan", "installment loan", "business financing", "commercial loan", "working capital loan", "expansion loan"],
      result: {
        type: AccountType.LIABILITY,
        category: "Loans & Credit",
        subcategory: "Business Loans & Lines of Credit",
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: "SHORT_TERM_DEBT",
        explanation: "Business loans, lines of credit, and financing arrangements.",
        confidence: "high" as const
      }
    },
    
    // Tax Liabilities
    {
      keywords: ["payroll taxes payable", "sales tax payable", "income tax payable", "withholding payable", "tax liability", "taxes payable", "payroll liability", "tax deposit", "estimated tax", "quarterly tax"],
      result: {
        type: AccountType.LIABILITY,
        category: "Tax Liabilities",
        subcategory: "Payroll & Sales Taxes",
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: "OTHER_CURRENT_LIABILITY",
        explanation: "Accrued tax liabilities including payroll taxes and sales taxes.",
        confidence: "high" as const
      }
    },
    
    // Deferred Revenue
    {
      keywords: ["deferred revenue", "unearned revenue", "advance payment", "prepaid revenue", "customer deposit", "retainer", "advance billing", "prepaid service", "unearned income"],
      result: {
        type: AccountType.LIABILITY,
        category: "Deferred Revenue",
        subcategory: "Unearned Revenue & Deposits",
        financialCategory: FinancialCategory.CURRENT_LIABILITY,
        financialSubcategory: "OTHER_CURRENT_LIABILITY",
        explanation: "Revenue received in advance for services not yet provided.",
        confidence: "high" as const
      }
    },
    
    // ===== EQUITY - Missing Categories =====
    
    // Owner Contributions & Withdrawals
    {
      keywords: ["owner contribution", "owner investment", "capital contribution", "owner equity", "partner contribution", "member contribution", "owner draw", "partner draw", "member draw", "owner withdrawal", "partner withdrawal", "member withdrawal", "distribution", "owner distribution"],
      result: {
        type: AccountType.EQUITY,
        category: "Owner's Equity",
        subcategory: "Contributions & Withdrawals",
        financialCategory: FinancialCategory.EQUITY,
        financialSubcategory: "RETAINED_EARNINGS",
        explanation: "Owner contributions to and withdrawals from the business.",
        confidence: "high" as const
      }
    },
    
    // Partner Equity
    {
      keywords: ["partner equity", "member equity", "stockholder equity", "shareholder equity", "partner investment", "member investment", "stockholder investment", "shareholder investment", "partner capital", "member capital"],
      result: {
        type: AccountType.EQUITY,
        category: "Partner Equity",
        subcategory: "Partner & Member Equity",
        financialCategory: FinancialCategory.EQUITY,
        financialSubcategory: "RETAINED_EARNINGS",
        explanation: "Equity accounts for business partners and members.",
        confidence: "high" as const
      }
    },
    
    // Retained Earnings
    {
      keywords: ["retained earnings", "accumulated earnings", "earned surplus", "undistributed profits", "retained profit", "accumulated profit", "earned income", "retained income"],
      result: {
        type: AccountType.EQUITY,
        category: "Retained Earnings",
        subcategory: "Accumulated Profits",
        financialCategory: FinancialCategory.RETAINED_EARNINGS,
        financialSubcategory: "RETAINED_EARNINGS",
        explanation: "Accumulated profits retained in the business for future use.",
        confidence: "high" as const
      }
    },
    
    // ===== EXISTING MAPPINGS (keeping for reference) =====
    
    {
      keywords: ["cost of goods", "cogs", "raw materials", "direct materials", "production costs", "manufacturing supplies"],
      result: {
        type: AccountType.EXPENSE,
        category: "Cost of Goods Sold",
        subcategory: "COGS",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "COST_OF_GOODS_SOLD",
        explanation: "Direct costs related to producing goods or services.",
        confidence: "high" as const
      }
    },
    {
      keywords: ["processing fee", "transaction fee", "stripe fee", "paypal fee", "credit card processing", "merchant fee"],
      result: {
        type: AccountType.EXPENSE,
        category: "Bank & Merchant Fees",
        subcategory: "Payment Processing",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "BANK_FEES",
        explanation: "Fees from processors like Stripe, Square, or PayPal.",
        confidence: "high" as const
      }
    },
    {
      keywords: ["shipping", "freight", "delivery", "courier", "usps", "ups", "fedex", "logistics"],
      result: {
        type: AccountType.EXPENSE,
        category: "Shipping",
        subcategory: "Shipping & Delivery",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "DELIVERY_EXPENSE",
        explanation: "Shipping or freight expenses related to customers or vendors.",
        confidence: "high" as const
      }
    },
    {
      keywords: ["depreciation", "amortization", "asset write-off", "accumulated depreciation"],
      result: {
        type: AccountType.EXPENSE,
        category: "Depreciation",
        subcategory: "Asset Depreciation",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "DEPRECIATION_EXPENSE",
        explanation: "The periodic expense of asset value loss.",
        confidence: "high" as const
      }
    },
    {
      keywords: ["license", "permit", "compliance fee", "regulatory fee", "business license", "license renewal"],
      result: {
        type: AccountType.EXPENSE,
        category: "Licenses & Permits",
        subcategory: "Legal & Regulatory",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "LEGAL_EXPENSE",
        explanation: "Fees for staying in compliance with industry laws.",
        confidence: "high" as const
      }
    },
    {
      keywords: ["membership", "dues", "trade group", "association", "business subscription", "chamber of commerce"],
      result: {
        type: AccountType.EXPENSE,
        category: "Dues & Subscriptions",
        subcategory: "Industry Associations",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "TECHNOLOGY_EXPENSE",
        explanation: "Recurring membership fees for professional groups.",
        confidence: "medium" as const
      }
    },
    {
      keywords: ["bad debt", "write-off", "uncollectible", "default", "customer nonpayment"],
      result: {
        type: AccountType.EXPENSE,
        category: "Bad Debt",
        subcategory: "Unpaid Receivables",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "OTHER_EXPENSE",
        explanation: "Debts that can't be collected from customers.",
        confidence: "high" as const
      }
    },
    {
      keywords: ["alarm", "security", "surveillance", "monitoring service", "security company"],
      result: {
        type: AccountType.EXPENSE,
        category: "Security",
        subcategory: "Security Services",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "MAINTENANCE_EXPENSE",
        explanation: "Building or service-based security expenses.",
        confidence: "high" as const
      }
    },
    {
      keywords: ["reimbursement", "expense report", "employee reimbursement", "staff reimbursement"],
      result: {
        type: AccountType.EXPENSE,
        category: "Reimbursements",
        subcategory: "Employee Expenses",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "OTHER_EXPENSE",
        explanation: "Reimbursements for employee-incurred business expenses.",
        confidence: "medium" as const
      }
    },
    // Core business account types
    {
      keywords: ["cash", "petty", "bank", "checking", "savings", "money market", "acount", "acct", "account", "business checking", "business savings", "merchant account"],
      result: {
        type: AccountType.ASSET,
        category: "Bank",
        subcategory: "Bank Accounts",
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "CASH_AND_EQUIVALENTS",
        explanation: "This appears to be a cash or bank account based on the name. Bank accounts are classified as current assets for business accounting.",
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "medium" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "medium" as const
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
        confidence: "medium" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
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
        confidence: "high" as const
      },
    },
    {
      keywords: ["printer", "toner", "paper", "office equipment", "desk", "chair", "supplies", "office supplies", "stationery", "filing"],
      result: {
        type: AccountType.EXPENSE,
        category: "Office Expenses",
        subcategory: "Office Supplies",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "OFFICE_SUPPLIES",
        explanation: "This appears to be an office expense account. Office expenses are operating expenses in business accounting.",
        confidence: "high" as const
      },
    },
    {
      keywords: ["business training", "employee training", "professional development", "staff training", "skills development", "certification", "workshop", "seminar", "conference"],
      result: {
        type: AccountType.EXPENSE,
        category: "Education & Training",
        subcategory: "Business Development",
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: "ADVERTISING_EXPENSE",
        explanation: "This appears to be a business training or professional development expense account. Training costs are operating expenses in business accounting.",
        confidence: "medium" as const
      },
    }
  ];

  // Edge case rules function
  const applyEdgeCaseRules = (name: string, baseResult: AccountMetadata): AccountMetadata => {
    const lowerName = name.toLowerCase();
    
    // Training rules
    if (lowerName.includes("employee") || lowerName.includes("professional development") || lowerName.includes("staff")) {
      return {
        ...baseResult,
        category: "Education & Training",
        subcategory: "Business Development",
        financialSubcategory: "ADVERTISING_EXPENSE",
        explanation: "Business training or professional development expense.",
        confidence: "high" as const
      };
    }
    
    if (lowerName.includes("school") || lowerName.includes("college") || lowerName.includes("university")) {
      return {
        ...baseResult,
        confidence: "low" as const,
        explanation: "Personal education expense - may not be business related."
      };
    }
    
    // Fuel/Gas rules
    if (lowerName.includes("delivery") || lowerName.includes("fleet") || lowerName.includes("company car")) {
      return {
        ...baseResult,
        category: "Transportation",
        subcategory: "Business Fuel",
        financialSubcategory: "TRAVEL_EXPENSE",
        explanation: "Business transportation fuel expense.",
        confidence: "high" as const
      };
    }
    
    if (lowerName.includes("gas station") || lowerName.includes("fuel")) {
      return {
        ...baseResult,
        category: "Transportation",
        subcategory: "Fuel & Vehicle",
        financialSubcategory: "TRAVEL_EXPENSE",
        explanation: "Fuel expense - may be business or personal.",
        confidence: "medium" as const
      };
    }
    
    // Supplies rules
    if (lowerName.includes("raw materials")) {
      return {
        ...baseResult,
        category: "Cost of Goods Sold",
        subcategory: "COGS",
        financialSubcategory: "COST_OF_GOODS_SOLD",
        explanation: "Raw materials for production.",
        confidence: "high" as const
      };
    }
    
    if (lowerName.includes("office supplies")) {
      return {
        ...baseResult,
        category: "Office Expenses",
        subcategory: "Office Supplies",
        financialSubcategory: "OFFICE_SUPPLIES",
        explanation: "Office supplies expense.",
        confidence: "high" as const
      };
    }
    
    if (lowerName.includes("cleaning supplies")) {
      return {
        ...baseResult,
        category: "Maintenance",
        subcategory: "Building & Equipment",
        financialSubcategory: "MAINTENANCE_EXPENSE",
        explanation: "Cleaning supplies for business maintenance.",
        confidence: "high" as const
      };
    }
    
    // Rent rules
    if (lowerName.includes("office") || lowerName.includes("warehouse") || lowerName.includes("commercial")) {
      return {
        ...baseResult,
        category: "Rent",
        subcategory: "Office & Warehouse Rent",
        financialSubcategory: "RENT_EXPENSE",
        explanation: "Commercial rent expense.",
        confidence: "high" as const
      };
    }
    
    if (lowerName.includes("apartment") || lowerName.includes("mortgage")) {
      return {
        ...baseResult,
        confidence: "low" as const,
        explanation: "Personal housing expense - may not be business related."
      };
    }
    
    // Software/Subscriptions rules
    if (lowerName.includes("quickbooks") || lowerName.includes("salesforce") || lowerName.includes("stripe") || lowerName.includes("adobe")) {
      return {
        ...baseResult,
        category: "Software",
        subcategory: "Subscriptions & SaaS",
        financialSubcategory: "TECHNOLOGY_EXPENSE",
        explanation: "Business software subscription.",
        confidence: "high" as const
      };
    }
    
    // Meals rules
    if (lowerName.includes("client") || lowerName.includes("business lunch") || lowerName.includes("meeting")) {
      return {
        ...baseResult,
        category: "Food & Dining",
        subcategory: "Business Meals",
        financialSubcategory: "MEAL_EXPENSE",
        explanation: "Business meal expense.",
        confidence: "high" as const
      };
    }
    
    if (lowerName.includes("dinner") || lowerName.includes("cafe") || lowerName.includes("takeout")) {
      return {
        ...baseResult,
        category: "Food & Dining",
        subcategory: "Business Meals",
        financialSubcategory: "MEAL_EXPENSE",
        explanation: "Meal expense - may be business or personal.",
        confidence: "medium" as const
      };
    }
    
    return baseResult;
  };

  // Check both original normalized name and processed name (with aliases applied)
  for (const entry of BUSINESS_ACCOUNT_KEYWORD_MAPPINGS) {
    // Check if any keyword matches in the processed name
    if (entry.keywords.some(kw => processedName.includes(kw)) || 
        entry.keywords.some(kw => normalizedName.includes(kw))) {
      
      let result = validateAccountMetadata(entry.result);
      
      // Apply edge case rules
      result = applyEdgeCaseRules(name, result);
      
      // Demote confidence if personal keywords found
      if (hasPersonalKeywords) {
        result.confidence = "low";
        result.explanation = `${result.explanation} Note: Contains personal keywords that may not be business-related.`;
      }
      
      return result;
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
        confidence: "high" as const
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
        confidence: "medium" as const
      }
    }
  ];

  for (const match of flexibleMatches) {
    if (match.pattern.test(normalizedName)) {
      
      let result = validateAccountMetadata(match.result);
      result = applyEdgeCaseRules(name, result);
      
      if (hasPersonalKeywords) {
        result.confidence = "low";
        result.explanation = `${result.explanation} Note: Contains personal keywords that may not be business-related.`;
      }
      
      return result;
    }
  }

  // If no specific match found, provide a reasonable default with low confidence
  let defaultResult = validateAccountMetadata({
    type: AccountType.ASSET,
    category: "Uncategorized",
    subcategory: "",
    financialCategory: FinancialCategory.CURRENT_ASSET,
    financialSubcategory: "UNCATEGORIZED",
    explanation: "No specific category match found. This account has been classified as a current asset by default. You may want to adjust the classification based on the account's purpose.",
    confidence: "low" as const
  });
  
  // Apply edge case rules to default result
  defaultResult = applyEdgeCaseRules(name, defaultResult);
  
  if (hasPersonalKeywords) {
    defaultResult.confidence = "low";
    defaultResult.explanation = `${defaultResult.explanation} Note: Contains personal keywords that may not be business-related.`;
  }
  
  return defaultResult;
}; 