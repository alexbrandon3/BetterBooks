const { SuggestionService } = require('./dist/services/suggestion.service');
const { AppDataSource } = require('./dist/config/data-source');

async function testMultipleScenarios() {
  try {
    console.log('🧪 Testing multiple scenarios with bypass...');
    
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    
    const suggestionService = new SuggestionService();
    
    const testCases = [
      'initial contribution',
      'sold products',
      'bought equipment',
      'rent payment',
      'employee salary'
    ];
    
    for (const description of testCases) {
      console.log(`\n📝 Testing: "${description}"`);
      
      const result = await suggestionService.suggestAccountForDescription(description, 14);
      
      console.log('✅ Result:');
      console.log('  Account:', result?.suggestedAccountName);
      console.log('  Confidence:', result?.confidence);
      console.log('  Entry Type:', result?.suggestedEntryType);
      console.log('  Reason:', result?.reason);
      
      // Check if it's NOT using weighted suggestions
      if (result?.reason.includes('weight') || result?.reason.includes('AccountWeight')) {
        console.log('⚠️  WARNING: Still using weighted suggestions!');
      } else {
        console.log('✅ SUCCESS: Using fallback logic (not weighted)');
      }
    }
    
    await AppDataSource.destroy();
    console.log('\n✅ Database disconnected');
    
  } catch (error) {
    console.error('❌ Error testing scenarios:', error.message);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

testMultipleScenarios(); 