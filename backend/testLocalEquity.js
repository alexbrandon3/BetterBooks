// Test the equity keyword logic locally
console.log('🧪 Testing Equity Keyword Logic Locally...\n');

// Simulate the keyword matching logic
const keywordMap = [
  // PRIORITY 0: Equity and Capital Transactions (highest priority)
  {
    keywords: [
      // Multi-word equity phrases (exact matches)
      'initial contribution', 'owner contribution', 'capital contribution', 'business formation',
      'personal funds', 'equity investment', 'partner investment', 'owner draw', 'partner draw',
      'loan repayment', 'credit card payment', 'equipment purchase', 'personal use',
      // Single word equity keywords
      'initial', 'contribution', 'draw', 'drawing', 'withdrawal', 'owner', 'partner', 'distribution', 'dividend', 
      'capital contribution', 'investment', 'member distribution', 'contribution', 'equity', 'capital',
      'personal funds', 'partner funds', 'owner funds', 'business formation', 'startup capital'
    ],
    accountTypes: ['EQUITY'],
    categories: ['Owner Equity', 'Capital', 'Contributed Capital', 'Drawings', 'Partner Capital'],
    reason: 'Equity-related contribution or distribution',
    priority: 0  // Highest priority to override equipment/asset matches
  },
  // PRIORITY 1: Equipment/Asset (lower priority)
  {
    keywords: ['equipment', 'machinery', 'computer', 'furniture', 'office equipment', 'tools'],
    accountTypes: ['EXPENSE', 'ASSET'],
    categories: ['Equipment', 'Fixed Assets', 'Equipment Purchase', 'Office Equipment'],
    reason: 'Business equipment transaction',
    priority: 1
  }
];

function normalizeMultiWordPhrases(description) {
  const multiWordPhrases = [
    'initial contribution',
    'owner contribution', 
    'capital contribution',
    'business formation',
    'personal funds',
    'equity investment',
    'partner investment',
    'owner draw',
    'partner draw',
    'loan repayment',
    'credit card payment',
    'equipment purchase',
    'personal use'
  ];
  
  let normalized = description.toLowerCase().trim();
  
  // Replace multi-word phrases with underscore format
  for (const phrase of multiWordPhrases) {
    const underscorePhrase = phrase.replace(/\s+/g, '_');
    normalized = normalized.replace(new RegExp(phrase, 'gi'), underscorePhrase);
  }
  
  return normalized;
}

function testKeywordMatching(description) {
  console.log(`🔍 Testing: "${description}"`);
  
  const normalizedDescription = normalizeMultiWordPhrases(description);
  console.log(`  📝 Normalized: "${normalizedDescription}"`);
  
  let matchedCategory = null;
  let matchedKeyword = null;
  let bestPriority = 999;
  
  for (const mapping of keywordMap) {
    const foundKeyword = mapping.keywords.find(keyword => {
      const normalizedKeyword = normalizeMultiWordPhrases(keyword);
      
      // Check for exact match first
      const exactMatch = normalizedDescription.toLowerCase().includes(normalizedKeyword.toLowerCase());
      
      // Check for partial match
      const partialMatch = normalizedKeyword.toLowerCase().startsWith(normalizedDescription.toLowerCase()) || 
                          normalizedDescription.toLowerCase().startsWith(normalizedKeyword.toLowerCase());
      
      // For equity keywords, be more strict about matching
      const isEquityKeyword = mapping.accountTypes.includes('EQUITY');
      const hasKeyword = isEquityKeyword ? exactMatch : (exactMatch || partialMatch);
      
      console.log(`    🔍 Keyword: "${keyword}" (normalized: "${normalizedKeyword}")`);
      console.log(`       Exact: ${exactMatch}, Partial: ${partialMatch}, Found: ${hasKeyword}, Equity: ${isEquityKeyword}`);
      
      return hasKeyword;
    });
    
    if (foundKeyword) {
      if (mapping.priority < bestPriority) {
        matchedCategory = mapping;
        matchedKeyword = foundKeyword;
        bestPriority = mapping.priority;
        console.log(`    ✅ Found match: "${foundKeyword}" → ${mapping.categories[0]} (Priority: ${mapping.priority})`);
      }
    }
  }
  
  if (matchedCategory) {
    console.log(`  🎯 Final Result: ${matchedCategory.categories[0]} (${matchedCategory.accountTypes.join(', ')})`);
    console.log(`  📊 Priority: ${matchedCategory.priority}`);
    console.log(`  💡 Reason: ${matchedCategory.reason}`);
    
    const isEquity = matchedCategory.accountTypes.includes('EQUITY');
    console.log(`  ${isEquity ? '✅' : '❌'} Equity Match: ${isEquity ? 'YES' : 'NO'}`);
  } else {
    console.log(`  ❌ No match found`);
  }
  
  console.log('');
}

// Test cases
const testCases = [
  'initial',
  'initial contribution',
  'owner contribution', 
  'capital contribution',
  'business formation',
  'equipment',
  'equipment purchase'
];

testCases.forEach(testKeywordMatching);

console.log('🏁 Local equity testing complete!'); 