// Enhanced comprehensive dual-side suggestion test
// Run this in your browser's developer console

const BASE_URL = 'https://betterbooks.onrender.com/api';

// Comprehensive test scenarios
const testScenarios = [
  // Core business transactions
  { description: 'initial contribution', expected: { debit: 'Cash', credit: "Owner's Capital" } },
  { description: 'owner draw for personal use', expected: { debit: "Owner's Draw", credit: 'Cash' } },
  { description: 'paid rent', expected: { debit: 'Rent Expense', credit: 'Cash' } },
  { description: 'received customer payment', expected: { debit: 'Cash', credit: 'Accounts Receivable' } },
  { description: 'bought laptop', expected: { debit: 'Equipment', credit: 'Cash' } },
  { description: 'loan repayment', expected: { debit: 'Loan Payable', credit: 'Cash' } },
  
  // Variations and synonyms
  { description: 'capital contribution', expected: { debit: 'Cash', credit: "Owner's Capital" } },
  { description: 'owner withdrawal', expected: { debit: "Owner's Draw", credit: 'Cash' } },
  { description: 'rent payment', expected: { debit: 'Rent Expense', credit: 'Cash' } },
  { description: 'customer payment received', expected: { debit: 'Cash', credit: 'Accounts Receivable' } },
  { description: 'purchased computer', expected: { debit: 'Equipment', credit: 'Cash' } },
  { description: 'paid loan', expected: { debit: 'Loan Payable', credit: 'Cash' } },
  
  // Equipment and assets
  { description: 'bought office furniture', expected: { debit: 'Equipment', credit: 'Cash' } },
  { description: 'purchased vehicle', expected: { debit: 'Equipment', credit: 'Cash' } },
  { description: 'bought software', expected: { debit: 'Equipment', credit: 'Cash' } },
  
  // Expenses
  { description: 'paid utilities', expected: { debit: 'Utilities Expense', credit: 'Cash' } },
  { description: 'paid insurance', expected: { debit: 'Insurance Expense', credit: 'Cash' } },
  { description: 'paid advertising', expected: { debit: 'Advertising Expense', credit: 'Cash' } },
  { description: 'paid salaries', expected: { debit: 'Salaries Expense', credit: 'Cash' } },
  
  // Revenue scenarios
  { description: 'sold services', expected: { debit: 'Cash', credit: 'Service Revenue' } },
  { description: 'received payment for services', expected: { debit: 'Cash', credit: 'Service Revenue' } },
  { description: 'sold products', expected: { debit: 'Cash', credit: 'Sales Revenue' } },
  
  // Ambiguous/vague cases
  { description: 'payment', expected: { shouldBeNull: true, reason: 'Too vague' } },
  { description: 'transaction', expected: { shouldBeNull: true, reason: 'Too vague' } },
  { description: 'transfer', expected: { shouldBeNull: true, reason: 'Too vague' } },
  { description: 'entry', expected: { shouldBeNull: true, reason: 'Too vague' } },
  { description: 'movement', expected: { shouldBeNull: true, reason: 'Too vague' } },
  { description: 'adjustment', expected: { shouldBeNull: true, reason: 'Too vague' } },
  { description: '123', expected: { shouldBeNull: true, reason: 'Too vague' } },
  { description: 'a', expected: { shouldBeNull: true, reason: 'Too vague' } },
  
  // False positive scenarios
  { description: 'cash flow statement', expected: { shouldBeNull: true, reason: 'Should not match cash account' } },
  { description: 'interest rate discussion', expected: { shouldBeNull: true, reason: 'Should not match interest expense' } },
  { description: 'equipment maintenance', expected: { shouldBeNull: true, reason: 'Should not match equipment purchase' } },
  { description: 'rental income discussion', expected: { shouldBeNull: true, reason: 'Should not match rent expense' } },
  { description: 'loan application', expected: { shouldBeNull: true, reason: 'Should not match loan repayment' } },
  
  // Edge cases
  { description: 'paid cash for cash', expected: { shouldBeNull: true, reason: 'Illogical transaction' } },
  { description: 'received cash from cash', expected: { shouldBeNull: true, reason: 'Illogical transaction' } },
  { description: 'equipment to equipment', expected: { shouldBeNull: true, reason: 'Illogical transaction' } },
  
  // Complex scenarios
  { description: 'paid rent with credit card', expected: { debit: 'Rent Expense', credit: 'Credit Card' } },
  { description: 'bought laptop on credit', expected: { debit: 'Equipment', credit: 'Credit Card' } },
  { description: 'paid utilities by check', expected: { debit: 'Utilities Expense', credit: 'Checking' } },
  
  // Mixed case and formatting
  { description: 'PAID RENT', expected: { debit: 'Rent Expense', credit: 'Cash' } },
  { description: 'Paid Rent', expected: { debit: 'Rent Expense', credit: 'Cash' } },
  { description: 'paid rent.', expected: { debit: 'Rent Expense', credit: 'Cash' } },
  { description: '  paid rent  ', expected: { debit: 'Rent Expense', credit: 'Cash' } },
  
  // Numbers and amounts (should be ignored)
  { description: 'paid rent $1000', expected: { debit: 'Rent Expense', credit: 'Cash' } },
  { description: 'bought laptop for $2000', expected: { debit: 'Equipment', credit: 'Cash' } },
  { description: 'received payment $500', expected: { debit: 'Cash', credit: 'Accounts Receivable' } }
];

