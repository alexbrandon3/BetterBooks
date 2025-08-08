// Category Suggestion Test Script
// Run this in your browser's developer console on the BetterBooks app

console.log('🧪 Starting Category Suggestion Tests...');

// Test data - common business transaction descriptions
const testDescriptions = [
  // Food & Dining
  'Pizza delivery from Dominoes',
  'Business lunch at Chipotle',
  'Coffee from Starbucks',
  'Client dinner at fancy restaurant',
  'Office catering for meeting',
  
  // Transportation
  'Gas station fuel purchase',
  'Uber ride to client meeting',
  'Parking fee downtown',
  'Car maintenance at Jiffy Lube',
  'Airport parking for business trip',
  
  // Office & Supplies
  'Office supplies from Staples',
  'Printer paper and ink',
  'Computer equipment from Best Buy',
  'Amazon business supplies',
  'Software subscription for QuickBooks',
  
  // Marketing & Advertising
  'Google Ads campaign',
  'Facebook advertising',
  'Print advertising in local paper',
  'Trade show booth rental',
  'Website hosting and domain',
  
  // Professional Services
  'Legal consultation with attorney',
  'Accounting services from CPA',
  'Consulting fee for business advisor',
  'Insurance premium payment',
  'Banking fees and charges',
  
  // Utilities & Rent
  'Office rent payment',
  'Electricity bill for office',
  'Internet service provider',
  'Phone bill for business line',
  'Water and sewer utilities',
  
  // Revenue & Income
  'Client payment received',
  'Invoice payment from customer',
  'Service fee from consulting',
  'Product sales revenue',
  'Commission payment received',
  
  // Payroll & Taxes
  'Employee payroll payment',
  'Payroll tax withholding',
  'Employee benefits contribution',
  'Bonus payment to staff',
  'Quarterly tax payment to IRS'
];

// Function to test category suggestions
async function testCategorySuggestions() {
  console.log('🔍 Testing Category Suggestions...');
  console.log('📝 Total test cases:', testDescriptions.length);
  
  let successCount = 0;
  let failureCount = 0;
  const results = [];
  
  for (let i = 0; i < testDescriptions.length; i++) {
    const description = testDescriptions[i];
    console.log(`\n${i + 1}/${testDescriptions.length}: Testing "${description}"`);
    
    try {
      // Simulate the API call that the frontend makes
      const response = await fetch('https://betterbooks.onrender.com/api/suggestions/suggest-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token') || 'test-token'
        },
        body: JSON.stringify({ description })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.suggestedCategory) {
          console.log(`✅ SUCCESS: "${description}" → "${data.suggestedCategory}" (${data.confidence}% confidence)`);
          console.log(`   Reason: ${data.reason}`);
          successCount++;
          results.push({
            description,
            category: data.suggestedCategory,
            confidence: data.confidence,
            reason: data.reason,
            status: 'SUCCESS'
          });
        } else {
          console.log(`❌ NO SUGGESTION: "${description}" → No category suggested`);
          failureCount++;
          results.push({
            description,
            category: null,
            confidence: 0,
            reason: 'No suggestion returned',
            status: 'FAILURE'
          });
        }
      } else {
        console.log(`❌ API ERROR: "${description}" → HTTP ${response.status}`);
        failureCount++;
        results.push({
          description,
          category: null,
          confidence: 0,
          reason: `HTTP ${response.status} error`,
          status: 'ERROR'
        });
      }
    } catch (error) {
      console.log(`❌ NETWORK ERROR: "${description}" → ${error.message}`);
      failureCount++;
      results.push({
        description,
        category: null,
        confidence: 0,
        reason: error.message,
        status: 'ERROR'
      });
    }
    
    // Small delay between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log(`✅ Successful suggestions: ${successCount}`);
  console.log(`❌ Failed suggestions: ${failureCount}`);
  console.log(`📈 Success rate: ${((successCount / testDescriptions.length) * 100).toFixed(1)}%`);
  
  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  results.forEach((result, index) => {
    const status = result.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${status} ${index + 1}. "${result.description}"`);
    if (result.category) {
      console.log(`   → ${result.category} (${result.confidence}% confidence)`);
      console.log(`   → ${result.reason}`);
    } else {
      console.log(`   → No suggestion (${result.reason})`);
    }
  });
  
  // Category distribution analysis
  const categoryCounts = {};
  results.filter(r => r.category).forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });
  
  console.log('\n📊 CATEGORY DISTRIBUTION:');
  Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`   ${category}: ${count} suggestions`);
    });
  
  return results;
}

// Function to test specific descriptions
async function testSpecificDescriptions(descriptions) {
  console.log('🔍 Testing Specific Descriptions...');
  
  for (const description of descriptions) {
    console.log(`\n📝 Testing: "${description}"`);
    
    try {
      const response = await fetch('https://betterbooks.onrender.com/api/suggestions/suggest-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token') || 'test-token'
        },
        body: JSON.stringify({ description })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.suggestedCategory) {
          console.log(`✅ Suggestion: "${data.suggestedCategory}" (${data.confidence}% confidence)`);
          console.log(`   Reason: ${data.reason}`);
          console.log(`   Detailed: ${data.detailedReason}`);
        } else {
          console.log(`❌ No suggestion found`);
        }
      } else {
        console.log(`❌ API Error: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
  }
}

