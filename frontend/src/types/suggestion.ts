export interface SuggestedGoal {
  id: string;
  title: string;
  targetAmount: number;
  reason: string;
  action: 'goals';
}

export interface AccountWeight {
  id: number;
  userId: number;
  keyword: string;
  accountId: number;
  weight: number;
  transactionType?: string;
  isDefault: boolean;
  usageCount: number;
  lastUsed: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountWeightData {
  keyword: string;
  accountId: number;
  weight: number;
  transactionType?: string;
  isDefault?: boolean;
}

export interface AccountWeightWithAccount extends AccountWeight {
  accountName: string;
} 