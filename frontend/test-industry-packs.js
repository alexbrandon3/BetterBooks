// 🏭 BetterBooks Industry Packs Test Script
// Run this in your browser's developer console on the BetterBooks app

console.log('🏭 Testing Industry Packs System...');

// Use the correct production API URL
const API_BASE_URL = 'https://betterbooks.onrender.com/api';

// Test cases for Industry Packs
const industryPackTestCases = [
  // Financial Services & Banking Pack
  {
    description: 'Stripe merchant fee for payment processing',
    expectedPack: 'financial-services-banking',
    expectedCategory: 'Banking Fees',
    priority: 'HIGH',
    type: 'Merchant Processing'
  },
  {
    description: 'Monthly bank maintenance fee',
    expectedPack: 'financial-services-banking',
    expectedCategory: 'Banking Fees',
    priority: 'HIGH',
    type: 'Banking Fees'
  },
  {
    description: 'Credit card payment to reduce balance',
    expectedPack: 'financial-services-banking',
    expectedCategory: 'Credit Card',
    priority: 'HIGH',
    type: 'Credit Card Payment'
  },
  {
    description: 'Customer refund for returned product',
    expectedPack: 'financial-services-banking',
    expectedCategory: 'Refunds',
    priority: 'HIGH',
    type: 'Refund'
  },
  {
    description: 'Foreign exchange gain on currency conversion',
    expectedPack: 'financial-services-banking',
    expectedCategory: 'Foreign Exchange',
    priority: 'MEDIUM',
    type: 'FX Adjustment'
  },
  {
    description: 'Interest earned on business savings account',
    expectedPack: 'financial-services-banking',
    expectedCategory: 'Interest',
    priority: 'MEDIUM',
    type: 'Interest Income'
  },

  // Construction & Trades Pack
  {
    description: 'Contractor payment for electrical work',
    expectedPack: 'construction-trades',
    expectedCategory: 'Contractor Expenses',
    priority: 'HIGH',
    type: 'Contractor Payment'
  },
  {
    description: 'Purchase of construction materials and lumber',
    expectedPack: 'construction-trades',
    expectedCategory: 'Construction Materials',
    priority: 'HIGH',
    type: 'Materials Purchase'
  },
  {
    description: 'Building permit fee for new construction',
    expectedPack: 'construction-trades',
    expectedCategory: 'Permits & Licenses',
    priority: 'HIGH',
    type: 'Permit Fee'
  },
  {
    description: 'Excavator rental for site preparation',
    expectedPack: 'construction-trades',
    expectedCategory: 'Equipment',
    priority: 'HIGH',
    type: 'Equipment Rental'
  },
  {
    description: 'Project payment for completed construction work',
    expectedPack: 'construction-trades',
    expectedCategory: 'Construction Revenue',
    priority: 'HIGH',
    type: 'Project Revenue'
  },
  {
    description: 'Safety equipment and PPE for workers',
    expectedPack: 'construction-trades',
    expectedCategory: 'Safety & Compliance',
    priority: 'MEDIUM',
    type: 'Safety Equipment'
  }
];

