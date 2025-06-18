import { AppDataSource } from "../config/data-source";
import { Account, AccountType, FinancialCategory } from "../entities/Account";
import { User } from "../entities/User";

const seedDatabase = async () => {
  await AppDataSource.initialize();
  console.log("🌱 Database Initialized for Seeding");

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({
    where: { id: "1" },
  });

  if (!user) {
    console.log("⚠️ No User found with ID 1. Seeding cannot continue.");
    process.exit();
  }

  const accountRepo = AppDataSource.getRepository(Account);
  const existingAccounts = await accountRepo.find();
  if (existingAccounts.length > 0) {
    console.log("⚠️ Database already seeded. Skipping seeding process.");
    process.exit();
  }

  const accounts = [
    {
      name: "Cash",
      type: AccountType.ASSET,
      category: "Asset",
      subcategory: "Current Asset",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "CASH_AND_CASH_EQUIVALENTS",
      balance: 5000,
    },
    {
      name: "Accounts Receivable",
      type: AccountType.ASSET,
      category: "Asset",
      subcategory: "Current Asset",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "ACCOUNTS_RECEIVABLE",
      balance: 3000,
    },
    {
      name: "Equipment",
      type: AccountType.ASSET,
      category: "Asset",
      subcategory: "Long-Term Asset",
      financialCategory: FinancialCategory.LONG_TERM_ASSET,
      financialSubcategory: "EQUIPMENT",
      balance: 8000,
    },
    {
      name: "Accounts Payable",
      type: AccountType.LIABILITY,
      category: "Liability",
      subcategory: "Current Liability",
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "ACCOUNTS_PAYABLE",
      balance: -2000,
    },
    {
      name: "Loan Payable",
      type: AccountType.LIABILITY,
      category: "Liability",
      subcategory: "Long-Term Liability",
      financialCategory: FinancialCategory.LONG_TERM_LIABILITY,
      financialSubcategory: "LOANS",
      balance: -5000,
    },
    {
      name: "Owner's Equity",
      type: AccountType.EQUITY,
      category: "Equity",
      subcategory: "Owner's Equity",
      financialCategory: FinancialCategory.EQUITY,
      financialSubcategory: "OWNERS_EQUITY",
      balance: 9000,
    },
  ];

  for (const acc of accounts) {
    const account = accountRepo.create({
      name: acc.name,
      type: acc.type,
      category: acc.category,
      subcategory: acc.subcategory,
      financialCategory: acc.financialCategory,
      financialSubcategory: acc.financialSubcategory,
      balance: acc.balance,
      user,
    });
    await accountRepo.save(account);
  }

  console.log("✅ GAAP-Compliant Accounts Seeded");
  process.exit();
};

seedDatabase();
