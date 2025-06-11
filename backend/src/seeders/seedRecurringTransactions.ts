import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { Account } from '../entities/Account';
import { RecurringTransaction } from '../entities/RecurringTransaction';
import { RecurrencePattern } from '../entities/Transaction';

async function seedRecurringTransactions() {
  try {
    console.log('📡 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // 1. Look up the user with email test@example.com
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email: 'test@example.com' } });
    if (!user) {
      throw new Error('User not found');
    }
    console.log('👤 Found user:', user.email);

    // 2. Find one account belonging to that user
    const accountRepo = AppDataSource.getRepository(Account);
    const account = await accountRepo.findOne({ where: { user: { id: user.id } } });
    if (!account) {
      throw new Error('No account found for user');
    }
    console.log('💰 Found account:', account.name);

    // 3. Create recurring transactions
    const recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
    const today = new Date();

    const recurringTransactions = [
      {
        description: 'Monthly Rent',
        amount: 1200,
        recurrencePattern: RecurrencePattern.MONTHLY,
        nextRun: today,
        user,
        account,
      },
      {
        description: 'Netflix',
        amount: 15.99,
        recurrencePattern: RecurrencePattern.MONTHLY,
        nextRun: today,
        user,
        account,
      },
    ];

    // 4. Save recurring transactions
    const savedTransactions = await recurringTransactionRepo.save(recurringTransactions);
    console.log('✅ Recurring transactions seeded:', savedTransactions);

    // 5. Cleanly exit
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding recurring transactions:', error);
    process.exit(1);
  }
}

seedRecurringTransactions(); 