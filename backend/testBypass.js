const axios = require('axios');

const API_BASE = 'https://betterbooks.onrender.com/api';

async function testBypass() {
  try {
    console.log('🧪 Testing account weighting bypass...');
    
    // Test with "initial contribution" - should now use fallback logic
    const response = await axios.post(`${API_BASE}/suggestions/suggest-account`, {
      description: 'initial contribution',
      userId: 14
    });
    
    console.log('✅ Response received:');
    console.log('Description:', 'initial contribution');
    console.log('Suggested Account:', response.data.suggestedAccountName);
    console.log('Confidence:', response.data.confidence);
    console.log('Entry Type:', response.data.suggestedEntryType);
    console.log('Reason:', response.data.reason);
    
    // Check if it's NOT using weighted suggestions (should be fallback)
    if (response.data.reason.includes('weight') || response.data.reason.includes('AccountWeight')) {
      console.log('⚠️  WARNING: Still using weighted suggestions!');
    } else {
      console.log('✅ SUCCESS: Using fallback logic (not weighted)');
    }
    
  } catch (error) {
    console.error('❌ Error testing bypass:', error.response?.data || error.message);
  }
}

testBypass(); 