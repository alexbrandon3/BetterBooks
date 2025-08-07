import { AppDataSource } from './src/config/data-source';
import { SuggestionService } from './src/services/suggestion.service';

async function testFrontendIntegration() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const suggestionService = new SuggestionService();
    
    // Test the exact scenario from the frontend
    const description = 'Initial contribution';
    const userId = 1;
    
    console.log('🧪 Testing frontend integration for transaction type suggestions:');
    console.log(`📝 Description: "${description}"`);
    console.log(`👤 User ID: ${userId}\n`);
    
    // Test transaction type suggestion
    console.log('🔍 Testing transaction type suggestion...');
    const transactionTypeResult = await suggestionService.suggestTransactionTypeForDescription(description, userId);
    
    if (transactionTypeResult) {
      console.log('✅ Transaction Type Suggestion:');
      console.log(`   Type: ${transactionTypeResult.suggestedType}`);
      console.log(`   Confidence: ${transactionTypeResult.confidence}%`);
      console.log(`   Reason: ${transactionTypeResult.reason}`);
      console.log(`   Detailed: ${transactionTypeResult.detailedReason}\n`);
    } else {
      console.log('❌ No transaction type suggestion found\n');
    }
    
    // Test account suggestion
    console.log('🔍 Testing account suggestion...');
    const accountResult = await suggestionService.suggestAccountForDescription(description, userId);
    
    if (accountResult) {
      console.log('✅ Account Suggestion:');
      console.log(`   Account: ${accountResult.suggestedAccountName}`);
      console.log(`   Type: ${accountResult.accountType}`);
      console.log(`   Entry Type: ${accountResult.suggestedEntryType}`);
      console.log(`   Confidence: ${accountResult.confidence}%`);
      console.log(`   Reason: ${accountResult.reason}\n`);
    } else {
      console.log('❌ No account suggestion found\n');
    }

    console.log('✅ Frontend integration test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

testFrontendIntegration();
