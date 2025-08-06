const axios = require('axios');

const API_BASE = 'https://betterbooks.onrender.com/api';

async function testEquityKeywords() {
  console.log('🧪 Testing Equity Keyword Improvements...\n');
  
  const testCases = [
    'initial',
    'initial contribution', 
    'owner contribution',
    'capital contribution',
    'business formation',
    'owner draw',
    'partner draw',
    'equity investment'
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: "${testCase}"`);
      
      const response = await axios.post(`${API_BASE}/suggestions/suggest-account`, {
        description: testCase,
        userId: 14 // Use the same user ID as before
      });
      
      const result = response.data;
      
      console.log(`  ✅ Suggested Account: ${result.suggestedAccountName}`);
      console.log(`  📊 Account Type: ${result.accountType}`);
      console.log(`  🎯 Entry Type: ${result.suggestedEntryType}`);
      console.log(`  📈 Confidence: ${result.confidence}%`);
      console.log(`  💡 Reason: ${result.reason}`);
      
      // Check if it's correctly suggesting equity accounts
      const isEquity = result.accountType === 'EQUITY';
      const isCorrect = isEquity || result.suggestedAccountName.toLowerCase().includes('equity') || 
                       result.suggestedAccountName.toLowerCase().includes('capital') ||
                       result.suggestedAccountName.toLowerCase().includes('owner');
      
      console.log(`  ${isCorrect ? '✅' : '❌'} Result: ${isCorrect ? 'CORRECT' : 'INCORRECT'} (${isEquity ? 'EQUITY' : result.accountType})`);
      console.log('');
      
    } catch (error) {
      console.log(`  ❌ Error testing "${testCase}":`, error.response?.data?.message || error.message);
      console.log('');
    }
  }
  
  console.log('🏁 Equity keyword testing complete!');
}

// Run the test
testEquityKeywords().catch(console.error); 