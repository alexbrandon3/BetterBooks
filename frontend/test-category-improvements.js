// Category Suggestion Test Script - Testing Our Specific Improvements
// Run this in your browser's developer console on the BetterBooks app

console.log('🧪 Testing Category Suggestion Improvements...');

// Use the correct production API URL
const API_BASE_URL = 'https://betterbooks.onrender.com/api';

// Test cases specifically targeting the improvements we made
const improvementTestCases = [
  // FUEL/TRANSPORTATION FIXES (were incorrectly categorized as "Supplies" or "Food")
  { description: 'Gas station fuel purchase', expected: 'Transportation', priority: 'HIGH' },
  { description: 'Exxon fuel for delivery truck', expected: 'Transportation', priority: 'HIGH' },
  { description: 'Shell gasoline purchase', expected: 'Transportation', priority: 'HIGH' },
  { description: 'BP fuel purchase', expected: 'Transportation', priority: 'HIGH' },
  { description: 'Chevron gasoline', expected: 'Transportation', priority: 'HIGH' },
  { description: 'Fuel for company vehicle', expected: 'Transportation', priority: 'HIGH' },
  
  // PRINTER/OFFICE SUPPLIES FIXES (were incorrectly categorized as "Food")
  { description: 'Printer paper and ink from Staples', expected: 'Supplies', priority: 'HIGH' },
  { description: 'Office depot toner cartridge', expected: 'Supplies', priority: 'HIGH' },
  { description: 'Photocopy paper purchase', expected: 'Supplies', priority: 'HIGH' },
  { description: 'Printer toner from Amazon', expected: 'Supplies', priority: 'HIGH' },
  { description: 'Office supplies from Staples', expected: 'Supplies', priority: 'HIGH' },
  { description: 'Computer paper and ink', expected: 'Supplies', priority: 'HIGH' },
  
  // INSURANCE FIXES (were incorrectly categorized as "Rent")
  { description: 'Insurance premium payment', expected: 'Insurance', priority: 'HIGH' },
  { description: 'Business liability insurance', expected: 'Insurance', priority: 'HIGH' },
  { description: 'Property insurance policy', expected: 'Insurance', priority: 'HIGH' },
  { description: 'Vehicle insurance premium', expected: 'Insurance', priority: 'HIGH' },
  { description: 'Workers comp insurance', expected: 'Insurance', priority: 'HIGH' },
  
  // MARKETING FIXES (were incorrectly categorized due to "pr" keyword)
  { description: 'Print advertising in local paper', expected: 'Marketing', priority: 'MEDIUM' },
  { description: 'Print marketing materials', expected: 'Marketing', priority: 'MEDIUM' },
  { description: 'Print brochures for business', expected: 'Marketing', priority: 'MEDIUM' },
  
  // OTHER COMMON BUSINESS TRANSACTIONS (control group)
  { description: 'Pizza delivery for office lunch', expected: 'Food', priority: 'LOW' },
  { description: 'Client dinner at restaurant', expected: 'Sales', priority: 'LOW' },
  { description: 'Employee payroll payment', expected: 'Payroll', priority: 'LOW' },
  { description: 'Google Ads campaign', expected: 'Marketing', priority: 'LOW' },
  { description: 'Legal consultation fee', expected: 'Legal', priority: 'LOW' },
  { description: 'Office rent payment', expected: 'Rent', priority: 'LOW' },
  { description: 'Electricity bill for office', expected: 'Utilities', priority: 'LOW' },
  { description: 'Client payment received', expected: 'Sales', priority: 'LOW' },
  { description: 'Quarterly tax payment to IRS', expected: 'Taxes', priority: 'LOW' }
];

// Function to test our specific improvements
async function testImprovements() {
  console.log('🔍 Testing Our Specific Improvements...');
  console.log('📝 Total test cases:', improvementTestCases.length);
  console.log('🌐 Using API URL:', API_BASE_URL);
  
  let correctCount = 0;
  let incorrectCount = 0;
  const results = [];
  const priorityResults = { HIGH: { correct: 0, total: 0 }, MEDIUM: { correct: 0, total: 0 }, LOW: { correct: 0, total: 0 } };

  for (let i = 0; i < improvementTestCases.length; i++) {
    const testCase = improvementTestCases[i];
    console.log(`\n${i + 1}/${improvementTestCases.length}: Testing "${testCase.description}"`);
    console.log(`Expected: ${testCase.expected} (Priority: ${testCase.priority})`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/suggestions/suggest-category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token') || 'test-token'
        },
        body: JSON.stringify({ description: testCase.description })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.suggestedCategory) {
          const isCorrect = data.suggestedCategory === testCase.expected;
          const status = isCorrect ? '✅' : '❌';
          
          console.log(`${status} Actual: "${data.suggestedCategory}" (${data.confidence}% confidence)`);
          console.log(`Reason: ${data.reason}`);
          
          if (isCorrect) {
            correctCount++;
            priorityResults[testCase.priority].correct++;
          } else {
            incorrectCount++;
          }
          priorityResults[testCase.priority].total++;
          
          results.push({
            description: testCase.description,
            expected: testCase.expected,
            actual: data.suggestedCategory,
            confidence: data.confidence,
            reason: data.reason,
            priority: testCase.priority,
            isCorrect
          });
        } else {
          console.log('❌ No suggestion returned');
          incorrectCount++;
          priorityResults[testCase.priority].total++;
          results.push({
            description: testCase.description,
            expected: testCase.expected,
            actual: null,
            confidence: 0,
            reason: 'No suggestion',
            priority: testCase.priority,
            isCorrect: false
          });
        }
      } else {
        console.log(`❌ API Error: HTTP ${response.status}`);
        incorrectCount++;
        priorityResults[testCase.priority].total++;
        results.push({
          description: testCase.description,
          expected: testCase.expected,
          actual: null,
          confidence: 0,
          reason: `HTTP ${response.status} error`,
          priority: testCase.priority,
          isCorrect: false
        });
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
      incorrectCount++;
      priorityResults[testCase.priority].total++;
      results.push({
        description: testCase.description,
        expected: testCase.expected,
        actual: null,
        confidence: 0,
        reason: error.message,
        priority: testCase.priority,
        isCorrect: false
      });
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n📊 IMPROVEMENT TEST SUMMARY:');
  console.log(`✅ Correct suggestions: ${correctCount}`);
  console.log(`❌ Incorrect suggestions: ${incorrectCount}`);
  console.log(`📈 Overall Accuracy: ${((correctCount / improvementTestCases.length) * 100).toFixed(1)}%`);
  
  // Priority-based results
  console.log('\n🎯 PRIORITY-BASED RESULTS:');
  Object.entries(priorityResults).forEach(([priority, stats]) => {
    if (stats.total > 0) {
      const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
      console.log(`${priority} Priority: ${stats.correct}/${stats.total} correct (${accuracy}%)`);
    }
  });

  // Show incorrect cases grouped by priority
  const incorrectCases = results.filter(r => !r.isCorrect);
  if (incorrectCases.length > 0) {
    console.log('\n❌ INCORRECT CASES BY PRIORITY:');
    ['HIGH', 'MEDIUM', 'LOW'].forEach(priority => {
      const priorityIncorrect = incorrectCases.filter(r => r.priority === priority);
      if (priorityIncorrect.length > 0) {
        console.log(`\n${priority} Priority Issues:`);
        priorityIncorrect.forEach((result, index) => {
          console.log(`  ${index + 1}. "${result.description}"`);
          console.log(`     Expected: ${result.expected}`);
          console.log(`     Actual: ${result.actual || 'No suggestion'}`);
          console.log(`     Reason: ${result.reason}`);
        });
      }
    });
  }

  return results;
}

