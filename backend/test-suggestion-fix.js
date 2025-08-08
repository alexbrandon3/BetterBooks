const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testSuggestion(description) {
  try {
    console.log(`\n🔍 Testing description: "${description}"`);
    console.log('='.repeat(50));
    
    const response = await axios.post(`${BASE_URL}/suggestions/suggest-dual-sides`, {
      description: description,
      userId: 1
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Dual-Side Suggestions with Logging');
  console.log('='.repeat(60));
  
  // Test the problematic description
  await testSuggestion('Business purchasing goods or services');
  
  // Test other descriptions for comparison
  await testSuggestion('Paid rent for office space');
  await testSuggestion('Received customer payment');
  await testSuggestion('Bought laptop for business');
  await testSuggestion('Initial contribution to business');
}

runTests().catch(console.error);
