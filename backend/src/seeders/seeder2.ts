import { AppDataSource } from "../config/data-source";
import { Account, AccountType, FinancialCategory } from "../entities/Account";
import { Transaction } from "../entities/Transaction";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import { TransactionType } from "../types/transaction.types";

const main = async () => {
  await AppDataSource.initialize();
  console.log("Database initialized...");

  // TRUNCATE all tables with CASCADE
  await AppDataSource.query(
    'TRUNCATE TABLE "split_transaction", "transaction", "recurring_transaction", "account", "user" RESTART IDENTITY CASCADE'
  );
  console.log("Tables truncated...");

  // Create a sample user
  const userRepo = AppDataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash("password", 10);
  const user = userRepo.create({
    email: "test@example.com",
    password: hashedPassword,
  });
  await userRepo.save(user);
  console.log("User seeded...");

  // Create sample accounts
  const accounts = [
    { 
      name: "Cash", 
      type: AccountType.ASSET, 
      balance: 10000, 
      user,
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "CASH_AND_CASH_EQUIVALENTS"
    },
    { 
      name: "Accounts Receivable", 
      type: AccountType.ASSET, 
      balance: 5000, 
      user,
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "ACCOUNTS_RECEIVABLE"
    },
    { 
      name: "Equipment", 
      type: AccountType.ASSET, 
      balance: 7500, 
      user,
      financialCategory: FinancialCategory.LONG_TERM_ASSET,
      financialSubcategory: "EQUIPMENT"
    },
    { 
      name: "Accounts Payable", 
      type: AccountType.LIABILITY, 
      balance: 2000, 
      user,
      financialCategory: FinancialCategory.CURRENT_LIABILITY,
      financialSubcategory: "ACCOUNTS_PAYABLE"
    },
    { 
      name: "Long-term Debt", 
      type: AccountType.LIABILITY, 
      balance: 5000, 
      user,
      financialCategory: FinancialCategory.LONG_TERM_LIABILITY,
      financialSubcategory: "LOANS"
    },
    { 
      name: "Owner's Equity", 
      type: AccountType.EQUITY, 
      balance: 15500, 
      user,
      financialCategory: FinancialCategory.EQUITY,
      financialSubcategory: "OWNERS_EQUITY"
    },
  ];

  const accountRepo = AppDataSource.getRepository(Account);

  const utilityAccount = accountRepo.create({
    name: "Utility Expense",
    type: AccountType.EXPENSE,
    balance: 0,
    user: user,
    financialCategory: FinancialCategory.OPERATING_EXPENSE,
    financialSubcategory: "UTILITIES"
  });

  const marketingAccount = accountRepo.create({
    name: "Marketing Expense",
    type: AccountType.EXPENSE,
    balance: 0,
    user: user,
    financialCategory: FinancialCategory.OPERATING_EXPENSE,
    financialSubcategory: "MARKETING"
  });

  await accountRepo.save([utilityAccount, marketingAccount]);

  for (const account of accounts) {
    await accountRepo.save(account);
  }
  console.log("Accounts seeded...");

  // Fetch the accounts for relationships
  const cash = await accountRepo.findOneBy({ name: "Cash" });
  const ar = await accountRepo.findOneBy({ name: "Accounts Receivable" });
  const equipment = await accountRepo.findOneBy({ name: "Equipment" });
  const ap = await accountRepo.findOneBy({ name: "Accounts Payable" });
  const debt = await accountRepo.findOneBy({ name: "Long-term Debt" });

  // Null check for missing accounts
  if (!cash || !ar || !equipment || !ap || !debt) {
    console.error("❌ One or more accounts were not found during seeding.");
    console.error(
      `Cash: ${cash}, AR: ${ar}, Equipment: ${equipment}, AP: ${ap}, Debt: ${debt}`
    );
    await AppDataSource.destroy();
    return;
  }

  // Create sample transactions for Cash Flow
  const transactions = [
    {
      description: "Sales Revenue",
      amount: 5000.0,
      type: TransactionType.INCOME,
      account: cash,
      user,
      startDate: "2025-04-01T00:00:00Z",
    },
    {
      description: "Loan Funding",
      amount: 5000.0,
      type: TransactionType.INCOME,
      account: debt,
      user,
      startDate: "2025-04-02T00:00:00Z",
    },
    {
      description: "Purchase of Equipment",
      amount: -7500.0,
      type: TransactionType.EXPENSE,
      account: equipment,
      user,
      startDate: "2025-04-03T00:00:00Z",
    },
    {
      description: "Utility Payment",
      amount: -500.0,
      type: TransactionType.EXPENSE,
      account: utilityAccount,
      user,
      startDate: "2025-04-04T00:00:00Z",
    },
    {
      description: "Marketing Campaign",
      amount: -200.0,
      type: TransactionType.EXPENSE,
      account: marketingAccount,
      user,
      startDate: "2025-04-05T00:00:00Z",
    },
  ];

  const transactionRepo = AppDataSource.getRepository(Transaction);

  for (const transaction of transactions) {
    await transactionRepo.save(transaction);
  }

  console.log("Transactions seeded...");

  await AppDataSource.destroy();
  console.log("Database connection closed.");
  console.log("✅ Seeder ran successfully with valid test user");
};

main().catch((err) => console.error("Error seeding data:", err));
