const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testSuggestionFix() {
  console.log('🧪 Testing Enhanced SmartSuggestions Fixes...\n');

  const testCases = [
    {
      description: 'Business purchasing goods or services',
      expected: 'Should return null or very low confidence (too vague)',
      shouldReturnNull: true
    },
    {
      description: 'bought laptop',
      expected: 'Should suggest Equipment (DR) + Cash (CR)',
      shouldReturnNull: false
    },
    {
      description: 'paid rent',
      expected: 'Should suggest Rent Expense (DR) + Cash (CR)',
      shouldReturnNull: false
    },
    {
      description: 'initial contribution',
      expected: 'Should suggest Cash (DR) + Owner Capital (CR)',
      shouldReturnNull: false
    },
    {
      description: 'general business transaction',
      expected: 'Should return null (too vague)',
      shouldReturnNull: true
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testing: "${testCase.description}"`);
    console.log(`Expected: ${testCase.expected}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/api/suggestions/suggest-dual-sides`, {
        description: testCase.description
      }, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;
      
      if (testCase.shouldReturnNull) {
        if (result === null) {
          console.log('✅ PASS: Correctly returned null for vague description');
        } else {
          console.log('❌ FAIL: Should have returned null but got:', result);
        }
      } else {
        if (result && result.overallConfidence >= 60) {
          console.log('✅ PASS: Got valid suggestion with confidence:', result.overallConfidence);
          console.log(`   DR: ${result.debitSide?.suggestedAccountName} (${result.debitSide?.confidence}%)`);
          console.log(`   CR: ${result.creditSide?.suggestedAccountName} (${result.creditSide?.confidence}%)`);
        } else {
          console.log('❌ FAIL: Should have gotten valid suggestion but got:', result);
        }
      }
    } catch (error) {
      console.log('❌ ERROR:', error.response?.data || error.message);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('🎯 Test Summary:');
  console.log('- Vague descriptions should return null or require high confidence');
  console.log('- Specific descriptions should get accurate dual-side suggestions');
  console.log('- Interest Expense should NOT be suggested for generic purchases');
}

// Run the test
testSuggestionFix().catch(console.error);
