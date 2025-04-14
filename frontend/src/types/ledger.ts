import { Account } from './account';

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'JOURNAL';
export type EntryStatus = 'PENDING' | 'REVIEWED' | 'ADJUSTED';

export interface LedgerEntry {
  id: string;
  transactionId: string;
  account: Account;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  userId?: string;
  timestamp: string;
  isFlagged: boolean;
  attachments?: Attachment[];
  auditTrail: AuditLogEntry[];
  transactionType?: string;
}

export interface Attachment {
  type: 'receipt' | 'note';
  name: string;
  url?: string;
}

export interface AuditLogEntry {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  timestamp: string;
  userId?: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  metadata: Record<string, any>;
}

export interface AccountLedger {
  account: Account;
  entries: LedgerEntry[];
  currentBalance: number;
}

export interface GeneralLedger {
  accounts: Record<string, AccountLedger>;
  flaggedTransactions: LedgerEntry[];
  lastUpdated: string;
}

export interface LedgerFilters {
  accountId?: string;
  dateRange?: [number, number];
  transactionType?: TransactionType[];
  amountRange?: {
    min: number;
    max: number;
  };
  hasAttachment?: boolean;
  isFlagged?: boolean;
  searchTerm?: string;
}

export interface LedgerValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface BalanceChange {
  accountId: string;
  amount: number;
  isDebit: boolean;
}

export interface LedgerSummary {
  totalDebits: number;
  totalCredits: number;
  netChange: number;
  flaggedCount: number;
  attachmentCount: number;
  dateRange: {
    start: number;
    end: number;
  };
}

export interface AuditTrailExport {
  startDate: Date;
  endDate: Date;
  exportedAt: Date;
  exportedBy: string;
  entries: AuditLogEntry[];
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debits: Array<{
    account: Account;
    amount: number;
  }>;
  credits: Array<{
    account: Account;
    amount: number;
  }>;
  total: number;
  status: 'valid' | 'error';
  timestamp: string;
  userId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface LedgerContextType {
  ledger: GeneralLedger;
  postJournalEntry: (entry: JournalEntry) => Promise<ValidationResult>;
  getAccountLedger: (accountId: string) => AccountLedger | undefined;
  getFlaggedTransactions: () => LedgerEntry[];
  filterLedgerEntries: (filters: LedgerFilters) => LedgerEntry[];
  getLedgerSummary: () => LedgerSummary;
  validateJournalEntry: (entry: JournalEntry) => ValidationResult;
  detectUnusualActivity: (entry: JournalEntry) => boolean;
} 