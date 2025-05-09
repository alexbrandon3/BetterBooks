// seeder.ts

import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/Account";
import { Transaction } from "../entities/Transaction";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { TransactionType } from "../entities/Transaction";

const seedDatabase = async () => {
  await AppDataSource.initialize();
  console.log("🌱 Database Initialized for Seeding");

  // Fetch User (Assuming ID 1 for now)
  const user = await AppDataSource.getRepository("User").findOne({
    where: { id: 1 },
  });
  if (!user) {
    console.log("⚠️ No User found with ID 1. Seeding cannot continue.");
    process.exit();
  }

  // Check if already seeded
  const existingAccounts = await AppDataSource.getRepository(Account).find();
  if (existingAccounts.length > 0) {
    console.log("⚠️ Database already seeded. Skipping seeding process.");
    process.exit();
  }

  // Create Accounts
  const accounts = [
    { name: "Cash", type: "ASSET", balance: 5000, user },
    { name: "Revenue", type: "INCOME", balance: 0, user },
    { name: "Rent Expense", type: "EXPENSE", balance: 0, user },
    { name: "Utilities", type: "EXPENSE", balance: 0, user },
    { name: "Subscriptions", type: "EXPENSE", balance: 0, user },
  ];

  const accountEntities = accounts.map((acc) =>
    AppDataSource.getRepository(Account).create(acc)
  );
  await AppDataSource.getRepository(Account).save(accountEntities);
  console.log("✅ Accounts Seeded");

  // Create Transactions
  const transactions = [
    {
      amount: 1000,
      description: "Consulting Income",
      type: TransactionType.INCOME,
      account: accountEntities[1],
      user,
    },
    {
      amount: 800,
      description: "Office Rent",
      type: TransactionType.EXPENSE,
      account: accountEntities[2],
      user,
    },
    {
      amount: 150,
      description: "Utilities",
      type: TransactionType.EXPENSE,
      account: accountEntities[3],
      user,
    },
    {
      amount: 50,
      description: "Subscriptions",
      type: TransactionType.EXPENSE,
      account: accountEntities[4],
      user,
    },
  ];

  const transactionEntities = transactions.map((txn) =>
    AppDataSource.getRepository(Transaction).create(txn)
  );
  await AppDataSource.getRepository(Transaction).save(transactionEntities);
  console.log("✅ Transactions Seeded");

  console.log("🌱 Seeding Complete!");
  process.exit();
};

seedDatabase().catch((err) => console.error("Error during seeding:", err));
