import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Account, AccountType, FinancialCategory } from "../entities/Account";
import { Transaction } from "../entities/Transaction";
import { TransactionType } from "../types/transaction.types";
import bcrypt from 'bcryptjs';

async function seedTransactions() {
  try {
    console.log('🌱 Starting transaction seed...');
    await AppDataSource.initialize();

    // Create test user
    const userRepo = AppDataSource.getRepository(User);
    let user = await userRepo.findOne({ where: { email: 'example@example.com' } });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = userRepo.create({
        email: 'example@example.com',
        password: hashedPassword,
      });
      await userRepo.save(user);
      console.log('✅ Created test user:', user.email);
    }

    // Create accounts
    const accountRepo = AppDataSource.getRepository(Account);
    const accounts = [
      {
        name: "Cash",
        type: AccountType.ASSET,
        balance: 10000,
        isLiquid: true,
        user,
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "CASH_AND_CASH_EQUIVALENTS"
      },
      {
        name: "Accounts Receivable",
        type: AccountType.ASSET,
        balance: 5000,
        isLiquid: true,
        user,
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: "ACCOUNTS_RECEIVABLE"
      }
    ];

    for (const accountData of accounts) {
      const account = accountRepo.create(accountData);
      await accountRepo.save(account);
    }
    console.log('✅ Created accounts');

    // Create transactions
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const cashAccount = await accountRepo.findOne({ where: { name: "Cash" } });
    const arAccount = await accountRepo.findOne({ where: { name: "Accounts Receivable" } });

    if (!cashAccount || !arAccount) {
      throw new Error("Required accounts not found");
    }

    const transactions = [
      {
        description: "Client Payment",
        amount: 2500,
        type: TransactionType.INCOME,
        category: "Income",
        date: new Date(),
        user,
        account: cashAccount
      },
      {
        description: "Consulting Fee",
        amount: 1500,
        type: TransactionType.INCOME,
        category: "Income",
        date: new Date(),
        user,
        account: arAccount
      }
    ];

    for (const transactionData of transactions) {
      const transaction = transactionRepo.create(transactionData);
      await transactionRepo.save(transaction);
      console.log(`✅ Created transaction "${transactionData.description}"`);
    }

    console.log('✅ Seed completed successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedTransactions(); 