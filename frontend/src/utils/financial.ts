import { Account, Transaction, FinancialSummary } from '../types/financial';
import { FinancialGoal } from '../types/goal';

export const calculateAccountBalance = (account: Account): number => {
  return typeof account.balance === 'number' && !isNaN(account.balance) ? account.balance : 0;
};

export const formatCurrency = (amount: number): string => {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(safeAmount);
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const calculateFinancialSummary = (
  accounts: Account[],
  transactions: Transaction[]
): FinancialSummary => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const totalBalance = accounts.reduce((acc, account) => {
    const balance = calculateAccountBalance(account);
    return acc + (typeof balance === 'number' && !isNaN(balance) ? balance : 0);
  }, 0);

  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => {
      const incomeAmount = t.entries
        .filter(e => e.type === 'CREDIT')
        .reduce((sum, e) => sum + (typeof e.amount === 'number' && !isNaN(e.amount) ? e.amount : 0), 0);
      return acc + (typeof incomeAmount === 'number' && !isNaN(incomeAmount) ? incomeAmount : 0);
    }, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      const expenseAmount = t.entries
        .filter(e => e.type === 'DEBIT')
        .reduce((sum, e) => sum + (typeof e.amount === 'number' && !isNaN(e.amount) ? e.amount : 0), 0);
      return acc + (typeof expenseAmount === 'number' && !isNaN(expenseAmount) ? expenseAmount : 0);
    }, 0);

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    netCashFlow: monthlyIncome - monthlyExpenses
  };
};

export const formatGoalTitle = (goal: FinancialGoal): string => {
  const typeMap: Record<FinancialGoal['type'], string> = {
    'INCREASE_ASSETS': 'Increase Assets',
    'DECREASE_LIABILITIES': 'Decrease Liabilities',
    'INCREASE_NET_INCOME': 'Increase Net Worth'
  };

  return `${typeMap[goal.type]} to ${formatCurrency(goal.targetAmount)}`;
}; 