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
    '{type} {bank}',
    '{type} {company}',
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
  const words = name.split(' ').filter(word => word.length > 2);
  const companyName = words.find(word => 
    !Object.values(ACCOUNT_KEYWORDS).some(({ keywords }) => 
      keywords.includes(word.toLowerCase())
    )
  ) || '';

  // Generate suggestions based on patterns
  COMMON_PATTERNS[type].forEach(pattern => {
    const suggestion = pattern
      .replace('{type}', words[0] || '')
      .replace('{company}', companyName)
      .replace('{owner}', companyName || 'Owner')
      .replace('{bank}', words.find(w => 
        ['bank', 'credit', 'savings', 'checking'].includes(w.toLowerCase())
      ) || 'Bank');

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

const calculateSuggestionScore = (suggestion: string, originalName: string): number => {
  const suggestionWords = suggestion.toLowerCase().split(' ');
  const originalWords = originalName.split(' ');
  
  // Calculate word overlap
  const matchingWords = suggestionWords.filter(word => 
    originalWords.includes(word)
  ).length;
  
  // Calculate length similarity
  const lengthDiff = Math.abs(suggestion.length - originalName.length);
  const lengthScore = 1 - (lengthDiff / Math.max(suggestion.length, originalName.length));
  
  return (matchingWords / suggestionWords.length) * 0.7 + lengthScore * 0.3;
}; 