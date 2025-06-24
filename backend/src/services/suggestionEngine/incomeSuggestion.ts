import { SuggestedGoal } from '../../types/suggestion';
import { Transaction } from '../../entities/Transaction';
import { User, RiskTolerance } from '../../entities/User';
import { TransactionType } from '../../types/transaction.types';

export const generateIncomeSuggestion = (
  transactions: Transaction[],
  user: User
): SuggestedGoal | null => {
  // Calculate average monthly income from last 6 months for better consistency
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentIncome = transactions
    .filter(t => 
      t.type === TransactionType.INCOME && 
      new Date(t.date) >= sixMonthsAgo
    )
    .reduce((sum, t) => sum + t.amount, 0);
    
  const averageMonthlyIncome = recentIncome / 6;
  
  if (averageMonthlyIncome <= 0) {
    const defaultTarget = 3000; // Default $3,000 savings goal
    
    // Adjust target based on risk tolerance
    let targetAmount = defaultTarget;
    if (user.riskTolerance === RiskTolerance.CONSERVATIVE) {
      targetAmount = 5000; // Higher for conservative
    } else if (user.riskTolerance === RiskTolerance.AGGRESSIVE) {
      targetAmount = 2000; // Lower for aggressive
    }

    return {
      id: 'savings-goal',
      title: 'Build Your Savings',
      targetAmount,
      reason: `Start building your savings with a $${targetAmount.toLocaleString()} goal${
        user.riskTolerance ? ` based on your ${user.riskTolerance} risk tolerance` : ''
      }`,
      action: 'goals'
    };
  }

  // For income-based savings, use 1 month of income as the base target
  const baseTarget = averageMonthlyIncome;
  
  // Adjust target based on risk tolerance
  let targetAmount = baseTarget;
  if (user.riskTolerance === RiskTolerance.CONSERVATIVE) {
    targetAmount = Math.round(baseTarget * 1.2); // 20% more for conservative
  } else if (user.riskTolerance === RiskTolerance.AGGRESSIVE) {
    targetAmount = Math.round(baseTarget * 0.8); // 20% less for aggressive
  } else {
    targetAmount = Math.round(baseTarget); // Exact 1 month for moderate
  }

  return {
    id: 'monthly-income',
    title: 'Save 1 Month of Income',
    targetAmount,
    reason: `Save one month's income ($${targetAmount.toLocaleString()}) as a financial buffer${
      user.riskTolerance ? ` based on your ${user.riskTolerance} risk tolerance` : ''
    }`,
    action: 'goals'
  };
}; 