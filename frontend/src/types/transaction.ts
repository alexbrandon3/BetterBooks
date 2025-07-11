import { JournalEntry } from './journalEntry';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT' | 'LOAN_PAYMENT' | 'ASSET_PURCHASE' | 'LIABILITY_SETTLEMENT' | 'EQUITY_CONTRIBUTION' | 'EQUITY_WITHDRAWAL' | 'CLOSING_ENTRY';

export interface Transaction {
  id: string;
  type: TransactionType;
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
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT' | 'LOAN_PAYMENT' | 'ASSET_PURCHASE' | 'LIABILITY_SETTLEMENT' | 'EQUITY_CONTRIBUTION' | 'EQUITY_WITHDRAWAL' | 'CLOSING_ENTRY';
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

export interface TransactionTemplate {
  type: string;
  name: string;
  description: string;
  requiredAccounts: {
    accountType: string;
    entryType: 'DEBIT' | 'CREDIT';
    description: string;
    isDebit: boolean;
  }[];
  optionalAccounts?: {
    accountType: string;
    entryType: 'DEBIT' | 'CREDIT';
    description: string;
    isDebit: boolean;
  }[];
}

export interface TransactionValidation {
  isValid: boolean;
  errors: string[];
} 