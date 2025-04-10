export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'JOURNAL';
export type EntryStatus = 'PENDING' | 'REVIEWED' | 'ADJUSTED';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'CREATE' | 'EDIT' | 'DELETE' | 'RESTORE';
  entityType: 'TRANSACTION' | 'ACCOUNT';
  entityId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata: {
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface LedgerEntry {
  id: string;
  date: Date;
  description: string;
  transactionType: TransactionType;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
  status: EntryStatus;
  attachments: {
    id: string;
    type: 'RECEIPT' | 'INVOICE' | 'OTHER';
    url: string;
    filename: string;
  }[];
  metadata: {
    createdAt: Date;
    createdBy: string;
    lastModifiedAt?: Date;
    lastModifiedBy?: string;
    aiSuggested?: boolean;
    aiConfidence?: number;
    flagged?: boolean;
    flagReason?: string;
  };
  relatedAccounts: {
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
  notes?: string;
  auditTrail: AuditLogEntry[];
}

export interface LedgerFilters {
  accountId?: string;
  dateRange?: [Date | null, Date | null];
  transactionType?: TransactionType[];
  amountRange?: {
    min?: number;
    max?: number;
  };
  hasAttachment?: boolean;
  status?: EntryStatus[];
  searchTerm?: string;
}

export interface AuditTrailExport {
  startDate: Date;
  endDate: Date;
  exportedAt: Date;
  exportedBy: string;
  entries: AuditLogEntry[];
} 