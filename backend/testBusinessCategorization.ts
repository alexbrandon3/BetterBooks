import { getSuggestedMetadata } from './src/utils/accountCategorizer';

function testBusinessCategorization() {
  console.log('🧪 Testing Business-Focused Categorization\n');
  
  const testAccounts = [
    'Cost of Goods Sold',
    'Bank Fees',
    'Depreciation Expense',
    'Shipping & Delivery',
    'Business License',
    'Office Supplies',
    'Professional Membership',
    'Contract Labor',
    'Security System',
    'Employee Training',
    'Interest Expense'
  ];
  
  testAccounts.forEach(accountName => {
    console.log(`\n📋 Testing: "${accountName}"`);
    const suggestion = getSuggestedMetadata(accountName);
    
    if (suggestion) {
      console.log(`✅ Type: ${suggestion.type}`);
      console.log(`✅ Category: ${suggestion.category}`);
      console.log(`✅ Subcategory: ${suggestion.subcategory}`);
      console.log(`✅ Financial Category: ${suggestion.financialCategory}`);
      console.log(`✅ Financial Subcategory: ${suggestion.financialSubcategory}`);
      console.log(`✅ Confidence: ${suggestion.confidence}`);
      console.log(`✅ Explanation: ${suggestion.explanation}`);
    } else {
      console.log('❌ No suggestion found');
    }
  });
  
  console.log('\n🎯 Testing Personal Finance Keywords (should be removed):');
  const personalAccounts = [
    'Netflix Subscription',
    'Gym Membership',
    'Pet Food',
    'Shopping Spree'
  ];
  
  personalAccounts.forEach(accountName => {
    console.log(`\n📋 Testing: "${accountName}"`);
    const suggestion = getSuggestedMetadata(accountName);
    
    if (suggestion) {
      console.log(`⚠️  Found suggestion (should be removed): ${suggestion.category}`);
    } else {
      console.log('✅ No suggestion found (correctly removed)');
    }
  });
}

testBusinessCategorization(); 