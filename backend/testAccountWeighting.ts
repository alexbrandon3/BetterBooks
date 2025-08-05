import { AppDataSource } from './src/config/data-source';
import { AccountWeightService } from './src/services/AccountWeightService';
import { SuggestionService } from './src/services/suggestion.service';

async function testAccountWeighting() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const accountWeightService = new AccountWeightService();
    const suggestionService = new SuggestionService();

    // Test user ID (you may need to adjust this)
    const testUserId = 1;

    console.log('\n🧪 Testing Account Weighting System...\n');

    // Test 1: Initialize default weights
    console.log('1️⃣ Initializing default weights...');
    await accountWeightService.initializeDefaultWeights(testUserId);
    console.log('✅ Default weights initialized');

    // Test 2: Get user weights
    console.log('\n2️⃣ Getting user weights...');
    const weights = await accountWeightService.getUserWeights(testUserId);
    console.log(`✅ Found ${weights.length} weights:`);
    weights.forEach(weight => {
      console.log(`   - "${weight.keyword}" → Account ${weight.accountId} (weight: ${weight.weight})`);
    });

    // Test 3: Test suggestion with "sold" keyword
    console.log('\n3️⃣ Testing suggestion for "sold products"...');
    const suggestion = await suggestionService.suggestAccountForDescription('sold products', testUserId);
    if (suggestion) {
      console.log('✅ Suggestion found:');
      console.log(`   - Account: ${suggestion.suggestedAccountName}`);
      console.log(`   - Confidence: ${suggestion.confidence}%`);
      console.log(`   - Reason: ${suggestion.reason}`);
      console.log(`   - Learning Source: ${suggestion.learningSource}`);
    } else {
      console.log('❌ No suggestion found');
    }

    // Test 4: Test suggestion with "bought" keyword
    console.log('\n4️⃣ Testing suggestion for "bought inventory"...');
    const suggestion2 = await suggestionService.suggestAccountForDescription('bought inventory', testUserId);
    if (suggestion2) {
      console.log('✅ Suggestion found:');
      console.log(`   - Account: ${suggestion2.suggestedAccountName}`);
      console.log(`   - Confidence: ${suggestion2.confidence}%`);
      console.log(`   - Reason: ${suggestion2.reason}`);
      console.log(`   - Learning Source: ${suggestion2.learningSource}`);
    } else {
      console.log('❌ No suggestion found');
    }

    console.log('\n🎉 Account weighting system test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run the test
testAccountWeighting(); 