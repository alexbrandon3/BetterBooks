// Category Suggestion Test Script - Updated for Improved Logic
// Run this in your browser's developer console on the BetterBooks app

console.log('🧪 Starting Category Suggestion Tests - Improved Logic...');

// Test cases that were problematic in previous runs
const categoryTestCases = [
  // Problematic cases from previous test
  { description: 'Gas station fuel purchase', expected: 'Transportation' },
  { description: 'Printer paper and ink', expected: 'Supplies' },
  { description: 'Insurance premium payment', expected: 'Insurance' },
  { description: 'Print advertising in local paper', expected: 'Marketing' },
  
  // Additional test cases
  { description: 'Gas station fuel', expected: 'Transportation' },
  { description: 'Fuel purchase', expected: 'Transportation' },
  { description: 'Office supplies from Staples', expected: 'Supplies' },
  { description: 'Printer toner', expected: 'Supplies' },
  { description: 'Insurance policy', expected: 'Insurance' },
  { description: 'Google Ads campaign', expected: 'Marketing' },
  { description: 'Facebook advertising', expected: 'Marketing' },
  { description: 'Business lunch at Chipotle', expected: 'Food' },
  { description: 'Office rent payment', expected: 'Rent' },
  { description: 'Electricity bill for office', expected: 'Utilities' },
  { description: 'Employee payroll payment', expected: 'Payroll' },
  { description: 'Quarterly tax payment to IRS', expected: 'Taxes' }
];

// Function to test specific category suggestions
async function runCategoryTests() {
  console.log('🔍 Testing Category Suggestions - Improved Logic...');
  console.log('📝 Total test cases:', categoryTestCases.length);
  
  let correctCount = 0;
  let incorrectCount = 0;
  const results = [];

  for (let i = 0; i < categoryTestCases.length; i++) {
    const testCase = categoryTestCases[i];
    console.log(`\n${i + 1}/${categoryTestCases.length}: Testing "${testCase.description}"`);
    console.log(`Expected: ${testCase.expected}`);
    
    try {
      const response = await fetch('/api/suggestions/suggest-category', {
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
          } else {
            incorrectCount++;
          }
          
          results.push({
            description: testCase.description,
            expected: testCase.expected,
            actual: data.suggestedCategory,
            confidence: data.confidence,
            reason: data.reason,
            isCorrect
          });
        } else {
          console.log('❌ No suggestion returned');
          incorrectCount++;
          results.push({
            description: testCase.description,
            expected: testCase.expected,
            actual: null,
            confidence: 0,
            reason: 'No suggestion',
            isCorrect: false
          });
        }
      } else {
        console.log(`❌ API Error: HTTP ${response.status}`);
        incorrectCount++;
        results.push({
          description: testCase.description,
          expected: testCase.expected,
          actual: null,
          confidence: 0,
          reason: `HTTP ${response.status} error`,
          isCorrect: false
        });
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
      incorrectCount++;
      results.push({
        description: testCase.description,
        expected: testCase.expected,
        actual: null,
        confidence: 0,
        reason: error.message,
        isCorrect: false
      });
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n📊 TEST SUMMARY:');
  console.log(`✅ Correct suggestions: ${correctCount}`);
  console.log(`❌ Incorrect suggestions: ${incorrectCount}`);
  console.log(`📈 Accuracy: ${((correctCount / categoryTestCases.length) * 100).toFixed(1)}%`);

  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  results.forEach((result, index) => {
    const status = result.isCorrect ? '✅' : '❌';
    console.log(`${status} ${index + 1}. "${result.description}"`);
    console.log(`   Expected: ${result.expected}`);
    console.log(`   Actual: ${result.actual || 'No suggestion'}`);
    if (result.confidence > 0) {
      console.log(`   Confidence: ${result.confidence}%`);
      console.log(`   Reason: ${result.reason}`);
    }
  });

  return results;
}

// Function to test the frontend category field
function testCategoryField() {
  console.log('🔍 Testing Frontend Category Field...');
  
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
    
    // Test with a specific description
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
      } else {
        console.log(`❌ Category field not populated`);
      }
    }, 2000);
  } else {
    console.log('❌ Description field not found');
  }
}

// Function to test UI improvements
function testCategoryUI() {
  console.log('🔍 Testing Category Field UI Improvements...');
  
  // Check for placeholder text
  const categoryField = document.querySelector('input[placeholder*="Food, Transportation"]');
  if (categoryField) {
    console.log('✅ Category field with improved placeholder found');
    console.log(`Placeholder: "${categoryField.placeholder}"`);
  } else {
    console.log('❌ Category field not found');
  }
  
  // Check for help text
  const helpText = document.querySelector('text[class*="text-sm text-gray-500"]');
  if (helpText) {
    console.log('✅ Help text found');
    console.log(`Help text: "${helpText.textContent}"`);
  } else {
    console.log('❌ Help text not found');
  }
  
  // Check for suggestion card
  const suggestionCard = document.querySelector('[data-testid="category-suggestion"]');
  if (suggestionCard) {
    console.log('✅ Category suggestion card found');
  } else {
    console.log('❌ Category suggestion card not found');
  }
}

// Function to test complete user flow
function testCategoryFlow() {
  console.log('🔍 Testing Complete Category Flow...');
  
  // Simulate user entering a description
  const descriptionField = document.querySelector('input[placeholder*="Enter transaction description"]');
  const categoryField = document.querySelector('input[placeholder*="Food, Transportation"]');
  
  if (!descriptionField || !categoryField) {
    console.log('❌ Required fields not found');
    return;
  }
  
  console.log('✅ All required fields found');
  
  // Test flow with a specific description
  const testDescription = 'Insurance premium payment';
  console.log(`📝 Testing flow with: "${testDescription}"`);
  
  // Clear fields first
  descriptionField.value = '';
  categoryField.value = '';
  
  // Simulate typing
  descriptionField.value = testDescription;
  descriptionField.dispatchEvent(new Event('input', { bubbles: true }));
  descriptionField.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Check results after delay
  setTimeout(() => {
    const categoryValue = categoryField.value;
    console.log(`📊 Flow test result:`);
    console.log(`   Description: "${testDescription}"`);
    console.log(`   Category: "${categoryValue || 'Not populated'}"`);
    
    if (categoryValue) {
      console.log('✅ Category field was populated by suggestion');
    } else {
      console.log('❌ Category field was not populated');
    }
  }, 3000);
}

// Export functions for manual testing
window.runCategoryTests = runCategoryTests;
window.testCategoryField = testCategoryField;
window.testCategoryUI = testCategoryUI;
window.testCategoryFlow = testCategoryFlow;

console.log('🚀 Test functions available:');
console.log(' - runCategoryTests() - Test specific problematic cases');
console.log(' - testCategoryField() - Test frontend category field');
console.log(' - testCategoryUI() - Test UI improvements');
console.log(' - testCategoryFlow() - Test complete user flow');

// Auto-run the category tests
console.log('\n🎯 Auto-running category tests...');
runCategoryTests().then(results => {
  console.log('\n🎉 Category tests completed!');
  console.log('💡 Use the exported functions to run additional tests.');
});
