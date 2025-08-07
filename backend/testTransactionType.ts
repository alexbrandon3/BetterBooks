import { AppDataSource } from './src/config/data-source';
import { SuggestionService } from './src/services/suggestion.service';

async function testTransactionTypeSuggestions() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const suggestionService = new SuggestionService();
    
    // Test descriptions
    const testDescriptions = [
      'initial contribution',
      'owner contribution', 
      'capital contribution',
      'equity contribution',
      'investment',
      'owner investment',
      'partner contribution'
    ];

    console.log('🧪 Testing transaction type suggestions:\n');

    for (const description of testDescriptions) {
      console.log(`📝 Testing: "${description}"`);
      
      const result = await suggestionService.suggestTransactionTypeForDescription(description, 1);
      
      if (result) {
        console.log(`   ✅ Result: ${result.suggestedType} - ${result.confidence}% confidence`);
        console.log(`   📝 Reason: ${result.reason}`);
        console.log(`   🔍 Detailed: ${result.detailedReason}\n`);
      } else {
        console.log(`   ❌ No suggestion found\n`);
      }
    }

    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

testTransactionTypeSuggestions();
