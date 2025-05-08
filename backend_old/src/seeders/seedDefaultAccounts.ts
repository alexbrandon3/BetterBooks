// src/seeders/seedDefaultAccounts.ts
import { AppDataSource } from "../data-source";
import { Account } from "../entities/Account";
import { User } from "../entities/User";

export const seedDefaultAccounts = async (user: User) => {
  const accountRepo = AppDataSource.getRepository(Account);

  const defaultAccounts: Partial<Account>[] = [
    { number: "1000", name: "Cash", type: "ASSET", subtype: "Bank" },
    {
      number: "1010",
      name: "Accounts Receivable",
      type: "ASSET",
      subtype: "Receivable",
    },
    {
      number: "2000",
      name: "Credit Card",
      type: "LIABILITY",
      subtype: "Credit",
    },
    {
      number: "2010",
      name: "Loans Payable",
      type: "LIABILITY",
      subtype: "Loan",
    },
    {
      number: "3000",
      name: "Owners Equity",
      type: "EQUITY",
      subtype: "Equity",
    },
    {
      number: "4001",
      name: "Product Sales",
      type: "INCOME",
      subtype: "Revenue",
    },
    {
      number: "4002",
      name: "Service Revenue",
      type: "INCOME",
      subtype: "Revenue",
    },
    {
      number: "5001",
      name: "Office Supplies",
      type: "EXPENSE",
      subtype: "General Expense",
    },
    {
      number: "5002",
      name: "Meals & Entertainment",
      type: "EXPENSE",
      subtype: "Meals",
    },
    {
      number: "5003",
      name: "Travel",
      type: "EXPENSE",
      subtype: "Transportation",
    },
    {
      number: "5004",
      name: "Software",
      type: "EXPENSE",
      subtype: "Subscriptions",
    },
  ];

  for (const account of defaultAccounts) {
    const existing = await accountRepo.findOneBy({
      name: account.name,
      user: { id: user.id },
    });

    if (!existing) {
      try {
        await accountRepo.save({
          ...account,
          description: `${account.name} (${account.type})`,
          balance: 0,
          isActive: true,
          user,
        });
        console.log(`✅ Seeded: ${account.name}`);
      } catch (err) {
        console.error(`❌ Failed to seed: ${account.name}`, err);
      }
    } else {
      console.log(`⏩ Skipped existing: ${account.name}`);
    }
  }

  console.log(`🌱 Completed account seeding for user ${user.email}`);
};
