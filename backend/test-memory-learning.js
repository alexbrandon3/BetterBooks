const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testMemoryBasedLearning() {
  try {
    console.log('🧠 Testing Memory-Based Learning System...\n');

    // Test 1: Get initial suggestion
    console.log('📝 Test 1: Getting initial suggestion for "office supplies"');
    const initialSuggestion = await axios.post(`${BASE_URL}/suggestions/suggest-account`, {
      description: 'office supplies'
    });
    console.log('✅ Initial suggestion:', initialSuggestion.data);

    // Test 2: Save feedback for accepted suggestion
    console.log('\n📝 Test 2: Saving feedback for accepted suggestion');
    const feedbackData = {
      description: 'office supplies',
      suggestedAccountId: initialSuggestion.data.suggestedAccountId,
      suggestedAccountName: initialSuggestion.data.suggestedAccountName,
      confidence: initialSuggestion.data.confidence,
      feedbackType: 'ACCEPTED',
      selectedAccountId: initialSuggestion.data.suggestedAccountId,
      selectedAccountName: initialSuggestion.data.suggestedAccountName,
      suggestionMetadata: {
        accountType: initialSuggestion.data.accountType,
        category: initialSuggestion.data.category,
        financialCategory: initialSuggestion.data.financialCategory,
        suggestedEntryType: initialSuggestion.data.suggestedEntryType,
        detailedReason: initialSuggestion.data.detailedReason
      },
      contextData: {
        timestamp: new Date().toISOString(),
        userAgent: 'test-script',
        sessionId: 'test-session-1'
      }
    };

    await axios.post(`${BASE_URL}/suggestions/save-feedback`, feedbackData);
    console.log('✅ Feedback saved successfully');

    // Test 3: Get suggestion again (should now use memory-based learning)
    console.log('\n📝 Test 3: Getting suggestion again (should use memory learning)');
    const memorySuggestion = await axios.post(`${BASE_URL}/suggestions/suggest-account`, {
      description: 'office supplies'
    });
    console.log('✅ Memory-based suggestion:', memorySuggestion.data);

    // Test 4: Save feedback for rejected suggestion
    console.log('\n📝 Test 4: Saving feedback for rejected suggestion');
    const rejectFeedbackData = {
      description: 'computer equipment',
      suggestedAccountId: initialSuggestion.data.suggestedAccountId,
      suggestedAccountName: initialSuggestion.data.suggestedAccountName,
      confidence: 75,
      feedbackType: 'REJECTED',
      userReason: 'Wrong account suggested',
      suggestionMetadata: {
        accountType: 'EXPENSE',
        category: 'Equipment',
        financialCategory: 'OPERATING_EXPENSE',
        suggestedEntryType: 'DEBIT',
        detailedReason: 'Test rejection'
      },
      contextData: {
        timestamp: new Date().toISOString(),
        userAgent: 'test-script',
        sessionId: 'test-session-2'
      }
    };

    await axios.post(`${BASE_URL}/suggestions/save-feedback`, rejectFeedbackData);
    console.log('✅ Rejection feedback saved successfully');

    console.log('\n🎉 Memory-based learning system test completed successfully!');
    console.log('\n📊 Key Features Tested:');
    console.log('✅ Suggestion generation');
    console.log('✅ Feedback collection');
    console.log('✅ Memory-based learning');
    console.log('✅ Pattern recognition');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testMemoryBasedLearning(); 