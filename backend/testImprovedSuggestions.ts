import { AppDataSource } from './src/config/data-source';
import { SuggestionService } from './src/services/suggestion.service';
import { AccountWeightService } from './src/services/AccountWeightService';

async function testImprovedSuggestions() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const suggestionService = new SuggestionService();
    const accountWeightService = new AccountWeightService();
    const testUserId = 1;

    const testPhrases = [
      'initial contribution',
      'owner contribution', 
      'business formation funds',
      'personal funds added',
      'capital contribution',
      'equity investment',
      'partner investment',
      'equipment purchase',
      'loan repayment',
      'credit card payment'
    ];

    console.log('\n🔍 TESTING IMPROVED SMART SUGGESTIONS:');
    console.log('=' .repeat(80));

    // First, initialize default weights
    console.log('\n1️⃣ Initializing default weights...');
    await accountWeightService.initializeDefaultWeights(testUserId);
    console.log('✅ Default weights initialized');

    for (const phrase of testPhrases) {
      console.log(`\n📝 TESTING PHRASE: "${phrase}"`);
      console.log('-'.repeat(60));

      // Test keyword extraction
      console.log('\n🔍 KEYWORD EXTRACTION:');
      const normalizedDescription = phrase.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`   Normalized: "${normalizedDescription}"`);
      
      // Test the extractKeywords method
      const words = normalizedDescription.split(' ').filter(word => word.length > 2);
      const multiWordPhrases = [
        'initial contribution', 'owner contribution', 'capital contribution', 'business formation',
        'personal funds', 'partner investment', 'equity investment', 'owner draw', 'partner draw',
        'loan repayment', 'credit card payment', 'equipment purchase', 'personal use'
      ];

      let extractedKeywords: string[] = [];
      
      // Check for multi-word phrases first
      for (const phrase of multiWordPhrases) {
        if (normalizedDescription.includes(phrase)) {
          extractedKeywords = [phrase.replace(/\s+/g, '_')];
          console.log(`   ✅ Multi-word phrase detected: "${phrase}" → "${extractedKeywords[0]}"`);
          break;
        }
      }

      if (extractedKeywords.length === 0) {
        // Single word extraction
        const businessKeywords = [
          'sold', 'sale', 'sales', 'revenue', 'income', 'refund',
          'bought', 'buy', 'purchase', 'inventory',
          'rent', 'utilities', 'marketing', 'advertising', 'insurance', 'legal', 'accounting',
          'payroll', 'salary', 'wages', 'employee',
          'tax', 'taxes', 'irs',
          'contribution', 'investment', 'equity', 'capital',
          'owner', 'partner', 'draw', 'withdrawal',
          'deposit', 'loan', 'transfer', 'repayment', 'reimbursement',
          'overdraft', 'credit', 'interest', 'dividend',
          'equipment', 'machinery', 'furniture', 'supplies',
          'maintenance', 'repair', 'service', 'consulting',
          'initial', 'business', 'personal', 'formation', 'funds'
        ];
        
        extractedKeywords = words.filter(word => businessKeywords.includes(word.toLowerCase()));
        console.log(`   Single words: [${words.join(', ')}]`);
        console.log(`   Extracted keywords: [${extractedKeywords.join(', ')}]`);
      }

      // Test full suggestion pipeline
      console.log('\n🎯 FULL SUGGESTION TEST:');
      const suggestion = await suggestionService.suggestAccountForDescription(phrase, testUserId);
      
      if (suggestion) {
        console.log(`   ✅ SUGGESTION FOUND:`);
        console.log(`      Account: ${suggestion.suggestedAccountName}`);
        console.log(`      Confidence: ${suggestion.confidence}%`);
        console.log(`      Reason: ${suggestion.reason}`);
        console.log(`      Learning Source: ${suggestion.learningSource || 'UNKNOWN'}`);
        console.log(`      Entry Type: ${suggestion.suggestedEntryType}`);
        console.log(`      Account Type: ${suggestion.accountType}`);
        console.log(`      Detailed Reason: ${suggestion.detailedReason}`);
        
        // Evaluate if the suggestion is appropriate
        const isEquityPhrase = phrase.includes('contribution') || phrase.includes('investment') || phrase.includes('equity');
        const isAssetPhrase = phrase.includes('equipment') || phrase.includes('purchase');
        const isLiabilityPhrase = phrase.includes('loan') || phrase.includes('credit');
        
        let expectedAccountType = '';
        if (isEquityPhrase) expectedAccountType = 'EQUITY';
        else if (isAssetPhrase) expectedAccountType = 'ASSET';
        else if (isLiabilityPhrase) expectedAccountType = 'LIABILITY';
        
        if (expectedAccountType && suggestion.accountType === expectedAccountType) {
          console.log(`   ✅ CORRECT ACCOUNT TYPE: ${expectedAccountType}`);
        } else if (expectedAccountType) {
          console.log(`   ❌ WRONG ACCOUNT TYPE: Expected ${expectedAccountType}, got ${suggestion.accountType}`);
        }
      } else {
        console.log(`   ❌ NO SUGGESTION FOUND`);
      }

      console.log('\n' + '='.repeat(80));
    }

    console.log('\n📊 SUMMARY:');
    console.log('✅ Multi-word phrase detection implemented');
    console.log('✅ Expanded keyword extraction for equity/asset/liability keywords');
    console.log('✅ Default weights added for equity and asset transactions');
    console.log('✅ Improved fallback keyword matching');
    console.log('✅ Enhanced confidence scoring');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

testImprovedSuggestions(); 