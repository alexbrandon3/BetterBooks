// Category Field Improvements Test Script
// Run this in your browser's developer console on the BetterBooks app
// This tests all the improvements we made to the category field

console.log('🧪 Testing Category Field Improvements...');

// Test the specific fixes we made
const categoryTestCases = [
  // Fuel/Transportation fixes
  { description: 'Gas station fuel purchase', expectedCategory: 'Transportation' },
  { description: 'Exxon fuel for delivery truck', expectedCategory: 'Transportation' },
  { description: 'Shell gasoline purchase', expectedCategory: 'Transportation' },
  
  // Printer/Office Supplies fixes
  { description: 'Printer paper and ink from Staples', expectedCategory: 'Supplies' },
  { description: 'Office depot toner cartridge', expectedCategory: 'Supplies' },
  { description: 'Photocopy paper purchase', expectedCategory: 'Supplies' },
  
  // Insurance fixes
  { description: 'Insurance premium payment', expectedCategory: 'Insurance' },
  { description: 'Business liability insurance', expectedCategory: 'Insurance' },
  { description: 'Property insurance policy', expectedCategory: 'Insurance' },
  
  // Other common business transactions
  { description: 'Pizza delivery for office lunch', expectedCategory: 'Food' },
  { description: 'Client dinner at restaurant', expectedCategory: 'Sales' },
  { description: 'Office supplies from Amazon', expectedCategory: 'Supplies' },
  { description: 'Employee payroll payment', expectedCategory: 'Payroll' },
  { description: 'Google Ads campaign', expectedCategory: 'Marketing' },
  { description: 'Legal consultation fee', expectedCategory: 'Legal' },
  { description: 'Office rent payment', expectedCategory: 'Rent' },
  { description: 'Electricity bill for office', expectedCategory: 'Utilities' },
  { description: 'Client payment received', expectedCategory: 'Sales' },
  { description: 'Quarterly tax payment to IRS', expectedCategory: 'Taxes' }
];

// Function to test the specific fixes
async function runCategoryTests() {
  console.log('🔍 Testing Category Improvements...');
  console.log('📝 Testing the specific fixes we made');
  
  let successCount = 0;
  let failureCount = 0;
  const results = [];
  
  for (let i = 0; i < categoryTestCases.length; i++) {
    const testCase = categoryTestCases[i];
    console.log(`\n${i + 1}/${categoryTestCases.length}: Testing "${testCase.description}"`);
    console.log(`   Expected: ${testCase.expectedCategory}`);
    
    try {
      const response = await fetch('https://betterbooks.onrender.com/api/suggestions/suggest-category', {
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
          const isCorrect = data.suggestedCategory === testCase.expectedCategory;
          const status = isCorrect ? '✅' : '❌';
          console.log(`${status} Actual: "${data.suggestedCategory}" (${data.confidence}% confidence)`);
          console.log(`   Reason: ${data.reason}`);
          
          if (isCorrect) {
            successCount++;
          } else {
            failureCount++;
          }
          
          results.push({
            description: testCase.description,
            expected: testCase.expectedCategory,
            actual: data.suggestedCategory,
            confidence: data.confidence,
            reason: data.reason,
            correct: isCorrect
          });
        } else {
          console.log('❌ No suggestion returned');
          failureCount++;
          results.push({
            description: testCase.description,
            expected: testCase.expectedCategory,
            actual: null,
            confidence: 0,
            reason: 'No suggestion',
            correct: false
          });
        }
      } else {
        console.log(`❌ API Error: HTTP ${response.status}`);
        failureCount++;
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
      failureCount++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n📊 CATEGORY TEST SUMMARY:');
  console.log(`✅ Correct suggestions: ${successCount}`);
  console.log(`❌ Incorrect suggestions: ${failureCount}`);
  console.log(`📈 Accuracy: ${((successCount / categoryTestCases.length) * 100).toFixed(1)}%`);
  
  // Show incorrect cases
  const incorrectCases = results.filter(r => !r.correct);
  if (incorrectCases.length > 0) {
    console.log('\n❌ INCORRECT CASES:');
    incorrectCases.forEach((result, index) => {
      console.log(`${index + 1}. "${result.description}"`);
      console.log(`   Expected: ${result.expected}`);
      console.log(`   Actual: ${result.actual || 'No suggestion'}`);
      console.log(`   Reason: ${result.reason}`);
    });
  }
  
  return results;
}

// Function to test frontend integration
function testCategoryField() {
  console.log('🔍 Testing Category Field Integration...');
  
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
  } else {
    console.log('❌ Help text not found');
  }
  
  // Test with a description
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

// Function to test the UI improvements
function testCategoryUI() {
  console.log('🔍 Testing Category UI Improvements...');
  
  // Check for category suggestion card
  const suggestionCards = document.querySelectorAll('.bg-blue-50, .bg-green-50, .bg-yellow-50');
  if (suggestionCards.length > 0) {
    console.log(`✅ Found ${suggestionCards.length} suggestion cards`);
  } else {
    console.log('❌ No suggestion cards found');
  }
  
  // Check for category field improvements
  const categoryField = document.querySelector('input[placeholder*="Food, Transportation"]');
  if (categoryField) {
    console.log('✅ Category field with improved placeholder found');
    
    // Check if the field has the new styling
    const hasNewStyling = categoryField.className.includes('focus:border-blue-500');
    if (hasNewStyling) {
      console.log('✅ Category field has improved styling');
    } else {
      console.log('❌ Category field styling not updated');
    }
  }
  
  // Check for help text
  const helpText = document.querySelector('.text-xs.text-gray-500');
  if (helpText && helpText.textContent.includes('Categories help organize')) {
    console.log('✅ Help text is present and correct');
  } else {
    console.log('❌ Help text not found or incorrect');
  }
}

// Function to test the complete user flow
async function testCategoryFlow() {
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
  
  // Step 3: Type a description that should trigger category suggestion
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
window.runCategoryTests = runCategoryTests;
window.testCategoryField = testCategoryField;
window.testCategoryUI = testCategoryUI;
window.testCategoryFlow = testCategoryFlow;

console.log('🚀 Category test functions available:');
console.log('  - runCategoryTests() - Test the specific fixes we made');
console.log('  - testCategoryField() - Test frontend category field');
console.log('  - testCategoryUI() - Test UI improvements');
console.log('  - testCategoryFlow() - Test complete user flow');

// Auto-run the category tests
console.log('\n🎯 Auto-running category tests...');
runCategoryTests().then(results => {
  console.log('\n🎉 Category tests completed!');
  console.log('💡 Use the exported functions to run additional tests.');
});
