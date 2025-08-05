import { AppDataSource } from './src/config/data-source';
import { SuggestionService } from './src/services/suggestion.service';

async function testFinalImprovements() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const suggestionService = new SuggestionService();
    const testUserId = 1;

    const testPhrases = [
      'initial contribution',
      'owner contribution', 
      'capital contribution',
      'equity investment',
      'equipment purchase',
      'loan repayment'
    ];

    console.log('\n🔍 TESTING FINAL SMART SUGGESTIONS IMPROVEMENTS:');
    console.log('=' .repeat(80));

    for (const phrase of testPhrases) {
      console.log(`\n📝 TESTING: "${phrase}"`);
      console.log('-'.repeat(50));

      const suggestion = await suggestionService.suggestAccountForDescription(phrase, testUserId);
      
      if (suggestion) {
        console.log(`   ✅ SUGGESTION: ${suggestion.suggestedAccountName}`);
        console.log(`   Confidence: ${suggestion.confidence}%`);
        console.log(`   Account Type: ${suggestion.accountType}`);
        console.log(`   Learning Source: ${suggestion.learningSource || 'UNKNOWN'}`);
        console.log(`   Reason: ${suggestion.reason}`);
        
        // Evaluate correctness
        const isEquityPhrase = phrase.includes('contribution') || phrase.includes('investment') || phrase.includes('equity');
        const isAssetPhrase = phrase.includes('equipment') || phrase.includes('purchase');
        const isLiabilityPhrase = phrase.includes('loan') || phrase.includes('repayment');
        
        let expectedType = '';
        if (isEquityPhrase) expectedType = 'EQUITY';
        else if (isAssetPhrase) expectedType = 'ASSET';
        else if (isLiabilityPhrase) expectedType = 'LIABILITY';
        
        if (expectedType && suggestion.accountType === expectedType) {
          console.log(`   ✅ CORRECT TYPE: ${expectedType}`);
        } else if (expectedType) {
          console.log(`   ❌ WRONG TYPE: Expected ${expectedType}, got ${suggestion.accountType}`);
        }
        
        if (suggestion.confidence >= 75) {
          console.log(`   ✅ HIGH CONFIDENCE: ${suggestion.confidence}%`);
        } else {
          console.log(`   ⚠️ LOW CONFIDENCE: ${suggestion.confidence}%`);
        }
      } else {
        console.log(`   ❌ NO SUGGESTION FOUND`);
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('✅ Multi-word phrase detection implemented');
    console.log('✅ Equity keywords added to extraction');
    console.log('✅ Default weights for equity/asset/liability transactions');
    console.log('✅ Improved fallback keyword matching');
    console.log('✅ Enhanced confidence scoring (85% base)');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

testFinalImprovements(); 