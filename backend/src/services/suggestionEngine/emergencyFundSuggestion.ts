import { SuggestedGoal } from '../../types/suggestion';
import { Account, AccountType, FinancialCategory } from '../../entities/Account';
import { Transaction } from '../../entities/Transaction';
import { User, RiskTolerance } from '../../entities/User';
import { TransactionType } from '../../types/transaction.types';

export const generateEmergencyFundSuggestion = (
  accounts: Account[],
  transactions: Transaction[],
  user: User
): SuggestedGoal | null => {
  // Calculate total liquid assets (cash and cash equivalents)
  const liquidAssets = accounts
    .filter(a => 
      a.type === AccountType.ASSET && 
      (a.financialCategory === FinancialCategory.CURRENT_ASSET || a.isLiquid)
    )
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  // Calculate average monthly revenue from last 6 months for consistency
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentRevenue = transactions
    .filter(t => 
      t.type === TransactionType.INCOME && 
      new Date(t.date) >= sixMonthsAgo
    )
    .reduce((sum, t) => sum + t.amount, 0);
    
  const averageMonthlyRevenue = recentRevenue / 6;

  // If no revenue data, use a default target
  if (averageMonthlyRevenue <= 0) {
    const defaultTarget = 15000; // Default $15,000 business emergency fund
    
    // Adjust target based on risk tolerance
    let adjustedTarget = defaultTarget;
    if (user.riskTolerance === RiskTolerance.CONSERVATIVE) {
      adjustedTarget *= 1.5; // $22,500 for conservative
    } else if (user.riskTolerance === RiskTolerance.AGGRESSIVE) {
      adjustedTarget *= 0.6; // $9,000 for aggressive
    }

    // Only suggest if current savings are less than target
    if (liquidAssets >= adjustedTarget) {
      return null;
    }

    return {
      id: 'business-emergency-fund',
      title: 'Business Emergency Fund',
      targetAmount: Math.round(adjustedTarget),
      reason: `Build a business emergency fund of $${adjustedTarget.toLocaleString()}${
        user.riskTolerance ? ` based on your ${user.riskTolerance} risk tolerance` : ''
      }`,
      action: 'goals'
    };
  }

  // Target is 3 months of revenue or 25% of annual revenue, whichever is higher
  const targetAmount = Math.max(
    averageMonthlyRevenue * 3,
    averageMonthlyRevenue * 12 * 0.25
  );

  // Adjust target based on risk tolerance
  let adjustedTarget = targetAmount;
  if (user.riskTolerance === RiskTolerance.CONSERVATIVE) {
    adjustedTarget *= 1.2; // More conservative = larger emergency fund
  } else if (user.riskTolerance === RiskTolerance.AGGRESSIVE) {
    adjustedTarget *= 0.8; // More aggressive = smaller emergency fund
  }

  // Only suggest if current savings are less than target
  if (liquidAssets >= adjustedTarget) {
    return null;
  }

  return {
    id: 'business-emergency-fund',
    title: 'Business Emergency Fund',
    targetAmount: Math.round(adjustedTarget),
    reason: `Build a business emergency fund covering ${
      user.riskTolerance === RiskTolerance.CONSERVATIVE ? '3.6' : 
      user.riskTolerance === RiskTolerance.AGGRESSIVE ? '2.4' : '3'
    } months of revenue${
      user.riskTolerance ? ` based on your ${user.riskTolerance} risk tolerance` : ''
    }`,
    action: 'goals'
  };
}; 