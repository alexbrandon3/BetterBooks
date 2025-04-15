import { Account } from './account';

export interface JournalEntryLine {
  account: Account;
  amount: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debits: JournalEntryLine[];
  credits: JournalEntryLine[];
  total: number;
  status: 'valid' | 'error';
  errorMessage?: string;
  attachment?: string;
  tags?: string[];
  timestamp: string;
}

export interface JournalEntryInput {
  date: string;
  description: string;
  debits: { account: string; amount: number }[];
  credits: { account: string; amount: number }[];
  attachment?: string;
  tags?: string[];
}

export interface JournalEntryValidationResult {
  status: 'valid' | 'error';
  message?: string;
  total?: number;
} 