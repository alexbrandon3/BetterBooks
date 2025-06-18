export type GoalType = 'INCREASE_ASSETS' | 'DECREASE_LIABILITIES' | 'INCREASE_NET_INCOME';

export interface FinancialGoal {
  id: string;
  type: GoalType;
  targetAmount: number;
  targetDate: string;
  createdAt: string;
  progress: number;
  currentAmount?: number;
  daysRemaining?: number;
}

export interface GoalFormData {
  type: GoalType;
  targetAmount: string;
  targetDate: string;
} 