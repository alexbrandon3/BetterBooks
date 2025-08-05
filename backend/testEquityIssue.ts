import { AppDataSource } from './src/config/data-source';
import { SuggestionService } from './src/services/suggestion.service';
import { AccountWeightService } from './src/services/AccountWeightService';

async function testEquityIssue() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const suggestionService = new SuggestionService();
    const accountWeightService = new AccountWeightService();
    const testUserId = 1;

    const equityPhrases = [
      'initial contribution',
      'owner contribution', 
      'capital contribution',
      'equity investment'
    ];

    console.log('\n🔍 DEBUGGING EQUITY SUGGESTIONS:');
    console.log('=' .repeat(80));

    // First, check what accounts are available
    console.log('\n1️⃣ CHECKING AVAILABLE ACCOUNTS:');
    const accounts = await AppDataSource.getRepository('Account').find({
      where: { user: { id: testUserId } },
      order: { name: 'ASC' }
    });
    
    console.log('Available accounts:');
    accounts.forEach(acc => {
      console.log(`   - ${acc.name} (${acc.type})`);
    });

    // Check if default weights exist
    console.log('\n2️⃣ CHECKING DEFAULT WEIGHTS:');
    const weights = await accountWeightService.getUserWeights(testUserId);
    console.log(`Total weights: ${weights.length}`);
    
    const equityWeights = weights.filter(w => 
      w.keyword.includes('contribution') || 
      w.keyword.includes('investment') || 
      w.keyword.includes('equity')
    );
    
    console.log('Equity-related weights:');
    equityWeights.forEach(w => {
      console.log(`   - ${w.keyword} → Account ID: ${w.accountId} (${w.weight}%)`);
    });

    // Test each equity phrase
    for (const phrase of equityPhrases) {
      console.log(`\n3️⃣ TESTING: "${phrase}"`);
      console.log('-'.repeat(50));

      // Test keyword extraction
      const normalizedDescription = phrase.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`   Normalized: "${normalizedDescription}"`);
      
      // Check for multi-word phrases
      const multiWordPhrases = [
        'initial contribution', 'owner contribution', 'capital contribution', 'business formation',
        'personal funds', 'partner investment', 'equity investment', 'owner draw', 'partner draw'
      ];

      let extractedKeywords: string[] = [];
      
      for (const phrase of multiWordPhrases) {
        if (normalizedDescription.includes(phrase)) {
          extractedKeywords = [phrase.replace(/\s+/g, '_')];
          console.log(`   ✅ Multi-word phrase detected: "${phrase}" → "${extractedKeywords[0]}"`);
          break;
        }
      }

      if (extractedKeywords.length === 0) {
        console.log(`   ❌ No multi-word phrase detected`);
      }

      // Test full suggestion
      const suggestion = await suggestionService.suggestAccountForDescription(phrase, testUserId);
      
      if (suggestion) {
        console.log(`   ✅ SUGGESTION: ${suggestion.suggestedAccountName}`);
        console.log(`   Confidence: ${suggestion.confidence}%`);
        console.log(`   Account Type: ${suggestion.accountType}`);
        console.log(`   Learning Source: ${suggestion.learningSource || 'UNKNOWN'}`);
        console.log(`   Reason: ${suggestion.reason}`);
        
        // Check if it's correct
        if (suggestion.accountType === 'EQUITY') {
          console.log(`   ✅ CORRECT: Equity account suggested`);
        } else {
          console.log(`   ❌ WRONG: Expected EQUITY, got ${suggestion.accountType}`);
        }
      } else {
        console.log(`   ❌ NO SUGGESTION FOUND`);
      }
    }

    console.log('\n📊 DIAGNOSIS:');
    console.log('If equity phrases are still suggesting cash/sales revenue:');
    console.log('1. Default weights may not be initialized');
    console.log('2. Account matching may not find equity accounts');
    console.log('3. Fallback logic may be overriding equity suggestions');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

testEquityIssue(); 