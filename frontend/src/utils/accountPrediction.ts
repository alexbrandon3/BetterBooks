import { AccountType } from '../types/account';
import { ACCOUNT_TYPES, ACCOUNT_SUBTYPES } from './accountUtils';

interface Prediction {
  type: AccountType;
  subType: string;
  confidence: number;
  rationale: string;
}

interface PredictionResult {
  primary: Prediction;
  alternatives: Prediction[];
  message: string;
}

const KEYWORDS: Record<AccountType, { keywords: string[]; weight: number }> = {
  asset: {
    keywords: ['cash', 'bank', 'receivable', 'inventory', 'equipment', 'property', 'building', 'vehicle', 'furniture', 'land', 'investment', 'prepaid'],
    weight: 1.0
  },
  liability: {
    keywords: ['payable', 'loan', 'debt', 'credit', 'mortgage', 'tax', 'wages', 'salary', 'interest', 'accrued', 'unearned'],
    weight: 1.0
  },
  equity: {
    keywords: ['capital', 'equity', 'stock', 'share', 'retained', 'earnings', 'dividend', 'drawing'],
    weight: 1.0
  },
  income: {
    keywords: ['revenue', 'sales', 'income', 'fee', 'service', 'interest', 'rental', 'commission', 'royalty'],
    weight: 1.0
  },
  expense: {
    keywords: ['expense', 'cost', 'rent', 'utilities', 'salary', 'wage', 'insurance', 'supplies', 'maintenance', 'repair', 'advertising', 'depreciation', 'interest', 'fee', 'stripe', 'paypal', 'processing'],
    weight: 1.0
  }
};

const SUBTYPE_KEYWORDS: Record<string, { keywords: string[]; weight: number }> = {
  'bank_fees': {
    keywords: ['fee', 'stripe', 'paypal', 'processing', 'merchant', 'bank', 'transaction'],
    weight: 1.0
  },
  'payment_processing': {
    keywords: ['stripe', 'paypal', 'square', 'processing', 'merchant', 'payment'],
    weight: 1.0
  },
  'supplies': {
    keywords: ['supply', 'material', 'office', 'stationery', 'consumable'],
    weight: 1.0
  },
  'rent': {
    keywords: ['rent', 'lease', 'premises', 'space', 'property'],
    weight: 1.0
  },
  'utilities': {
    keywords: ['utility', 'electric', 'water', 'gas', 'internet', 'phone'],
    weight: 1.0
  }
};

export const predictAccountType = (name: string, description?: string): PredictionResult => {
  const text = `${name} ${description || ''}`.toLowerCase();
  const predictions: Prediction[] = [];

  // Calculate scores for each account type
  Object.entries(KEYWORDS).forEach(([type, { keywords, weight }]) => {
    const matches = keywords.filter(keyword => text.includes(keyword));
    const score = (matches.length / keywords.length) * weight;
    
    if (score > 0) {
      predictions.push({
        type: type as AccountType,
        subType: predictSubtype(type as AccountType, text),
        confidence: score,
        rationale: `Found ${matches.length} matching keywords: ${matches.join(', ')}`
      });
    }
  });

  // Sort predictions by confidence
  predictions.sort((a, b) => b.confidence - a.confidence);

  // If no predictions found, return default prediction
  if (predictions.length === 0) {
    const defaultPrediction: Prediction = {
      type: 'asset',
      subType: 'general',
      confidence: 0.3,
      rationale: 'No matching keywords found'
    };

    return {
      primary: defaultPrediction,
      alternatives: [],
      message: 'Unable to determine account type. Please select manually.'
    };
  }

  // Get primary prediction and alternatives
  const primary = predictions[0];
  const alternatives = predictions.slice(1, 3);

  // Generate explanation message
  const message = generateExplanation(primary, alternatives);

  return {
    primary,
    alternatives,
    message
  };
};

const predictSubtype = (type: AccountType, text: string): string => {
  const possibleSubtypes = ACCOUNT_SUBTYPES[type];
  let bestSubtype = possibleSubtypes[0];
  let bestScore = 0;

  possibleSubtypes.forEach(subtype => {
    const keywords = SUBTYPE_KEYWORDS[subtype]?.keywords || [];
    const matches = keywords.filter(keyword => text.includes(keyword));
    const score = matches.length / keywords.length;

    if (score > bestScore) {
      bestScore = score;
      bestSubtype = subtype;
    }
  });

  return bestSubtype;
};

const generateExplanation = (primary: Prediction, alternatives: Prediction[]): string => {
  if (!primary) {
    return 'Unable to determine account type. Please select manually.';
  }

  if (primary.confidence > 0.8) {
    return `Based on the account name and description, this is most likely a ${ACCOUNT_TYPES[primary.type].label} account.`;
  } else if (primary.confidence > 0.6) {
    return `This appears to be a ${ACCOUNT_TYPES[primary.type].label} account, but please verify the classification.`;
  } else {
    return `We're not completely sure about the classification. Please review the suggestions and choose the most appropriate type.`;
  }
};

export const validateAccountNumber = (number: string): boolean => {
  return /^\d{4,}$/.test(number);
};

export const getAccountNumberPrefix = (type: AccountType): string => {
  const prefixes: Record<AccountType, string> = {
    asset: '1',
    liability: '2',
    equity: '3',
    income: '4',
    expense: '5'
  };
  return prefixes[type];
}; 