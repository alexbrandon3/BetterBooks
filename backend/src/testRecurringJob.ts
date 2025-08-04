import { AppDataSource } from "./config/data-source";
import { RecurringTransactionJob } from "./services/recurringTransactionJob";

async function testRecurringJob() {
  try {
    console.log('🚀 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('🧪 Testing recurring transaction job...');
    const job = new RecurringTransactionJob();
    
    // Test the job once (don't start the interval)
    console.log('📊 Processing recurring transactions...');
    await (job as any).processRecurringTransactions();
    
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testRecurringJob(); 