// Test Industry Pack API endpoints
async function testIndustryPackAPI() {
  console.log('🔌 Testing Industry Pack API Endpoints...');
  
  try {
    // Test getting all industry packs
    console.log('📦 Testing GET /api/industry-packs/packs...');
    const packsResponse = await fetch(`${API_BASE_URL}/industry-packs/packs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (packsResponse.ok) {
      const packsData = await packsResponse.json();
      console.log('✅ Industry Packs retrieved:', packsData.data.length, 'packs available');
      packsData.data.forEach(pack => {
        console.log(`   📋 ${pack.name} (${pack.id}): ${pack.rules.length} rules`);
      });
    } else {
      console.log('❌ Failed to get industry packs:', packsResponse.status, packsResponse.statusText);
    }

    // Test getting industry pack settings
    console.log('⚙️ Testing GET /api/industry-packs/settings...');
    const settingsResponse = await fetch(`${API_BASE_URL}/industry-packs/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (settingsResponse.ok) {
      const settingsData = await settingsResponse.json();
      console.log('✅ Industry Pack Settings retrieved:', settingsData.data);
    } else {
      console.log('❌ Failed to get industry pack settings:', settingsResponse.status, settingsResponse.statusText);
    }

    // Test getting coverage analysis
    console.log('📊 Testing GET /api/industry-packs/coverage...');
    const coverageResponse = await fetch(`${API_BASE_URL}/industry-packs/coverage`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (coverageResponse.ok) {
      const coverageData = await coverageResponse.json();
      console.log('✅ Industry Pack Coverage retrieved:', coverageData.data);
    } else {
      console.log('❌ Failed to get industry pack coverage:', coverageResponse.status, coverageResponse.statusText);
    }

  } catch (error) {
    console.error('❌ Error testing Industry Pack API:', error);
  }
}

// Test Industry Pack rule matching
async function testIndustryPackRules() {
  console.log('🧪 Testing Industry Pack Rule Matching...');
  console.log('📝 Total test cases:', industryPackTestCases.length);
  
  let correctCount = 0;
  let incorrectCount = 0;
  let errors = 0;
  
  for (const testCase of industryPackTestCases) {
    console.log(`\n🔍 Testing: "${testCase.description}"`);
    console.log(`Expected: ${testCase.expectedPack} - ${testCase.expectedCategory} (Priority: ${testCase.priority})`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/industry-packs/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          description: testCase.description,
          userId: 1 // Assuming user ID 1 for testing
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const suggestion = result.data.suggestion;
        
        if (suggestion) {
          console.log(`✅ Industry Pack Rule Matched!`);
          console.log(`   Pack: ${suggestion.industryPack}`);
          console.log(`   Rule: ${suggestion.packRule}`);
          console.log(`   Debit: ${suggestion.debitSide?.suggestedAccountName} (${suggestion.debitSide?.confidence}%)`);
          console.log(`   Credit: ${suggestion.creditSide?.suggestedAccountName} (${suggestion.creditSide?.confidence}%)`);
          console.log(`   Overall: ${suggestion.overallConfidence}%`);
          
          // Check if the suggestion matches our expectations
          if (suggestion.industryPack === testCase.expectedPack) {
            console.log(`🎯 Pack Match: CORRECT`);
            correctCount++;
          } else {
            console.log(`❌ Pack Match: INCORRECT (Expected: ${testCase.expectedPack}, Got: ${suggestion.industryPack})`);
            incorrectCount++;
          }
        } else {
          console.log(`❌ No Industry Pack rule matched`);
          incorrectCount++;
        }
      } else {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
        errors++;
      }
    } catch (error) {
      console.log(`❌ Network Error:`, error.message);
      errors++;
    }
  }
  
  // Summary
  console.log('\n📊 INDUSTRY PACKS TEST RESULTS:');
  console.log(`✅ Correct: ${correctCount}`);
  console.log(`❌ Incorrect: ${incorrectCount}`);
  console.log(`⚠️ Errors: ${errors}`);
  console.log(`📈 Accuracy: ${((correctCount / (correctCount + incorrectCount)) * 100).toFixed(1)}%`);
  
  // Priority breakdown
  const highPriority = industryPackTestCases.filter(t => t.priority === 'HIGH');
  const mediumPriority = industryPackTestCases.filter(t => t.priority === 'MEDIUM');
  
  console.log(`\n🎯 Priority Breakdown:`);
  console.log(`HIGH Priority: ${highPriority.length} test cases`);
  console.log(`MEDIUM Priority: ${mediumPriority.length} test cases`);
}

// Test dual-side suggestions with Industry Packs
async function testDualSideSuggestions() {
  console.log('🔄 Testing Dual-Side Suggestions with Industry Packs...');
  
  const dualSideTestCases = [
    'Stripe merchant fee for payment processing',
    'Contractor payment for electrical work',
    'Building permit fee for new construction',
    'Credit card payment to reduce balance'
  ];
  
  for (const description of dualSideTestCases) {
    console.log(`\n🔍 Testing Dual-Side: "${description}"`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/suggestions/dual-sides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          description,
          userId: 1
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const suggestion = result.data;
        
        if (suggestion) {
          console.log(`✅ Dual-Side Suggestion Generated!`);
          console.log(`   Industry Pack: ${suggestion.industryPack || 'None'}`);
          console.log(`   Pack Rule: ${suggestion.packRule || 'None'}`);
          console.log(`   Debit: ${suggestion.debitSide?.suggestedAccountName} (${suggestion.debitSide?.confidence}%)`);
          console.log(`   Credit: ${suggestion.creditSide?.suggestedAccountName} (${suggestion.creditSide?.confidence}%)`);
          console.log(`   Overall: ${suggestion.overallConfidence}%`);
          console.log(`   Type: ${suggestion.transactionType}`);
          console.log(`   Rationale: ${suggestion.rationale}`);
        } else {
          console.log(`❌ No dual-side suggestion generated`);
        }
      } else {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Network Error:`, error.message);
    }
  }
}

// Main test function
async function runIndustryPackTests() {
  console.log('🚀 Starting Industry Packs Comprehensive Test Suite...');
  
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No authentication token found. Please log in first.');
    return;
  }
  
  console.log('🔐 Authentication token found, proceeding with tests...');
  
  try {
    // Test 1: Industry Pack API endpoints
    await testIndustryPackAPI();
    
    // Test 2: Industry Pack rule matching
    await testIndustryPackRules();
    
    // Test 3: Dual-side suggestions with Industry Packs
    await testDualSideSuggestions();
    
    console.log('\n🎉 Industry Packs Test Suite Completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export functions for manual testing
window.testIndustryPacks = {
  runAll: runIndustryPackTests,
  testAPI: testIndustryPackAPI,
  testRules: testIndustryPackRules,
  testDualSide: testDualSideSuggestions,
  testCases: industryPackTestCases
};

console.log('🏭 Industry Packs test functions loaded. Run testIndustryPacks.runAll() to start testing.');
