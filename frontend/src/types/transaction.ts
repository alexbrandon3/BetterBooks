import { JournalEntry } from './journalEntry';

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  date: string;
  category: string;
  amount: number;
  entries: JournalEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFormType {
  description: string;
  type: 'EXPENSE' | 'INCOME';
  date: string;
  entries: {
    accountId: string;
    amount: string;
    type: 'DEBIT' | 'CREDIT';
    description?: string;
  }[];
  startDate?: string;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  terminationDate?: string;
} 