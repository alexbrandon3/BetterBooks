import { AppDataSource } from "./config/data-source";
import { RecurringTransactionJob } from "./services/recurringTransactionJob";
import { RecurringTransaction } from "./entities/RecurringTransaction";
import { User } from "./entities/User";
import { Account } from "./entities/Account";
import { RecurrencePattern } from "./entities/Transaction";

async function testRecurringJob() {
  try {
    console.log('🚀 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Create a test recurring transaction that will run in 2 minutes
    console.log('🧪 Creating test recurring transaction...');
    const recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
    const userRepo = AppDataSource.getRepository(User);
    const accountRepo = AppDataSource.getRepository(Account);

    // Find a test user (assuming user ID 1 exists)
    const user = await userRepo.findOne({ where: { id: 1 } });
    if (!user) {
      console.log('❌ No user found with ID 1. Please create a user first.');
      return;
    }

    // Find test accounts for the user
    const accounts = await accountRepo.find({ where: { user: { id: user.id } } });
    if (accounts.length < 2) {
      console.log('❌ Need at least 2 accounts for user. Please create more accounts first.');
      return;
    }

    // Set nextRun to 2 minutes from now
    const nextRun = new Date();
    nextRun.setMinutes(nextRun.getMinutes() + 2);

    // Create test recurring transaction with both accounts
    const testRecurringTransaction = recurringTransactionRepo.create({
      description: 'Test Recurring Transaction - Auto Generated',
      amount: 50.00,
      recurrencePattern: RecurrencePattern.DAILY,
      nextRun: nextRun,
      isActive: true,
      user: user,
      primaryAccount: accounts[0], // Use the first account as primary
      secondaryAccount: accounts[1], // Use the second account as secondary
      primaryEntryType: 'CREDIT',
      secondaryEntryType: 'DEBIT'
    });

    const savedTransaction = await recurringTransactionRepo.save(testRecurringTransaction);
    console.log(`✅ Created test recurring transaction with ID: ${savedTransaction.id}`);
    console.log(`⏰ Next run scheduled for: ${nextRun.toLocaleString()}`);
    console.log(`📊 Primary Account: ${accounts[0].name} (${savedTransaction.primaryEntryType})`);
    console.log(`📊 Secondary Account: ${accounts[1].name} (${savedTransaction.secondaryEntryType})`);

    console.log('🧪 Testing recurring transaction job...');
    const job = new RecurringTransactionJob();
    
    // Test the job once (don't start the interval)
    console.log('📊 Processing recurring transactions...');
    await (job as any).processRecurringTransactions();
    
    console.log('✅ Test completed successfully');
    console.log('💡 Check your database to see if a real transaction was created!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testRecurringJob(); 