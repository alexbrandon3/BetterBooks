export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  subType: string;
  category: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  level?: number;
  isCustom?: boolean;
  number?: string;
} 