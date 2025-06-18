import { AppDataSource } from './data-source';
import { User, RiskTolerance } from './entities/User';
import { Account, FinancialCategory } from './entities/Account';
import { Transaction } from './entities/Transaction';
import { FinancialGoal, GoalType } from './entities/FinancialGoal';
import { TransactionType } from './types/transaction.types';
import { hashPassword } from './utils/auth';

async function clearDatabase() {
  try {
    await AppDataSource.dropDatabase();
    console.log('🗑️ Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}

async function seed() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('📦 Database connection initialized');

    // Clear existing data
    await clearDatabase();
    await AppDataSource.synchronize();
    console.log('🔄 Database schema synchronized');

    // Create test user
    const user = new User();
    user.email = 'example@example.com';
    user.password = await hashPassword('password123');
    user.riskTolerance = RiskTolerance.MODERATE;
    await AppDataSource.manager.save(user);
    console.log('👤 Test user created');

    // Create sample accounts
    const accounts = [
      {
        name: 'Cash Account',
        type: 'ASSET',
        balance: 2500,
        isLiquid: true,
        financialCategory: FinancialCategory.CURRENT_ASSET,
        user
      },
      {
        name: 'Equipment Fund',
        type: 'ASSET',
        balance: 5000,
        isLiquid: true,
        financialCategory: FinancialCategory.FIXED_ASSET,
        user
      },
      {
        name: 'Marketing Budget',
        type: 'ASSET',
        balance: 2000,
        isLiquid: true,
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        user
      }
    ];

    for (const accountData of accounts) {
      const account = new Account();
      Object.assign(account, accountData);
      await AppDataSource.manager.save(account);
    }
    console.log('💰 Sample accounts created');

    // Create sample transactions
    const transactions = [
      {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        amount: 5000,
        type: TransactionType.INCOME,
        category: 'SALARY',
        description: 'Monthly salary',
        user
      },
      {
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        amount: -2000,
        type: TransactionType.EXPENSE,
        category: 'EQUIPMENT',
        description: 'New camera equipment',
        user
      },
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        amount: -500,
        type: TransactionType.EXPENSE,
        category: 'MARKETING',
        description: 'Social media ads',
        user
      }
    ];

    for (const transactionData of transactions) {
      const transaction = new Transaction();
      Object.assign(transaction, transactionData);
      await AppDataSource.manager.save(transaction);
    }
    console.log('💸 Sample transactions created');

    // Create sample goals
    const goals = [
      {
        type: GoalType.INCREASE_ASSETS,
        targetAmount: 15000,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
        progress: 0.4,
        user
      }
    ];

    for (const goalData of goals) {
      const goal = new FinancialGoal();
      Object.assign(goal, goalData);
      await AppDataSource.manager.save(goal);
    }
    console.log('🎯 Sample goals created');

    console.log('✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

seed(); 