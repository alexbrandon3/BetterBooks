import { AppDataSource } from './src/config/data-source';

async function testContributionIssue() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const testPhrases = [
      'initial contribution',
      'owner contribution', 
      'capital contribution',
      'equity investment'
    ];

    console.log('\n🔍 TESTING CONTRIBUTION PHRASES:');
    console.log('=' .repeat(60));

    for (const phrase of testPhrases) {
      console.log(`\n📝 PHRASE: "${phrase}"`);
      
      // Test keyword extraction
      const normalizedDescription = phrase.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`   Normalized: "${normalizedDescription}"`);
      
      const words = normalizedDescription.split(' ').filter(word => word.length > 2);
      console.log(`   Words: [${words.join(', ')}]`);
      
      // Check if any words match business keywords
      const businessKeywords = [
        'sold', 'sale', 'sales', 'revenue', 'income', 'refund',
        'bought', 'buy', 'purchase', 'inventory',
        'rent', 'utilities', 'marketing', 'advertising', 'insurance', 'legal', 'accounting',
        'payroll', 'salary', 'wages', 'employee',
        'tax', 'taxes', 'irs'
      ];
      
      const extractedKeywords = words.filter(word => businessKeywords.includes(word.toLowerCase()));
      console.log(`   Extracted keywords: [${extractedKeywords.join(', ')}]`);
      
      if (extractedKeywords.length === 0) {
        console.log(`   ❌ NO KEYWORDS EXTRACTED - This is the problem!`);
        console.log(`   Missing keywords needed: "contribution", "investment", "equity", "capital"`);
      }
    }

    console.log('\n💡 DIAGNOSIS:');
    console.log('The issue is that "contribution" and "investment" are not in the businessKeywords list');
    console.log('in the extractKeywords() method. This means these phrases get no AccountWeight processing');
    console.log('and fall back to other suggestion methods.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

testContributionIssue(); 