import { Account } from '../types/account';
import { FinancialCategory } from '../types/account';
import { FinancialGoal } from '../types/goal';

export const calculateTotalAssets = (accounts: Account[]): number => {
  return accounts
    .filter(account => 
      account.financialCategory === FinancialCategory.CURRENT_ASSET || 
      account.financialCategory === FinancialCategory.FIXED_ASSET
    )
    .reduce((sum, account) => {
      const balance = typeof account.balance === 'string' 
        ? parseFloat(account.balance) 
        : account.balance;
      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);
};

export const calculateTotalLiabilities = (accounts: Account[]): number => {
  return accounts
    .filter(account => 
      account.financialCategory === FinancialCategory.CURRENT_LIABILITY || 
      account.financialCategory === FinancialCategory.LONG_TERM_LIABILITY
    )
    .reduce((sum, account) => {
      const balance = typeof account.balance === 'string' 
        ? parseFloat(account.balance) 
        : account.balance;
      return sum + (isNaN(balance) ? 0 : balance);
    }, 0);
};

export const calculateNetWorth = (accounts: Account[]): number => {
  const assets = calculateTotalAssets(accounts);
  const liabilities = calculateTotalLiabilities(accounts);
  return assets - liabilities;
};

export const calculateGoalProgress = (
  goal: FinancialGoal,
  accounts: Account[]
): FinancialGoal => {
  let currentAmount = 0;

  switch (goal.type) {
    case 'INCREASE_ASSETS':
      currentAmount = calculateTotalAssets(accounts);
      break;
    case 'DECREASE_LIABILITIES':
      currentAmount = calculateTotalLiabilities(accounts);
      break;
    case 'INCREASE_NET_INCOME':
      currentAmount = calculateNetWorth(accounts);
      break;
  }

  const progress = Math.min(100, Math.max(0, (currentAmount / goal.targetAmount) * 100));
  const daysRemaining = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  return {
    ...goal,
    currentAmount,
    progress,
    daysRemaining
  };
};

export const formatGoalTitle = (goal: FinancialGoal): string => {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(goal.targetAmount);

  switch (goal.type) {
    case 'INCREASE_ASSETS':
      return `Save ${amount}`;
    case 'DECREASE_LIABILITIES':
      return `Pay off ${amount}`;
    case 'INCREASE_NET_INCOME':
      return `Grow net worth to ${amount}`;
    default:
      return 'Financial Goal';
  }
}; 