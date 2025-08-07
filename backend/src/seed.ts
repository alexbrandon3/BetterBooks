import { AppDataSource } from './config/data-source';
import { User, RiskTolerance } from './entities/User';
import { Account } from './entities/Account';
import { Transaction } from './entities/Transaction';
import { FinancialGoal, GoalType } from './entities/FinancialGoal';
import { TransactionType } from './types/transaction.types';
import { hashPassword } from './utils/auth';
import { getDefaultAccounts } from './seeders/seedDefaultAccounts';

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

    // Create test user for small business
    const user = new User();
    user.email = 'demo@smallbusiness.com';
    user.password = await hashPassword('password123');
    user.riskTolerance = RiskTolerance.MODERATE;
    await AppDataSource.manager.save(user);
    console.log('👤 Test business user created');

    // Create default accounts for small business
    const defaultAccounts = getDefaultAccounts(user.id);
    
    for (const accountData of defaultAccounts) {
      const account = new Account();
      Object.assign(account, accountData);
      await AppDataSource.manager.save(account);
    }
    console.log('💰 Default accounts created');

    // Create sample transactions for small business
    const transactions = [
      {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        amount: 25000,
        type: TransactionType.INCOME,
        category: 'SALES',
        description: 'Monthly service revenue',
        user
      },
      {
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        amount: -8000,
        type: TransactionType.EXPENSE,
        category: 'PAYROLL',
        description: 'Employee payroll',
        user
      },
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        amount: -2500,
        type: TransactionType.EXPENSE,
        category: 'RENT',
        description: 'Office rent payment',
        user
      }
    ];

    for (const transactionData of transactions) {
      const transaction = new Transaction();
      Object.assign(transaction, transactionData);
      await AppDataSource.manager.save(transaction);
    }
    console.log('💸 Sample transactions created');

    // Create sample goals for small business
    const goals = [
      {
        type: GoalType.INCREASE_ASSETS,
        targetAmount: 50000,
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

console.log("✅ Database seeded successfully!");
// Remove automatic execution
// process.exit(0);

// Only run if this script is executed directly
if (require.main === module) {
  seed();
} 