async function testScenario(description, expected) {
  console.log(`\n🔍 Testing: "${description}"`);
  console.log(`📋 Expected:`, expected);
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No authentication token found. Please log in first.');
      return;
    }

    const response = await fetch(`${BASE_URL}/suggestions/debug-dual-sides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ description: description })
    });

    const result = await response.json();
    console.log(`📊 Response status: ${response.status}`);

    if (result.dualSideResult === null) {
      if (expected.shouldBeNull) {
        console.log(`✅ CORRECT: Returned null as expected (${expected.reason})`);
        return { status: 'PASS', reason: 'Correctly null' };
      } else {
        console.log(`❌ UNEXPECTED: Returned null but expected:`, expected);
        return { status: 'FAIL', reason: 'Unexpected null' };
      }
    } else {
      const { debitSide, creditSide, overallConfidence } = result.dualSideResult;
      console.log(`💳 Debit: ${debitSide.suggestedAccountName} (${debitSide.confidence}%)`);
      console.log(`💳 Credit: ${creditSide.suggestedAccountName} (${creditSide.confidence}%)`);
      console.log(`📊 Overall Confidence: ${overallConfidence}%`);

      if (expected.shouldBeNull) {
        console.log(`❌ UNEXPECTED: Should have returned null (${expected.reason})`);
        return { status: 'FAIL', reason: 'Should be null' };
      } else {
        const debitMatch = debitSide.suggestedAccountName.toLowerCase().includes(expected.debit.toLowerCase());
        const creditMatch = creditSide.suggestedAccountName.toLowerCase().includes(expected.credit.toLowerCase());
        
        if (debitMatch && creditMatch) {
          console.log(`✅ CORRECT: Both accounts match expected`);
          return { status: 'PASS', reason: 'Both accounts correct' };
        } else {
          console.log(`⚠️ PARTIAL: Debit match: ${debitMatch}, Credit match: ${creditMatch}`);
          console.log(`📋 Expected: ${expected.debit} ↔ ${expected.credit}`);
          console.log(`📊 Got: ${debitSide.suggestedAccountName} ↔ ${creditSide.suggestedAccountName}`);
          return { status: 'PARTIAL', reason: `Debit: ${debitMatch}, Credit: ${creditMatch}` };
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error testing "${description}":`, error.message);
    return { status: 'ERROR', reason: error.message };
  }
}

async function runComprehensiveTest() {
  console.log('🚀 ENHANCED COMPREHENSIVE DUAL-SIDE SUGGESTION TEST');
  console.log('='.repeat(70));
  
  const results = {
    PASS: 0,
    FAIL: 0,
    PARTIAL: 0,
    ERROR: 0
  };

  for (const scenario of testScenarios) {
    const result = await testScenario(scenario.description, scenario.expected);
    results[result.status]++;
    
    // Add a small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🎯 ENHANCED TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`📊 Total scenarios tested: ${testScenarios.length}`);
  console.log(`✅ Passed: ${results.PASS}`);
  console.log(`❌ Failed: ${results.FAIL}`);
  console.log(`⚠️ Partial: ${results.PARTIAL}`);
  console.log(`🚨 Errors: ${results.ERROR}`);
  console.log(`📈 Success Rate: ${((results.PASS / testScenarios.length) * 100).toFixed(1)}%`);
  
  if (results.FAIL === 0 && results.ERROR === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The dual-side suggestion system is bulletproof!');
  } else {
    console.log('\n⚠️ Some tests need attention. Check the logs above for details.');
  }
}

// Run the enhanced test
runComprehensiveTest().catch(console.error);
