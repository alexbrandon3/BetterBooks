import { SuggestedGoal } from '../../types/suggestion';
import { Transaction } from '../../entities/Transaction';
import { User, RiskTolerance } from '../../entities/User';

export const generateEquipmentFundSuggestion = (
  transactions: Transaction[],
  user: User
): SuggestedGoal | null => {
  // Look for equipment-related transactions in the last 6 months for consistency
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  // Look for various categories that might indicate equipment or business expenses
  const equipmentCategories = ['EQUIPMENT', 'OFFICE', 'TECHNOLOGY', 'TOOLS', 'MACHINERY'];
  const equipmentTransactions = transactions.filter(t => 
    equipmentCategories.some(cat => t.category.toUpperCase().includes(cat)) && 
    new Date(t.date) >= sixMonthsAgo &&
    t.type === 'EXPENSE'
  );

  // If no specific equipment transactions, look for general business expenses
  if (equipmentTransactions.length === 0) {
    const businessExpenses = transactions.filter(t => 
      t.type === 'EXPENSE' && 
      new Date(t.date) >= sixMonthsAgo &&
      ['RENT', 'UTILITIES', 'SUPPLIES'].some(cat => t.category.toUpperCase().includes(cat))
    );
    
    if (businessExpenses.length === 0) {
      // Fallback: Suggest a General Expense Reserve Fund for non-equipment users
      const allExpenses = transactions.filter(t => 
        t.type === 'EXPENSE' && 
        new Date(t.date) >= sixMonthsAgo
      );
      
      if (allExpenses.length === 0) {
        // No expense data available, suggest a default reserve fund
        const defaultTarget = 5000; // Default $5,000 business reserve fund
        
        // Adjust target based on risk tolerance
        let adjustedTarget = defaultTarget;
        if (user.riskTolerance === RiskTolerance.CONSERVATIVE) {
          adjustedTarget = 7500; // $7,500 for conservative
        } else if (user.riskTolerance === RiskTolerance.AGGRESSIVE) {
          adjustedTarget = 3000; // $3,000 for aggressive
        }

        return {
          id: 'business-reserve-fund',
          title: 'Business Reserve Fund',
          targetAmount: adjustedTarget,
          reason: `Build a $${adjustedTarget.toLocaleString()} business reserve fund for unexpected expenses${
            user.riskTolerance ? ` based on your ${user.riskTolerance} risk tolerance` : ''
          }`,
          action: 'goals'
        };
      }
      
      // Calculate average monthly expenses
      const totalExpense = allExpenses.reduce((sum, t) => sum + t.amount, 0);
      const averageMonthlyExpense = totalExpense / 6; // 6 months instead of 12
      
      // Suggest 1-2 months of expenses as reserve fund
      const baseTarget = averageMonthlyExpense * 1.5; // 1.5 months default
      
      // Adjust target based on risk tolerance
      let adjustedTarget = baseTarget;
      if (user.riskTolerance === RiskTolerance.CONSERVATIVE) {
        adjustedTarget = Math.round(averageMonthlyExpense * 2); // 2 months for conservative
      } else if (user.riskTolerance === RiskTolerance.AGGRESSIVE) {
        adjustedTarget = Math.round(averageMonthlyExpense * 1); // 1 month for aggressive
      } else {
        adjustedTarget = Math.round(baseTarget); // 1.5 months for moderate
      }

      return {
        id: 'business-safety-net',
        title: 'Business Safety Net',
        targetAmount: adjustedTarget,
        reason: `Save ${user.riskTolerance === RiskTolerance.CONSERVATIVE ? '2' : 
                 user.riskTolerance === RiskTolerance.AGGRESSIVE ? '1' : '1.5'} months of business expenses ($${adjustedTarget.toLocaleString()})${
          user.riskTolerance ? ` based on your ${user.riskTolerance} risk tolerance` : ''
        }`,
        action: 'goals'
      };
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
      reason: `Save for business expenses (based on your average monthly expense of $${averageExpense.toLocaleString()})${
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
    reason: `Save for your next equipment purchase (based on your average expense of $${averageExpense.toLocaleString()})${
      user.riskTolerance ? ` adjusted for your ${user.riskTolerance} risk tolerance` : ''
    }`,
    action: 'goals'
  };
}; 