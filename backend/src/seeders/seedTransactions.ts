import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { TransactionType } from "../types/transaction.types";
import { User } from "../entities/User";
import { Account } from "../entities/Account";

const seedTransactions = async () => {
  await AppDataSource.initialize();
  console.log("📥 Seeding transactions...");

  const userRepo = AppDataSource.getRepository(User);
  const accountRepo = AppDataSource.getRepository(Account);
  const transactionRepo = AppDataSource.getRepository(Transaction);

  const user = await userRepo.findOne({ where: { id: 1 } });
  if (!user) {
    console.error("User not found.");
    return;
  }

  const accounts = await accountRepo.find({ where: { user: { id: user.id } } });
  const accountMap = Object.fromEntries(accounts.map(acc => [acc.name, acc]));

  const transactions = [
    {
      description: "Client Payment",
      amount: 2500,
      type: TransactionType.INCOME,
      account: accountMap["Cash"]
    },
    {
      description: "Consulting Fee",
      amount: 1500,
      type: TransactionType.INCOME,
      account: accountMap["Accounts Receivable"]
    },
    {
      description: "Office Rent",
      amount: 1200,
      type: TransactionType.EXPENSE,
      account: accountMap["Cash"]
    },
    {
      description: "Utilities",
      amount: 300,
      type: TransactionType.EXPENSE,
      account: accountMap["Cash"]
    }
  ];

  for (const data of transactions) {
    const transaction = transactionRepo.create({ ...data, user });
    await transactionRepo.save(transaction);
  }

  console.log("✅ Transactions seeded.");
  process.exit();
};

seedTransactions();