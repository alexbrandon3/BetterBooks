import { AppDataSource } from "../config/data-source";
import { Account, FinancialCategory, AccountType } from "../entities/Account";
import { User } from "../entities/User";

export const getDefaultAccounts = (userId: number) => {
  return [
    // Assets
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
    // Liabilities
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
    // Income
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
    // Expenses
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
      name: "Utilities",
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
      name: "Payroll",
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
      name: "Supplies",
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
      name: "Equipment Purchase",
      type: AccountType.EXPENSE,
      category: "Equipment",
      subcategory: "Equipment Purchase",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "TECHNOLOGY_EXPENSE",
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
    // Equity
    {
      name: "Owner's Equity",
      type: AccountType.EQUITY,
      category: "Owner's Equity",
      subcategory: "Owner's Equity",
      financialCategory: FinancialCategory.RETAINED_EARNINGS,
      financialSubcategory: "RETAINED_EARNINGS",
      balance: 0,
      isLiquid: false,
      user: { id: userId }
    },
    {
      name: "Drawings",
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
