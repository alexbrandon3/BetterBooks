// Simple test for dual-side API - run this in browser console

async function testDualSideAPI() {
  console.log('🧪 Testing Dual-Side API with Updated Logging');
  console.log('='.repeat(60));
  
  const baseURL = 'https://betterbooks.onrender.com/api';
  
  try {
    console.log('🔍 Testing dual-side suggestion for: "Business purchasing goods or services"');
    
    const response = await fetch(`${baseURL}/suggestions/suggest-dual-sides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        description: 'Business purchasing goods or services'
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📊 Response body:', result);
    
    if (result === null) {
      console.log('❌ Dual-side suggestion returned null - this means the logic is failing');
    } else {
      console.log('✅ Dual-side suggestion returned:', result);
    }
    
  } catch (error) {
    console.log('❌ Error testing dual-side API:', error);
  }
}

// Run the test
testDualSideAPI();
