import { AccountType } from '../types/account';
import { ACCOUNT_TYPES, ACCOUNT_SUBTYPES } from './accountUtils';

interface AccountMatch {
  type: AccountType;
  score: number;
  keywords: string[];
}

interface AccountSuggestion {
  name: string;
  score: number;
  explanation: string;
}

const ACCOUNT_KEYWORDS: Record<AccountType, { keywords: string[]; weight: number }> = {
  asset: {
    keywords: [
      'cash', 'bank', 'checking', 'savings', 'petty', 'receivable', 'inventory',
      'equipment', 'property', 'building', 'vehicle', 'furniture', 'land',
      'investment', 'prepaid', 'security', 'deposit', 'fund'
    ],
    weight: 1.0
  },
  liability: {
    keywords: [
      'payable', 'loan', 'debt', 'credit', 'card', 'mortgage', 'tax',
      'wages', 'salary', 'interest', 'accrued', 'unearned', 'obligation',
      'liability', 'note', 'bond'
    ],
    weight: 1.0
  },
  equity: {
    keywords: [
      'capital', 'equity', 'stock', 'share', 'retained', 'earnings',
      'dividend', 'drawing', 'owner', 'partner', 'member', 'investment'
    ],
    weight: 1.0
  },
  income: {
    keywords: [
      'revenue', 'sales', 'income', 'fee', 'service', 'interest',
      'rental', 'commission', 'royalty', 'gain', 'profit', 'proceeds'
    ],
    weight: 1.0
  },
  expense: {
    keywords: [
      'expense', 'cost', 'rent', 'utilities', 'salary', 'wage',
      'insurance', 'supplies', 'maintenance', 'repair', 'advertising',
      'depreciation', 'interest', 'fee', 'stripe', 'paypal', 'processing',
      'loss', 'charge', 'payment'
    ],
    weight: 1.0
  }
};

const COMMON_PATTERNS: Record<AccountType, string[]> = {
  asset: [
    '{bank} Account',
    '{company} {type}',
    '{type} Account',
    '{company} Account'
  ],
  liability: [
    '{type} Payable',
    '{company} {type}',
    '{type} to {company}',
    '{type} Account'
  ],
  equity: [
    '{owner} Capital',
    '{owner} Investment',
    '{owner} Equity',
    'Retained Earnings',
    '{owner} Drawing'
  ],
  income: [
    '{type} Revenue',
    '{type} Income',
    '{type} Sales',
    '{type} Fees',
    '{company} {type}'
  ],
  expense: [
    '{type} Expense',
    '{type} Cost',
    '{type} Charge',
    '{company} {type}',
    '{type} Payment'
  ]
};

// Common prefixes and suffixes to avoid duplication
const COMMON_PREFIXES = ['the', 'our', 'my', 'your', 'their'];
const COMMON_SUFFIXES = ['account', 'fund', 'balance', 'money', 'cash'];

export const analyzeAccountName = (name: string): AccountMatch | null => {
  const lowerName = name.toLowerCase();
  const matches: AccountMatch[] = [];

  // Calculate scores for each account type
  Object.entries(ACCOUNT_KEYWORDS).forEach(([type, { keywords, weight }]) => {
    const matchingKeywords = keywords.filter(keyword => lowerName.includes(keyword));
    if (matchingKeywords.length > 0) {
      const score = (matchingKeywords.length / keywords.length) * weight;
      matches.push({
        type: type as AccountType,
        score,
        keywords: matchingKeywords
      });
    }
  });

  // Sort by score and return the best match
  matches.sort((a, b) => b.score - a.score);
  return matches.length > 0 ? matches[0] : null;
};

export const getAccountNameSuggestions = (type: AccountType, name: string): AccountSuggestion[] => {
  const suggestions: AccountSuggestion[] = [];
  const lowerName = name.toLowerCase();
  
  // Extract potential company/type names from input
  const words = name.split(' ')
    .filter(word => word.length > 2)
    .map(word => word.toLowerCase())
    .filter(word => !COMMON_PREFIXES.includes(word) && !COMMON_SUFFIXES.includes(word));

  const companyName = words.find(word => 
    !Object.values(ACCOUNT_KEYWORDS).some(({ keywords }) => 
      keywords.includes(word)
    )
  ) || '';

  // Generate suggestions based on patterns
  COMMON_PATTERNS[type].forEach(pattern => {
    let suggestion = pattern
      .replace('{type}', words[0] || '')
      .replace('{company}', companyName)
      .replace('{owner}', companyName || 'Owner')
      .replace('{bank}', words.find(w => 
        ['bank', 'credit', 'savings', 'checking'].includes(w)
      ) || 'Bank');

    // Clean up the suggestion
    suggestion = suggestion
      .split(' ')
      .filter((word, index, array) => {
        // Remove duplicate words
        if (index > 0 && word.toLowerCase() === array[index - 1].toLowerCase()) {
          return false;
        }
        // Remove redundant prefixes/suffixes
        if (index === 0 && COMMON_PREFIXES.includes(word.toLowerCase())) {
          return false;
        }
        if (index === array.length - 1 && COMMON_SUFFIXES.includes(word.toLowerCase())) {
          return false;
        }
        return true;
      })
      .join(' ');

    if (suggestion && suggestion !== name) {
      const score = calculateSuggestionScore(suggestion, lowerName);
      if (score > 0) {
        suggestions.push({
          name: suggestion,
          score,
          explanation: `Based on common ${type} account naming patterns`
        });
      }
    }
  });

  // Sort by score and return top suggestions
  return suggestions.sort((a, b) => b.score - a.score);
};

// Helper function to calculate suggestion score
const calculateSuggestionScore = (suggestion: string, originalName: string): number => {
  const suggestionWords = suggestion.toLowerCase().split(' ');
  const originalWords = originalName.toLowerCase().split(' ');
  
  // Calculate word overlap
  const matchingWords = suggestionWords.filter(word => 
    originalWords.includes(word) && 
    !COMMON_PREFIXES.includes(word) && 
    !COMMON_SUFFIXES.includes(word)
  );
  
  // Calculate score based on matching words and length
  const wordScore = matchingWords.length / Math.max(suggestionWords.length, originalWords.length);
  const lengthScore = 1 - Math.abs(suggestionWords.length - originalWords.length) / Math.max(suggestionWords.length, originalWords.length);
  
  return (wordScore + lengthScore) / 2;
}; 