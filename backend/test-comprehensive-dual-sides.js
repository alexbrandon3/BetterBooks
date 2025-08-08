const axios = require('axios');

const BASE_URL = 'http://localhost:10000/api';

// Test scenarios from acceptance criteria
const testScenarios = [
  {
    description: 'initial contribution',
    expected: { debit: 'Cash', credit: "Owner's Capital" }
  },
  {
    description: 'owner draw for personal use',
    expected: { debit: "Owner's Draw", credit: 'Cash' }
  },
  {
    description: 'paid rent',
    expected: { debit: 'Rent Expense', credit: 'Cash' }
  },
  {
    description: 'received customer payment',
    expected: { debit: 'Cash', credit: 'Accounts Receivable' }
  },
  {
    description: 'bought laptop',
    expected: { debit: 'Equipment', credit: 'Cash' }
  },
  {
    description: 'loan repayment',
    expected: { debit: 'Loan Payable', credit: 'Cash' }
  },
  // Ambiguous cases
  {
    description: 'payment',
    expected: { shouldBeNull: true, reason: 'Too vague' }
  },
  {
    description: 'transaction',
    expected: { shouldBeNull: true, reason: 'Too vague' }
  },
  // False positive scenarios
  {
    description: 'cash flow statement',
    expected: { shouldBeNull: true, reason: 'Should not match cash account' }
  },
  {
    description: 'interest rate discussion',
    expected: { shouldBeNull: true, reason: 'Should not match interest expense' }
  }
];

async function testScenario(description, expected) {
  console.log(`\n🔍 Testing: "${description}"`);
  console.log(`📋 Expected:`, expected);
  
  try {
    const response = await axios.post(`${BASE_URL}/suggestions/debug-dual-sides`, {
      description: description
    });
    
    const result = response.data;
    console.log(`📊 Response status: ${response.status}`);
    
    if (result.dualSideResult === null) {
      if (expected.shouldBeNull) {
        console.log(`✅ CORRECT: Returned null as expected (${expected.reason})`);
      } else {
        console.log(`❌ UNEXPECTED: Returned null but expected:`, expected);
      }
    } else {
      const { debitAccount, creditAccount, overallConfidence } = result.dualSideResult;
      console.log(`💳 Debit: ${debitAccount.name} (${debitAccount.score}%)`);
      console.log(`💳 Credit: ${creditAccount.name} (${creditAccount.score}%)`);
      console.log(`📊 Overall Confidence: ${overallConfidence}%`);
      
      if (expected.shouldBeNull) {
        console.log(`❌ UNEXPECTED: Should have returned null (${expected.reason})`);
      } else {
        const debitMatch = debitAccount.name.toLowerCase().includes(expected.debit.toLowerCase());
        const creditMatch = creditAccount.name.toLowerCase().includes(expected.credit.toLowerCase());
        
        if (debitMatch && creditMatch) {
          console.log(`✅ CORRECT: Both accounts match expected`);
        } else {
          console.log(`⚠️  PARTIAL: Debit match: ${debitMatch}, Credit match: ${creditMatch}`);
          console.log(`   Expected: ${expected.debit} ↔ ${expected.credit}`);
          console.log(`   Got: ${debitAccount.name} ↔ ${creditAccount.name}`);
        }
      }
    }
  } catch (error) {
    console.log(`❌ Error testing "${description}":`, error.message);
  }
}

async function runComprehensiveTest() {
  console.log('🧪 COMPREHENSIVE DUAL-SIDE SUGGESTION TEST');
  console.log('='.repeat(60));
  
  for (const scenario of testScenarios) {
    await testScenario(scenario.description, scenario.expected);
  }
  
  console.log('\n🎯 Test Summary');
  console.log('='.repeat(60));
  console.log(`Total scenarios tested: ${testScenarios.length}`);
}

// Run the test
runComprehensiveTest().catch(console.error);
