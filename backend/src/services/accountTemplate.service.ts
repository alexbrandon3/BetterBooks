import { AccountType, FinancialCategory } from "../entities/Account";

export interface AccountTemplate {
  id: string;
  name: string;
  description: string;
  type: AccountType;
  category: string;
  subcategory: string;
  financialCategory: FinancialCategory;
  financialSubcategory: string;
  icon?: string;
  isPopular?: boolean;
}

export class AccountTemplateService {
  private static templates: AccountTemplate[] = [
    // Banking & Cash
    {
      id: "checking-account",
      name: "Checking Account",
      description: "Primary bank account for daily transactions",
      type: AccountType.ASSET,
      category: "Cash & Cash Equivalents",
      subcategory: "Bank Accounts",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "CASH_AND_EQUIVALENTS",
      icon: "🏦",
      isPopular: true
    },
    {
      id: "savings-account",
      name: "Savings Account",
      description: "Bank account for saving money",
      type: AccountType.ASSET,
      category: "Cash & Cash Equivalents",
      subcategory: "Bank Accounts",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "CASH_AND_EQUIVALENTS",
      icon: "💰",
      isPopular: true
    },
    {
      id: "credit-card",
      name: "Credit Card",
      description: "Credit card account for purchases",
      type: AccountType.LIABILITY,
      category: "Loans & Credit",
      subcategory: "Credit Cards",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "SHORT_TERM_DEBT",
      icon: "💳",
      isPopular: true
    },
    
    // Loans & Debt
    {
      id: "mortgage",
      name: "Mortgage",
      description: "Home mortgage loan",
      type: AccountType.LIABILITY,
      category: "Loans & Credit",
      subcategory: "Mortgage",
      financialCategory: FinancialCategory.LONG_TERM_LIABILITY,
      financialSubcategory: "LONG_TERM_DEBT",
      icon: "🏠"
    },
    {
      id: "car-loan",
      name: "Car Loan",
      description: "Automobile financing",
      type: AccountType.LIABILITY,
      category: "Loans & Credit",
      subcategory: "Auto Loans",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "SHORT_TERM_DEBT",
      icon: "🚗"
    },
    {
      id: "student-loan",
      name: "Student Loan",
      description: "Education financing",
      type: AccountType.LIABILITY,
      category: "Loans & Credit",
      subcategory: "Student Loans",
      financialCategory: FinancialCategory.LONG_TERM_LIABILITY,
      financialSubcategory: "LONG_TERM_DEBT",
      icon: "🎓"
    },
    
    // Income & Revenue
    {
      id: "salary-income",
      name: "Salary Income",
      description: "Regular employment income",
      type: AccountType.INCOME,
      category: "Income",
      subcategory: "Salary & Wages",
      financialCategory: FinancialCategory.OPERATING_REVENUE,
      financialSubcategory: "SALES_REVENUE",
      icon: "💼",
      isPopular: true
    },
    {
      id: "business-income",
      name: "Business Income",
      description: "Business revenue and sales",
      type: AccountType.INCOME,
      category: "Income",
      subcategory: "Business Revenue",
      financialCategory: FinancialCategory.OPERATING_REVENUE,
      financialSubcategory: "SALES_REVENUE",
      icon: "🏢"
    },
    {
      id: "investment-income",
      name: "Investment Income",
      description: "Dividends, interest, and investment returns",
      type: AccountType.INCOME,
      category: "Income",
      subcategory: "Investment Returns",
      financialCategory: FinancialCategory.NON_OPERATING_REVENUE,
      financialSubcategory: "INTEREST_INCOME",
      icon: "📈"
    },
    
    // Business Assets
    {
      id: "accounts-receivable",
      name: "Accounts Receivable",
      description: "Money owed by customers",
      type: AccountType.ASSET,
      category: "Accounts Receivable",
      subcategory: "Customer Invoices",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "ACCOUNTS_RECEIVABLE",
      icon: "📄"
    },
    {
      id: "inventory",
      name: "Inventory",
      description: "Products and materials for sale",
      type: AccountType.ASSET,
      category: "Inventory & Supplies",
      subcategory: "Product Inventory",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "INVENTORY",
      icon: "📦"
    },
    {
      id: "equipment",
      name: "Equipment",
      description: "Business equipment and machinery",
      type: AccountType.ASSET,
      category: "Fixed Assets",
      subcategory: "Equipment & Machinery",
      financialCategory: FinancialCategory.FIXED_ASSET,
      financialSubcategory: "FIXED_ASSETS",
      icon: "⚙️"
    },
    
    // Business Liabilities
    {
      id: "accounts-payable",
      name: "Accounts Payable",
      description: "Money owed to vendors and suppliers",
      type: AccountType.LIABILITY,
      category: "Accounts Payable",
      subcategory: "Vendor Bills",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "ACCOUNTS_PAYABLE",
      icon: "📋"
    },
    
    // Equity
    {
      id: "owners-equity",
      name: "Owner's Equity",
      description: "Owner investment and retained earnings",
      type: AccountType.EQUITY,
      category: "Owner's Equity",
      subcategory: "Capital & Retained Earnings",
      financialCategory: FinancialCategory.EQUITY,
      financialSubcategory: "RETAINED_EARNINGS",
      icon: "👤"
    },
    
    // Personal Finance
    {
      id: "food-expense",
      name: "Food & Dining",
      description: "Restaurants, groceries, and meals",
      type: AccountType.EXPENSE,
      category: "Food & Dining",
      subcategory: "Meals & Groceries",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "MEAL_EXPENSE",
      icon: "🍽️"
    },
    {
      id: "transportation-expense",
      name: "Transportation",
      description: "Gas, parking, rideshare, and transit",
      type: AccountType.EXPENSE,
      category: "Transportation",
      subcategory: "Fuel & Transit",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "TRAVEL_EXPENSE",
      icon: "🚗"
    },
    {
      id: "entertainment-expense",
      name: "Entertainment",
      description: "Movies, streaming, concerts, and recreation",
      type: AccountType.EXPENSE,
      category: "Entertainment",
      subcategory: "Streaming & Media",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "ADVERTISING_EXPENSE",
      icon: "🎬"
    },
    {
      id: "healthcare-expense",
      name: "Healthcare",
      description: "Medical, dental, pharmacy, and health expenses",
      type: AccountType.EXPENSE,
      category: "Healthcare",
      subcategory: "Medical Expenses",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "INSURANCE_EXPENSE",
      icon: "🏥"
    },
    {
      id: "housing-expense",
      name: "Housing",
      description: "Rent, utilities, and housing costs",
      type: AccountType.EXPENSE,
      category: "Housing",
      subcategory: "Rent & Utilities",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "RENT_EXPENSE",
      icon: "🏠"
    },
    {
      id: "insurance-expense",
      name: "Insurance",
      description: "Health, auto, home, and life insurance",
      type: AccountType.EXPENSE,
      category: "Insurance",
      subcategory: "Various Policies",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "INSURANCE_EXPENSE",
      icon: "🛡️"
    }
  ];

  static getAllTemplates(): AccountTemplate[] {
    return this.templates;
  }

  static getPopularTemplates(): AccountTemplate[] {
    return this.templates.filter(template => template.isPopular);
  }

  static getTemplatesByType(type: AccountType): AccountTemplate[] {
    return this.templates.filter(template => template.type === type);
  }

  static getTemplateById(id: string): AccountTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  static searchTemplates(query: string): AccountTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery)
    );
  }
} 