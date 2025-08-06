const { SuggestionService } = require('./dist/services/suggestion.service');
const { AppDataSource } = require('./dist/config/data-source');

async function testLocalBypass() {
  try {
    console.log('🧪 Testing local account weighting bypass...');
    
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    
    const suggestionService = new SuggestionService();
    
    // Test with "initial contribution" - should now use fallback logic
    const result = await suggestionService.suggestAccountForDescription('initial contribution', 14);
    
    console.log('✅ Result received:');
    console.log('Description: initial contribution');
    console.log('Suggested Account:', result?.suggestedAccountName);
    console.log('Confidence:', result?.confidence);
    console.log('Entry Type:', result?.suggestedEntryType);
    console.log('Reason:', result?.reason);
    
    // Check if it's NOT using weighted suggestions (should be fallback)
    if (result?.reason.includes('weight') || result?.reason.includes('AccountWeight')) {
      console.log('⚠️  WARNING: Still using weighted suggestions!');
    } else {
      console.log('✅ SUCCESS: Using fallback logic (not weighted)');
    }
    
    await AppDataSource.destroy();
    console.log('✅ Database disconnected');
    
  } catch (error) {
    console.error('❌ Error testing bypass:', error.message);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

testLocalBypass(); 