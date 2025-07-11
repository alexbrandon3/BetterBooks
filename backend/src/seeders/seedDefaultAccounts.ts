import { AppDataSource } from "../config/data-source";
import { Account, FinancialCategory, AccountType } from "../entities/Account";
import { User } from "../entities/User";

export const getDefaultAccounts = (userId: number) => {
  return [
    // ===== ASSETS =====
    {
      name: "Cash",
      type: AccountType.ASSET,
      category: "Bank",
      subcategory: "Cash",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "CASH_AND_EQUIVALENTS",
      balance: 0,
      isLiquid: true,
      user: { id: userId }
    },
    {
      name: "Checking Account",
      type: AccountType.ASSET,
      category: "Bank",
      subcategory: "Checking",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "CASH_AND_EQUIVALENTS",
      balance: 0,
      isLiquid: true,
      user: { id: userId }
    },
    {
      name: "Savings Account",
      type: AccountType.ASSET,
      category: "Bank",
      subcategory: "Savings",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "CASH_AND_EQUIVALENTS",
      balance: 0,
      isLiquid: true,
      user: { id: userId }
    },
    {
      name: "Petty Cash",
      type: AccountType.ASSET,
      category: "Bank",
      subcategory: "Petty Cash",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "CASH_AND_EQUIVALENTS",
      balance: 0,
      isLiquid: true,
      user: { id: userId }
    },
    {
      name: "Accounts Receivable",
      type: AccountType.ASSET,
      category: "Receivables",
      subcategory: "Accounts Receivable",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "ACCOUNTS_RECEIVABLE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Undeposited Funds",
      type: AccountType.ASSET,
      category: "Receivables",
      subcategory: "Undeposited Funds",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "ACCOUNTS_RECEIVABLE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Inventory",
      type: AccountType.ASSET,
      category: "Inventory",
      subcategory: "Product Inventory",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "INVENTORY",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Prepaid Expenses",
      type: AccountType.ASSET,
      category: "Prepaid",
      subcategory: "Prepaid Expenses",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "PREPAID_EXPENSES",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Security Deposits",
      type: AccountType.ASSET,
      category: "Deposits",
      subcategory: "Security Deposit",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "OTHER_CURRENT_ASSET",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Equipment",
      type: AccountType.ASSET,
      category: "Equipment",
      subcategory: "Equipment",
      financialCategory: FinancialCategory.FIXED_ASSET,
      financialSubcategory: "FIXED_ASSETS",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    
    // ===== LIABILITIES =====
    {
      name: "Accounts Payable",
      type: AccountType.LIABILITY,
      category: "Payables",
      subcategory: "Accounts Payable",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "ACCOUNTS_PAYABLE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Payroll Liabilities",
      type: AccountType.LIABILITY,
      category: "Payroll",
      subcategory: "Payroll Taxes",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "OTHER_CURRENT_LIABILITY",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Sales Tax Payable",
      type: AccountType.LIABILITY,
      category: "Taxes",
      subcategory: "Sales Tax",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "OTHER_CURRENT_LIABILITY",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Credit Card",
      type: AccountType.LIABILITY,
      category: "Credit Card",
      subcategory: "Credit Card",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "SHORT_TERM_DEBT",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Loan Payable",
      type: AccountType.LIABILITY,
      category: "Loans",
      subcategory: "Loan Payable",
      financialCategory: FinancialCategory.LONG_TERM_LIABILITY,
      financialSubcategory: "LONG_TERM_DEBT",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Interest Payable",
      type: AccountType.LIABILITY,
      category: "Loans",
      subcategory: "Interest Payable",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "OTHER_CURRENT_LIABILITY",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Deferred Revenue",
      type: AccountType.LIABILITY,
      category: "Revenue",
      subcategory: "Deferred Revenue",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "OTHER_CURRENT_LIABILITY",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    
    // ===== INCOME ACCOUNTS (for closing entries) =====
    {
      name: "Sales Revenue",
      type: AccountType.INCOME,
      category: "Sales",
      subcategory: "Sales Revenue",
      financialCategory: FinancialCategory.OPERATING_REVENUE,
      financialSubcategory: "SALES_REVENUE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Service Income",
      type: AccountType.INCOME,
      category: "Services",
      subcategory: "Service Income",
      financialCategory: FinancialCategory.OPERATING_REVENUE,
      financialSubcategory: "SERVICE_REVENUE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Consulting Income",
      type: AccountType.INCOME,
      category: "Services",
      subcategory: "Consulting",
      financialCategory: FinancialCategory.OPERATING_REVENUE,
      financialSubcategory: "SERVICE_REVENUE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Interest Income",
      type: AccountType.INCOME,
      category: "Interest",
      subcategory: "Interest Income",
      financialCategory: FinancialCategory.NON_OPERATING_REVENUE,
      financialSubcategory: "INTEREST_INCOME",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Affiliate Income",
      type: AccountType.INCOME,
      category: "Online",
      subcategory: "Affiliate Programs",
      financialCategory: FinancialCategory.NON_OPERATING_REVENUE,
      financialSubcategory: "OTHER_INCOME",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Miscellaneous Income",
      type: AccountType.INCOME,
      category: "Other",
      subcategory: "Misc. Income",
      financialCategory: FinancialCategory.NON_OPERATING_REVENUE,
      financialSubcategory: "OTHER_INCOME",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Refund Income",
      type: AccountType.INCOME,
      category: "Adjustments",
      subcategory: "Refund Income",
      financialCategory: FinancialCategory.NON_OPERATING_REVENUE,
      financialSubcategory: "OTHER_INCOME",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    
    // ===== EXPENSE ACCOUNTS (for closing entries) =====
    {
      name: "Cost of Goods Sold",
      type: AccountType.EXPENSE,
      category: "Cost of Goods",
      subcategory: "COGS",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "COST_OF_GOODS_SOLD",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Supplies Expense",
      type: AccountType.EXPENSE,
      category: "Office",
      subcategory: "Supplies",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "OFFICE_SUPPLIES",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Software Subscriptions",
      type: AccountType.EXPENSE,
      category: "Technology",
      subcategory: "Software",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "TECHNOLOGY_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Rent Expense",
      type: AccountType.EXPENSE,
      category: "Rent",
      subcategory: "Rent Expense",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "RENT_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Utilities Expense",
      type: AccountType.EXPENSE,
      category: "Utilities",
      subcategory: "Utilities",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "UTILITIES_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Payroll Expense",
      type: AccountType.EXPENSE,
      category: "Salaries",
      subcategory: "Payroll",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "SALARY_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Payroll Taxes",
      type: AccountType.EXPENSE,
      category: "Payroll",
      subcategory: "Payroll Taxes",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "TAX_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Marketing Expense",
      type: AccountType.EXPENSE,
      category: "Marketing",
      subcategory: "Marketing Expense",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "ADVERTISING_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Insurance Expense",
      type: AccountType.EXPENSE,
      category: "Insurance",
      subcategory: "Business Insurance",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "INSURANCE_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Professional Services",
      type: AccountType.EXPENSE,
      category: "Professional",
      subcategory: "Legal & Accounting",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "LEGAL_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Technology Expense",
      type: AccountType.EXPENSE,
      category: "Technology",
      subcategory: "Technology Expense",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "TECHNOLOGY_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Travel Expense",
      type: AccountType.EXPENSE,
      category: "Travel",
      subcategory: "Travel Expense",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "TRAVEL_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Meals & Entertainment",
      type: AccountType.EXPENSE,
      category: "Hospitality",
      subcategory: "Meals",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "MEALS_AND_ENTERTAINMENT",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Postage & Delivery",
      type: AccountType.EXPENSE,
      category: "Operations",
      subcategory: "Postage",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "OFFICE_SUPPLIES",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Bank Fees",
      type: AccountType.EXPENSE,
      category: "Financial",
      subcategory: "Bank Fees",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "BANK_FEES",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Depreciation Expense",
      type: AccountType.EXPENSE,
      category: "Accounting",
      subcategory: "Depreciation",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "DEPRECIATION_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Interest Expense",
      type: AccountType.EXPENSE,
      category: "Loans",
      subcategory: "Loan Interest",
      financialCategory: FinancialCategory.NON_OPERATING_EXPENSE,
      financialSubcategory: "INTEREST_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Income Taxes",
      type: AccountType.EXPENSE,
      category: "Taxes",
      subcategory: "Income Tax",
      financialCategory: FinancialCategory.NON_OPERATING_EXPENSE,
      financialSubcategory: "TAX_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Charitable Contributions",
      type: AccountType.EXPENSE,
      category: "Donations",
      subcategory: "Charity",
      financialCategory: FinancialCategory.NON_OPERATING_EXPENSE,
      financialSubcategory: "OTHER_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Other Operating Expenses",
      type: AccountType.EXPENSE,
      category: "Other",
      subcategory: "Other Operating",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "OTHER_EXPENSE",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    
    // ===== EQUITY ACCOUNTS =====
    {
      name: "Retained Earnings",
      type: AccountType.EQUITY,
      category: "Owner's Equity",
      subcategory: "Retained Earnings",
      financialCategory: FinancialCategory.RETAINED_EARNINGS,
      financialSubcategory: "RETAINED_EARNINGS",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Owner's Capital",
      type: AccountType.EQUITY,
      category: "Owner's Equity",
      subcategory: "Capital Contributions",
      financialCategory: FinancialCategory.EQUITY,
      financialSubcategory: "OWNER_EQUITY",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Owner's Draw",
      type: AccountType.EQUITY,
      category: "Withdrawals",
      subcategory: "Drawings",
      financialCategory: FinancialCategory.DRAWINGS,
      financialSubcategory: "DRAWINGS",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    }
  ];
};

export const seedDefaultAccounts = async () => {
  // Initialize the data source
  await AppDataSource.initialize();

  const accountRepo = AppDataSource.getRepository(Account);
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { email: "demo@smallbusiness.com" } });
  if (!user) {
    console.error("No user found to assign default accounts to.");
    return;
  }

  const defaultAccounts = getDefaultAccounts(user.id);

  for (const accountData of defaultAccounts) {
    const exists = await accountRepo.findOne({
      where: { name: accountData.name, user: { id: user.id } },
    });

    if (!exists) {
      const account = accountRepo.create(accountData);
      await accountRepo.save(account);
      console.log(`Seeded account: ${accountData.name}`);
    }
  }

  console.log("✅ Default accounts seeded.");
  await AppDataSource.destroy();
};
