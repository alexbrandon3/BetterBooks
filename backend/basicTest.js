console.log('Starting basic test...');

const { AppDataSource } = require("./dist/config/data-source");

async function basicTest() {
  try {
    console.log('Attempting to initialize database...');
    await AppDataSource.initialize();
    console.log('✅ Database initialized successfully');
    
    // Just test if we can connect
    const { User } = require("./dist/entities/User");
    const userRepo = AppDataSource.getRepository(User);
    const userCount = await userRepo.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    await AppDataSource.destroy();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

basicTest(); 