// Function to test the frontend integration
function testFrontendIntegration() {
  console.log('🔍 Testing Frontend Category Field Integration...');
  
  // Check if we're on the transactions page
  const categoryField = document.querySelector('input[placeholder*="Food, Transportation"]');
  if (!categoryField) {
    console.log('❌ Category field not found. Make sure you\'re on the Transactions page.');
    return;
  }
  
  console.log('✅ Category field found');
  
  // Test setting a description and checking if category populates
  const descriptionField = document.querySelector('input[placeholder*="Enter transaction description"]');
  if (descriptionField) {
    console.log('✅ Description field found');
    
    // Test with a simple description
    const testDescription = 'Pizza delivery';
    console.log(`📝 Testing with description: "${testDescription}"`);
    
    // Simulate user typing
    descriptionField.value = testDescription;
    descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
    descriptionField.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Check if category field gets populated after a delay
    setTimeout(() => {
      const categoryValue = categoryField.value;
      if (categoryValue) {
        console.log(`✅ Category field populated: "${categoryValue}"`);
      } else {
        console.log(`❌ Category field not populated`);
      }
    }, 2000);
  } else {
    console.log('❌ Description field not found');
  }
}

// Function to test using the actual frontend service
async function testWithFrontendService() {
  console.log('🔍 Testing with Frontend Service...');
  
  // Import the service (this will work if the service is available)
  try {
    // Test a few specific descriptions
    const testDescriptions = [
      'Pizza delivery',
      'Gas station fuel',
      'Office supplies purchase',
      'Client payment received'
    ];
    
    for (const description of testDescriptions) {
      console.log(`\n📝 Testing: "${description}"`);
      
      try {
        const response = await fetch('https://betterbooks.onrender.com/api/suggestions/suggest-category', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token') || 'test-token'
          },
          body: JSON.stringify({ description })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.suggestedCategory) {
            console.log(`✅ Suggestion: "${data.suggestedCategory}" (${data.confidence}% confidence)`);
            console.log(`   Reason: ${data.reason}`);
            console.log(`   Detailed: ${data.detailedReason}`);
          } else {
            console.log(`❌ No suggestion found`);
          }
        } else {
          console.log(`❌ API Error: HTTP ${response.status}`);
          const errorText = await response.text();
          console.log(`   Error details: ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ Network Error: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Service Error: ${error.message}`);
  }
}

// Function to test backend connectivity
async function testBackendConnectivity() {
  console.log('🔍 Testing Backend Connectivity...');
  
  try {
    // Test basic connectivity
    const response = await fetch('https://betterbooks.onrender.com/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Backend accessible: HTTP ${response.status}`);
    
    if (response.ok) {
      const data = await response.text();
      console.log(`   Response: ${data}`);
    }
  } catch (error) {
    console.log(`❌ Backend not accessible: ${error.message}`);
  }
  
  // Test the suggestions endpoint specifically
  try {
    const response = await fetch('https://betterbooks.onrender.com/api/suggestions/suggest-category', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ description: 'test' })
    });
    
    console.log(`✅ Suggestions endpoint accessible: HTTP ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Suggestions endpoint not accessible: ${error.message}`);
  }
}

// Export functions for manual testing
window.testCategorySuggestions = testCategorySuggestions;
window.testSpecificDescriptions = testSpecificDescriptions;
window.testFrontendIntegration = testFrontendIntegration;
window.testWithFrontendService = testWithFrontendService;
window.testBackendConnectivity = testBackendConnectivity;

console.log('🚀 Test functions available:');
console.log('  - testCategorySuggestions() - Run full test suite');
console.log('  - testSpecificDescriptions(["description1", "description2"]) - Test specific descriptions');
console.log('  - testFrontendIntegration() - Test frontend category field');
console.log('  - testWithFrontendService() - Test using the actual frontend service');
console.log('  - testBackendConnectivity() - Test backend connectivity');

// Auto-run the full test suite
console.log('\n🎯 Auto-running full test suite...');
testCategorySuggestions().then(results => {
  console.log('\n🎉 Test suite completed!');
  console.log('💡 Use the exported functions to run additional tests.');
});
