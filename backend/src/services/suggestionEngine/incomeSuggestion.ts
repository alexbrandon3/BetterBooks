import { SuggestedGoal } from '../../types/suggestion';
import { Transaction } from '../../entities/Transaction';
import { User, RiskTolerance } from '../../entities/User';
import { TransactionType } from '../../types/transaction.types';

export const generateIncomeSuggestion = (
  transactions: Transaction[],
  user: User
): SuggestedGoal | null => {
  // Calculate average monthly revenue from last 6 months for better consistency
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentRevenue = transactions
    .filter(t => 
      t.type === TransactionType.INCOME && 
      new Date(t.date) >= sixMonthsAgo
    )
    .reduce((sum, t) => sum + t.amount, 0);
    
  const averageMonthlyRevenue = recentRevenue / 6;
  
  if (averageMonthlyRevenue <= 0) {
    const defaultTarget = 10000; // Default $10,000 business savings goal
    
    // Adjust target based on risk tolerance
    let targetAmount = defaultTarget;
    if (user.riskTolerance === RiskTolerance.CONSERVATIVE) {
      targetAmount = 15000; // Higher for conservative
    } else if (user.riskTolerance === RiskTolerance.AGGRESSIVE) {
      targetAmount = 7000; // Lower for aggressive
    }

    return {
      id: 'business-savings-goal',
      title: 'Build Business Savings',
      targetAmount,
      reason: `Start building your business savings with a $${targetAmount.toLocaleString()} goal${
        user.riskTolerance ? ` based on your ${user.riskTolerance} risk tolerance` : ''
      }`,
      action: 'goals'
    };
  }

  // For revenue-based savings, use 1 month of revenue as the base target
  const baseTarget = averageMonthlyRevenue;
  
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
    id: 'monthly-revenue',
    title: 'Save 1 Month of Revenue',
    targetAmount,
    reason: `Save one month's revenue ($${targetAmount.toLocaleString()}) as a business buffer${
      user.riskTolerance ? ` based on your ${user.riskTolerance} risk tolerance` : ''
    }`,
    action: 'goals'
  };
}; 