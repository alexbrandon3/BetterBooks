import { AppDataSource } from "../config/data-source";
import { Account } from "../entities/Account";
import { TransactionType } from "../entities/Transaction";

const seedDatabase = async () => {
  await AppDataSource.initialize();
  console.log("🌱 Database Initialized for Seeding");

  const user = await AppDataSource.getRepository("User").findOne({
    where: { id: 1 },
  });

  if (!user) {
    console.log("⚠️ No User found with ID 1. Seeding cannot continue.");
    process.exit();
  }

  const existingAccounts = await AppDataSource.getRepository(Account).find();
  if (existingAccounts.length > 0) {
    console.log("⚠️ Database already seeded. Skipping seeding process.");
    process.exit();
  }

  const accounts = [
    {
      name: "Cash",
      type: "ASSET",
      category: "Asset",
      subcategory: "Current Asset",
      balance: 5000,
    },
    {
      name: "Accounts Receivable",
      type: "ASSET",
      category: "Asset",
      subcategory: "Current Asset",
      balance: 3000,
    },
    {
      name: "Equipment",
      type: "ASSET",
      category: "Asset",
      subcategory: "Long-Term Asset",
      balance: 8000,
    },
    {
      name: "Accounts Payable",
      type: "LIABILITY",
      category: "Liability",
      subcategory: "Current Liability",
      balance: -2000,
    },
    {
      name: "Loan Payable",
      type: "LIABILITY",
      category: "Liability",
      subcategory: "Long-Term Liability",
      balance: -5000,
    },
    {
      name: "Owner's Equity",
      type: "EQUITY",
      category: "Equity",
      subcategory: "Owner's Equity",
      balance: 9000,
    },
  ];

  for (const acc of accounts) {
    const account = AppDataSource.getRepository(Account).create({
      ...acc,
      user,
    });
    await AppDataSource.getRepository(Account).save(account);
  }

  console.log("✅ GAAP-Compliant Accounts Seeded");
  process.exit();
};

seedDatabase();
