import { Request, Response } from 'express';

// Mock financial data - in production, this would come from the database
const MOCK_FINANCIAL_DATA = {
  averageMonthlyIncome: 3500,
  totalCashBalance: 800,
  hasRecurringEquipmentExpense: true,
  lastEquipmentPurchase: 1800
};

interface SuggestedGoal {
  id: string;
  title: string;
  targetAmount: number;
  reason: string;
  action: 'goals';
}

const generateSuggestions = (financialData: typeof MOCK_FINANCIAL_DATA): SuggestedGoal[] => {
  const suggestions: SuggestedGoal[] = [];

  // High income suggestion
  if (financialData.averageMonthlyIncome > 3000) {
    suggestions.push({
      id: 'monthly-income',
      title: 'Save 1 Month of Income',
      targetAmount: financialData.averageMonthlyIncome,
      reason: `Save one month's income (${financialData.averageMonthlyIncome.toLocaleString()}) as a financial buffer`,
      action: 'goals'
    });
  }

  // Emergency fund suggestion
  if (financialData.totalCashBalance < 1000) {
    suggestions.push({
      id: 'emergency-fund',
      title: 'Emergency Fund',
      targetAmount: 1000,
      reason: 'Build a basic emergency fund to cover unexpected expenses',
      action: 'goals'
    });
  }

  // Equipment purchase suggestion
  if (financialData.hasRecurringEquipmentExpense) {
    const targetAmount = Math.max(2000, financialData.lastEquipmentPurchase * 1.2);
    suggestions.push({
      id: 'equipment-fund',
      title: 'Equipment Replacement Fund',
      targetAmount,
      reason: `Save for your next equipment purchase (based on your last purchase of ${financialData.lastEquipmentPurchase.toLocaleString()})`,
      action: 'goals'
    });
  }

  // If no suggestions were generated, add a default one
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'start-saving',
      title: 'Start Saving',
      targetAmount: 500,
      reason: 'Begin building your savings with a small, achievable goal',
      action: 'goals'
    });
  }

  return suggestions;
};

export const getSmartGoalSuggestions = async (req: Request, res: Response): Promise<void> => {
  console.log('🎯 Suggestions endpoint hit:', {
    path: req.path,
    method: req.method,
    query: req.query,
    headers: req.headers,
    url: req.url,
    originalUrl: req.originalUrl
  });

  // Ensure we always send JSON responses
  res.setHeader('Content-Type', 'application/json');

  try {
    const suggestions = generateSuggestions(MOCK_FINANCIAL_DATA);
    console.log('📊 Generated suggestions:', suggestions);

    res.status(200).json(suggestions);
  } catch (error) {
    console.error('❌ Error in getSmartGoalSuggestions:', error);
    res.status(500).json({ 
      error: 'Failed to get goal suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 