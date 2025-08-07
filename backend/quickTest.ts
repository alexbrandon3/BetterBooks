import { AppDataSource } from "./src/config/data-source";
import { SuggestionService } from "./src/services/suggestion.service";
import { Account } from "./src/entities/Account";
import { User } from "./src/entities/User";

async function testPredictableDescriptions() {
  try {
    console.log('🚀 Testing Smart Suggestions for problematic descriptions...');
    
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Get all users to see what's available
    const userRepo = AppDataSource.getRepository(User);
    const allUsers = await userRepo.find();
    console.log('\n👥 Available users:');
    allUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}`);
    });

    // Try to find a user (try multiple emails)
    let user = await userRepo.findOne({ where: { email: 'demo@smallbusiness.com' } });
    if (!user) {
      user = await userRepo.findOne({ where: { email: 'demo@demo.com' } });
    }
    if (!user) {
      user = await userRepo.findOne({ where: { email: 'test@example.com' } });
    }
    if (!user && allUsers.length > 0) {
      user = allUsers[0]; // Use the first available user
    }
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`\n✅ Using user: ${user.email} (ID: ${user.id})`);

    // Get all accounts for the user
    const accountRepo = AppDataSource.getRepository(Account);
    const userAccounts = await accountRepo.find({ where: { user: { id: user.id } } });
    
    console.log('\n📋 Available accounts:');
    userAccounts.forEach(account => {
      console.log(`  - ${account.name} (${account.type})`);
    });

    // Test only the problematic descriptions
    const testCases = [
      { description: "mileage", expectedAccount: "Travel Expense", expectedType: "EXPENSE" },
      { description: "insurance", expectedAccount: "Insurance Expense", expectedType: "EXPENSE" },
      { description: "tax", expectedAccount: "Income Taxes", expectedType: "EXPENSE" }
    ];

    const suggestionService = new SuggestionService();

    console.log('\n🧪 Testing problematic suggestions:');
    for (const testCase of testCases) {
      console.log(`\n📝 Testing: "${testCase.description}"`);
      console.log(`   Expected: ${testCase.expectedAccount || 'No suggestion'} (${testCase.expectedType || 'N/A'})`);
      
      const result = await suggestionService.suggestAccountForDescription(testCase.description, user.id);
      
      if (result) {
        console.log(`   ✅ Result: ${result.suggestedAccountName} (${result.accountType}) - ${result.suggestedEntryType} - ${result.confidence}% confidence`);
        console.log(`   📝 Reason: ${result.reason}`);
        
        if (testCase.expectedAccount && result.suggestedAccountName !== testCase.expectedAccount) {
          console.log(`   ⚠️  WARNING: Expected ${testCase.expectedAccount} but got ${result.suggestedAccountName}`);
        }
      } else {
        console.log(`   ❌ No suggestion returned`);
        if (testCase.expectedAccount) {
          console.log(`   ⚠️  WARNING: Expected ${testCase.expectedAccount} but got no suggestion`);
        }
      }
    }

    await AppDataSource.destroy();
    console.log('\n✅ Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await AppDataSource.destroy();
  }
}

testPredictableDescriptions();
