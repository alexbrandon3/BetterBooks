// Test script for production API - run this in browser console on your app

async function testProductionAPI() {
  console.log('🧪 Testing Production API Endpoints');
  console.log('='.repeat(50));
  
  const baseURL = 'https://betterbooks.onrender.com/api';
  
  // Test 1: Single account suggestion (the one causing the issue)
  console.log('\n🔍 Test 1: Single Account Suggestion');
  try {
    const response1 = await fetch(`${baseURL}/suggestions/suggest-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Use your auth token
      },
      body: JSON.stringify({
        description: 'Business purchasing goods or services'
      })
    });
    
    const result1 = await response1.json();
    console.log('Single Account Response:', result1);
  } catch (error) {
    console.log('❌ Single Account Error:', error);
  }
  
  // Test 2: Dual-side suggestion
  console.log('\n🔍 Test 2: Dual-Side Suggestion');
  try {
    const response2 = await fetch(`${baseURL}/suggestions/suggest-dual-sides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Use your auth token
      },
      body: JSON.stringify({
        description: 'Business purchasing goods or services'
        // Note: userId is not needed - it comes from the auth token
      })
    });
    
    const result2 = await response2.json();
    console.log('Dual-Side Response:', result2);
  } catch (error) {
    console.log('❌ Dual-Side Error:', error);
  }
  
  // Test 3: Other descriptions for comparison
  console.log('\n🔍 Test 3: Other Descriptions');
  const testDescriptions = [
    'Paid rent for office space',
    'Bought laptop for business',
    'Initial contribution to business'
  ];
  
  for (const desc of testDescriptions) {
    try {
      const response = await fetch(`${baseURL}/suggestions/suggest-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          description: desc
        })
      });
      
      const result = await response.json();
      console.log(`"${desc}":`, result);
    } catch (error) {
      console.log(`❌ Error for "${desc}":`, error);
    }
  }
}

// Run the test
testProductionAPI();
