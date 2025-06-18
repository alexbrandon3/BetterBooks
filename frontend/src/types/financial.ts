import { AccountType } from './account';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  category: string;
  subcategory: string;
  financialCategory: string;
  financialSubcategory: string;
}

export interface JournalEntry {
  accountId: number;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
}

export interface Transaction {
  id: number;
  description: string;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  date: string;
  entries: JournalEntry[];
  isRecurring: boolean;
  startDate?: string;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  terminationDate?: string;
}

export interface RecurringTransaction {
  id: number;
  description: string;
  amount: number;
  recurrencePattern: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  nextRun: string;
  endDate?: string;
  account: {
    id: number;
    name: string;
    type: string;
  };
  user: {
    id: number;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashFlow: number;
} 