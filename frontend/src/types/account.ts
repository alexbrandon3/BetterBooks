export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  id: string;
  number: string;
  name: string;
  type: AccountType;
  subType: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} 