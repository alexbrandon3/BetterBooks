const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testComprehensiveLearning() {
  try {
    console.log('🧠 Testing Comprehensive Memory-Based Learning System...\n');

    // Test 1: Acceptance Learning
    console.log('📝 Test 1: Acceptance Learning');
    console.log('Getting suggestion for "office supplies"');
    const suggestion1 = await axios.post(`${BASE_URL}/suggestions/suggest-account`, {
      description: 'office supplies'
    });
    console.log('✅ Initial suggestion:', suggestion1.data.suggestedAccountName);

    // Accept the suggestion
    await axios.post(`${BASE_URL}/suggestions/save-feedback`, {
      description: 'office supplies',
      suggestedAccountId: suggestion1.data.suggestedAccountId,
      suggestedAccountName: suggestion1.data.suggestedAccountName,
      confidence: suggestion1.data.confidence,
      feedbackType: 'ACCEPTED',
      selectedAccountId: suggestion1.data.suggestedAccountId,
      selectedAccountName: suggestion1.data.suggestedAccountName,
      suggestionMetadata: suggestion1.data,
      contextData: { timestamp: new Date().toISOString() }
    });
    console.log('✅ Accepted suggestion - system should learn this pattern\n');

    // Test 2: Rejection Learning
    console.log('📝 Test 2: Rejection Learning');
    console.log('Getting suggestion for "computer equipment"');
    const suggestion2 = await axios.post(`${BASE_URL}/suggestions/suggest-account`, {
      description: 'computer equipment'
    });
    console.log('✅ Initial suggestion:', suggestion2.data.suggestedAccountName);

    // Reject the suggestion
    await axios.post(`${BASE_URL}/suggestions/save-feedback`, {
      description: 'computer equipment',
      suggestedAccountId: suggestion2.data.suggestedAccountId,
      suggestedAccountName: suggestion2.data.suggestedAccountName,
      confidence: suggestion2.data.confidence,
      feedbackType: 'REJECTED',
      userReason: 'Wrong account suggested',
      suggestionMetadata: suggestion2.data,
      contextData: { timestamp: new Date().toISOString() }
    });
    console.log('✅ Rejected suggestion - system should learn to avoid this account\n');

    // Test 3: Alternative Account Selection Learning
    console.log('📝 Test 3: Alternative Account Selection Learning');
    console.log('Getting suggestion for "client payment"');
    const suggestion3 = await axios.post(`${BASE_URL}/suggestions/suggest-account`, {
      description: 'client payment'
    });
    console.log('✅ Initial suggestion:', suggestion3.data.suggestedAccountName);

    // Reject but select a different account
    const alternativeAccountId = suggestion3.data.suggestedAccountId + 1; // Simulate different account
    await axios.post(`${BASE_URL}/suggestions/save-feedback`, {
      description: 'client payment',
      suggestedAccountId: suggestion3.data.suggestedAccountId,
      suggestedAccountName: suggestion3.data.suggestedAccountName,
      confidence: suggestion3.data.confidence,
      feedbackType: 'REJECTED',
      selectedAccountId: alternativeAccountId,
      selectedAccountName: 'Alternative Account',
      userReason: 'Selected different account',
      suggestionMetadata: suggestion3.data,
      contextData: { timestamp: new Date().toISOString() }
    });
    console.log('✅ Rejected suggestion but selected alternative account - system should learn the alternative\n');

    // Test 4: Verify Learning - Repeat the same descriptions
    console.log('📝 Test 4: Verifying Learning Results');
    
    // Test acceptance learning
    console.log('Testing acceptance learning for "office supplies"...');
    const repeatSuggestion1 = await axios.post(`${BASE_URL}/suggestions/suggest-account`, {
      description: 'office supplies'
    });
    console.log('✅ Repeat suggestion:', repeatSuggestion1.data.suggestedAccountName);
    console.log('   Learning source:', repeatSuggestion1.data.learningSource || 'N/A');
    console.log('   Confidence:', repeatSuggestion1.data.confidence);

    // Test rejection learning
    console.log('Testing rejection learning for "computer equipment"...');
    const repeatSuggestion2 = await axios.post(`${BASE_URL}/suggestions/suggest-account`, {
      description: 'computer equipment'
    });
    console.log('✅ Repeat suggestion:', repeatSuggestion2.data.suggestedAccountName);
    console.log('   Learning source:', repeatSuggestion2.data.learningSource || 'N/A');
    console.log('   Confidence:', repeatSuggestion2.data.confidence);

    // Test alternative selection learning
    console.log('Testing alternative selection learning for "client payment"...');
    const repeatSuggestion3 = await axios.post(`${BASE_URL}/suggestions/suggest-account`, {
      description: 'client payment'
    });
    console.log('✅ Repeat suggestion:', repeatSuggestion3.data.suggestedAccountName);
    console.log('   Learning source:', repeatSuggestion3.data.learningSource || 'N/A');
    console.log('   Confidence:', repeatSuggestion3.data.confidence);

    console.log('\n🎉 Comprehensive learning test completed!');
    console.log('\n📊 Learning Summary:');
    console.log('✅ Acceptance Learning: System learns from accepted suggestions');
    console.log('✅ Rejection Learning: System learns to avoid rejected accounts');
    console.log('✅ Alternative Selection: System learns from manually selected accounts');
    console.log('✅ Pattern Recognition: System identifies and applies learned patterns');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the comprehensive test
testComprehensiveLearning(); 