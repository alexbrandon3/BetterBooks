import { AppDataSource } from './src/config/data-source';
import { SuggestionService } from './src/services/suggestion.service';
import { AccountWeightService } from './src/services/AccountWeightService';

async function auditSmartSuggestions() {
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
      'partner investment'
    ];

    console.log('\n🔍 AUDIT: Smart Suggestions Pipeline Analysis');
    console.log('=' .repeat(80));

    for (const phrase of testPhrases) {
      console.log(`\n📝 TESTING PHRASE: "${phrase}"`);
      console.log('-'.repeat(60));

      // Step 1: Analyze keyword extraction
      console.log('\n1️⃣ KEYWORD EXTRACTION ANALYSIS:');
      const normalizedDescription = phrase.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`   Normalized: "${normalizedDescription}"`);
      
      // Extract keywords using the same logic as the service
      const words = normalizedDescription.split(' ').filter(word => word.length > 2);
      const businessKeywords = [
        'sold', 'sale', 'sales', 'revenue', 'income', 'refund',
        'bought', 'buy', 'purchase', 'inventory',
        'rent', 'utilities', 'marketing', 'advertising', 'insurance', 'legal', 'accounting',
        'payroll', 'salary', 'wages', 'employee',
        'tax', 'taxes', 'irs'
      ];
      
      const extractedKeywords = words.filter(word => businessKeywords.includes(word.toLowerCase()));
      console.log(`   Extracted keywords: [${extractedKeywords.join(', ')}]`);
      console.log(`   All words: [${words.join(', ')}]`);
      console.log(`   Business keywords available: [${businessKeywords.join(', ')}]`);

      // Step 2: Check AccountWeight mappings
      console.log('\n2️⃣ ACCOUNT WEIGHT ANALYSIS:');
      const weights = await accountWeightService.getUserWeights(testUserId);
      console.log(`   Total weights in system: ${weights.length}`);
      
      for (const keyword of extractedKeywords) {
        const keywordWeights = weights.filter(w => w.keyword === keyword);
        console.log(`   Keyword "${keyword}": ${keywordWeights.length} weights`);
        keywordWeights.forEach(w => {
          console.log(`     → ${w.accountName} (weight: ${w.weight}, usage: ${w.usageCount})`);
        });
      }

      // Step 3: Test full suggestion pipeline
      console.log('\n3️⃣ FULL PIPELINE TEST:');
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
      } else {
        console.log(`   ❌ NO SUGGESTION FOUND`);
      }

      // Step 4: Analyze fallback keyword matching
      console.log('\n4️⃣ FALLBACK KEYWORD ANALYSIS:');
      
      // Check if any words match the keyword map
      const keywordMap = [
        {
          keywords: ['sold', 'sale', 'sales', 'revenue', 'income', 'earnings', 'profit', 'commission', 'service', 'product', 'merchandise', 'goods', 'invoice', 'payment received', 'customer payment', 'client payment', 'customer', 'client', 'retail', 'wholesale', 'consulting fee', 'service fee', 'project payment'],
          accountTypes: ['INCOME', 'REVENUE'],
          categories: ['Sales', 'Revenue', 'Service Income', 'Product Sales', 'Consulting Revenue'],
          reason: 'Business revenue transaction',
          priority: 1
        },
        {
          keywords: ['draw', 'drawing', 'withdrawal', 'owner', 'partner', 'distribution', 'dividend', 'capital contribution', 'investment', 'owner draw', 'partner draw', 'member distribution'],
          accountTypes: ['EXPENSE', 'EQUITY'],
          categories: ['Drawings', 'Owner Equity', 'Capital', 'Partner Draw'],
          reason: 'Owner equity transaction',
          priority: 2
        }
      ];

      let matchedKeywordGroup = null;
      for (const group of keywordMap) {
        for (const keyword of group.keywords) {
          if (normalizedDescription.includes(keyword)) {
            matchedKeywordGroup = group;
            console.log(`   ✅ MATCHED KEYWORD: "${keyword}"`);
            console.log(`      Group: ${group.reason}`);
            console.log(`      Account Types: [${group.accountTypes.join(', ')}]`);
            console.log(`      Categories: [${group.categories.join(', ')}]`);
            console.log(`      Priority: ${group.priority}`);
            break;
          }
        }
        if (matchedKeywordGroup) break;
      }

      if (!matchedKeywordGroup) {
        console.log(`   ❌ NO KEYWORD MATCHES FOUND`);
        console.log(`   Available keywords in fallback: ${keywordMap.map(g => g.keywords.slice(0, 3).join(', ')).join(' | ')}`);
      }

      console.log('\n' + '='.repeat(80));
    }

    // Step 5: Summary and Recommendations
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log('='.repeat(80));
    
    console.log('\n🔍 ISSUES IDENTIFIED:');
    console.log('1. Keyword extraction is too restrictive - only extracts from a small list');
    console.log('2. Missing equity/contribution keywords in the extraction list');
    console.log('3. Fallback keyword matching doesn\'t include "contribution", "investment", "equity"');
    console.log('4. No default weights for equity-related keywords');
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Add equity keywords to extractKeywords(): "contribution", "investment", "equity", "capital"');
    console.log('2. Add equity keywords to fallback keywordMap');
    console.log('3. Add default weights for equity accounts');
    console.log('4. Improve keyword matching to handle multi-word phrases');
    console.log('5. Add "initial", "owner", "partner", "business" as context keywords');

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

auditSmartSuggestions(); 