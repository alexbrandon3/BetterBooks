import { SuggestedGoal } from '../../types/suggestion';
import { Transaction } from '../../entities/Transaction';
import { User, RiskTolerance } from '../../entities/User';

export const generateEquipmentFundSuggestion = (
  transactions: Transaction[],
  user: User
): SuggestedGoal | null => {
  // Look for equipment-related transactions in the last year
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  // Look for various categories that might indicate equipment or business expenses
  const equipmentCategories = ['EQUIPMENT', 'OFFICE', 'TECHNOLOGY', 'TOOLS', 'MACHINERY'];
  const equipmentTransactions = transactions.filter(t => 
    equipmentCategories.some(cat => t.category.toUpperCase().includes(cat)) && 
    new Date(t.date) >= oneYearAgo &&
    t.type === 'EXPENSE'
  );

  // If no specific equipment transactions, look for general business expenses
  if (equipmentTransactions.length === 0) {
    const businessExpenses = transactions.filter(t => 
      t.type === 'EXPENSE' && 
      new Date(t.date) >= oneYearAgo &&
      ['RENT', 'UTILITIES', 'SUPPLIES'].some(cat => t.category.toUpperCase().includes(cat))
    );
    
    if (businessExpenses.length === 0) {
      return null;
    }
    
    // Calculate average business expense
    const totalExpense = businessExpenses.reduce((sum, t) => sum + t.amount, 0);
    const averageExpense = totalExpense / businessExpenses.length;
    
    // Suggest a business expense fund
    const targetAmount = Math.round(averageExpense * 3); // 3 months of expenses
    
    // Adjust target based on risk tolerance
    let adjustedTarget = targetAmount;
    if (user.riskTolerance === RiskTolerance.CONSERVATIVE) {
      adjustedTarget *= 1.2;
    } else if (user.riskTolerance === RiskTolerance.AGGRESSIVE) {
      adjustedTarget *= 0.8;
    }

    return {
      id: 'business-expense-fund',
      title: 'Business Expense Fund',
      targetAmount: adjustedTarget,
      reason: `Save for business expenses (based on your average monthly expense of ${averageExpense.toLocaleString()})${
        user.riskTolerance ? ` adjusted for your ${user.riskTolerance} risk tolerance` : ''
      }`,
      action: 'goals'
    };
  }

  // Calculate average equipment expense
  const totalEquipmentExpense = equipmentTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );
  const averageExpense = totalEquipmentExpense / equipmentTransactions.length;

  // Add inflation adjustment (3% annually)
  const inflationRate = 1.03;
  const targetAmount = Math.round(averageExpense * inflationRate);

  // Adjust target based on risk tolerance
  let adjustedTarget = targetAmount;
  if (user.riskTolerance === RiskTolerance.CONSERVATIVE) {
    adjustedTarget *= 1.2; // More conservative = larger equipment fund
  } else if (user.riskTolerance === RiskTolerance.AGGRESSIVE) {
    adjustedTarget *= 0.8; // More aggressive = smaller equipment fund
  }

  return {
    id: 'equipment-fund',
    title: 'Equipment Replacement Fund',
    targetAmount: adjustedTarget,
    reason: `Save for your next equipment purchase (based on your average expense of ${averageExpense.toLocaleString()})${
      user.riskTolerance ? ` adjusted for your ${user.riskTolerance} risk tolerance` : ''
    }`,
    action: 'goals'
  };
}; 