// Function to test the frontend category field integration
function testCategoryFieldIntegration() {
  console.log('🔍 Testing Frontend Category Field Integration...');
  
  // Check if we're on the transactions page
  const categoryField = document.querySelector('input[placeholder*="Food, Transportation"]');
  if (!categoryField) {
    console.log('❌ Category field not found. Make sure you\'re on the Transactions page.');
    return false;
  }
  
  console.log('✅ Category field found');
  
  // Check for the help text
  const helpText = document.querySelector('.text-xs.text-gray-500');
  if (helpText) {
    console.log('✅ Help text found');
    console.log(`Help text: "${helpText.textContent}"`);
  } else {
    console.log('❌ Help text not found');
  }
  
  // Test with a description that should trigger category suggestion
  const descriptionField = document.querySelector('input[placeholder*="Enter transaction description"]');
  if (descriptionField) {
    console.log('✅ Description field found');
    
    // Test with a specific description that was problematic
    const testDescription = 'Gas station fuel purchase';
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
        return true;
      } else {
        console.log(`❌ Category field not populated`);
        return false;
      }
    }, 3000);
  } else {
    console.log('❌ Description field not found');
    return false;
  }
}

// Function to test the complete user flow
async function testCompleteFlow() {
  console.log('🔍 Testing Complete Category Flow...');
  
  // Step 1: Navigate to transactions page (if not already there)
  if (!document.querySelector('input[placeholder*="Food, Transportation"]')) {
    console.log('❌ Not on transactions page. Please navigate to the Transactions page first.');
    return;
  }
  console.log('✅ On transactions page');
  
  // Step 2: Find the description field
  const descriptionField = document.querySelector('input[placeholder*="Enter transaction description"]');
  if (!descriptionField) {
    console.log('❌ Description field not found');
    return;
  }
  console.log('✅ Description field found');
  
  // Step 3: Test with a description that was problematic
  const testDescription = 'Gas station fuel purchase';
  console.log(`📝 Typing: "${testDescription}"`);
  
  // Clear the field first
  descriptionField.value = '';
  descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Type the description
  descriptionField.value = testDescription;
  descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
  descriptionField.dispatchEvent(new Event('change', { bubbles: true }));
  
  console.log('⏳ Waiting for category suggestion...');
  
  // Step 4: Check if category field gets populated
  setTimeout(() => {
    const categoryField = document.querySelector('input[placeholder*="Food, Transportation"]');
    const categoryValue = categoryField?.value;
    
    if (categoryValue) {
      console.log(`✅ SUCCESS: Category field populated with "${categoryValue}"`);
      
      // Step 5: Check if suggestion card appears
      const suggestionCards = document.querySelectorAll('.bg-blue-50, .bg-green-50, .bg-yellow-50');
      if (suggestionCards.length > 0) {
        console.log(`✅ Suggestion cards appeared: ${suggestionCards.length} cards`);
      } else {
        console.log('❌ No suggestion cards appeared');
      }
    } else {
      console.log('❌ FAILURE: Category field not populated');
    }
  }, 3000);
}

// Export functions for manual testing
window.testImprovements = testImprovements;
window.testCategoryFieldIntegration = testCategoryFieldIntegration;
window.testCompleteFlow = testCompleteFlow;

console.log('🚀 Improvement test functions available:');
console.log(' - testImprovements() - Test our specific fixes');
console.log(' - testCategoryFieldIntegration() - Test frontend integration');
console.log(' - testCompleteFlow() - Test complete user flow');

// Auto-run the improvement tests
console.log('\n🎯 Auto-running improvement tests...');
testImprovements().then(results => {
  console.log('\n🎉 Improvement tests completed!');
  console.log('💡 Use the exported functions to run additional tests.');
});
