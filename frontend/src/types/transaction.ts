export type TransactionType = 'expense' | 'revenue' | 'transfer';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  accountId: string;
  type: TransactionType;
  categoryAccountId: string;
  referenceNumber?: string;
  notes?: string;
  isReconciled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  transactionId: string;
  accountId: string;
  amount: number;
  isDebit: boolean;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionWithJournal {
  transaction: Transaction;
  journalEntries: JournalEntry[];
} 