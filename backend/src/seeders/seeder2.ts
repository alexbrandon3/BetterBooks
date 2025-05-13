import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/Account";
import { Transaction, TransactionType } from "../entities/Transaction";
import { User } from "../entities/User";
import { SplitTransaction } from "../entities/SplitTransaction";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import bcrypt from "bcryptjs";

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
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = userRepo.create({
    email: "example@example.com",
    password: hashedPassword,
  });
  await userRepo.save(user);
  console.log("User seeded...");

  // Create sample accounts
  const accounts = [
    { name: "Cash", type: "ASSET", balance: 10000, user },
    { name: "Accounts Receivable", type: "ASSET", balance: 5000, user },
    { name: "Equipment", type: "ASSET", balance: 7500, user },
    { name: "Accounts Payable", type: "LIABILITY", balance: 2000, user },
    { name: "Long-term Debt", type: "LIABILITY", balance: 5000, user },
    { name: "Owner's Equity", type: "EQUITY", balance: 15500, user },
  ];

  const accountRepo = AppDataSource.getRepository(Account);

  const utilityAccount = accountRepo.create({
    name: "Utility Expense",
    type: "EXPENSE",
    balance: 0,
    user: user,
  });

  const marketingAccount = accountRepo.create({
    name: "Marketing Expense",
    type: "EXPENSE",
    balance: 0,
    user: user,
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
      date: new Date("2025-04-01"),
    },
    {
      description: "Loan Funding",
      amount: 5000.0,
      type: TransactionType.INCOME,
      account: debt,
      user,
      date: new Date("2025-04-02"),
    },
    {
      description: "Purchase of Equipment",
      amount: -7500.0,
      type: TransactionType.EXPENSE,
      account: equipment,
      user,
      date: new Date("2025-04-03"),
    },
    {
      description: "Utility Payment",
      amount: -500.0,
      type: TransactionType.EXPENSE,
      account: utilityAccount, // <-- This is now Utility Expense
      user,
      date: new Date("2025-04-04"),
    },
    {
      description: "Marketing Campaign",
      amount: -200.0,
      type: TransactionType.EXPENSE,
      account: marketingAccount, // <-- This is now Marketing Expense
      user,
      date: new Date("2025-04-05"),
    },
  ];

  const transactionRepo = AppDataSource.getRepository(Transaction);

  for (const transaction of transactions) {
    await transactionRepo.save(transaction);
  }

  console.log("Transactions seeded...");

  await AppDataSource.destroy();
  console.log("Database connection closed.");
};

main().catch((err) => console.error("Error seeding data:", err));
