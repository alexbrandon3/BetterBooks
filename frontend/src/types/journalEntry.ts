import { Account } from './account';

export interface JournalEntry {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  description: string;
  account: Account;
  createdAt: string;
  updatedAt: string;
} 