export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
  ADJUSTMENT = "ADJUSTMENT",
  LOAN_PAYMENT = "LOAN_PAYMENT",
  ASSET_PURCHASE = "ASSET_PURCHASE",
  LIABILITY_SETTLEMENT = "LIABILITY_SETTLEMENT",
  EQUITY_CONTRIBUTION = "EQUITY_CONTRIBUTION",
  EQUITY_WITHDRAWAL = "EQUITY_WITHDRAWAL"
}

export enum EntryType {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT"
}

export interface CreateTransactionDTO {
  description: string;
  date: Date;
  type: TransactionType;
  category: string;
  amount: number;
  entries: {
    amount: number;
    type: EntryType;
    accountId: number;
    description?: string;
  }[];
  userId: number;
}

export interface UpdateTransactionDTO extends CreateTransactionDTO {}

// Transaction template for common scenarios
export interface TransactionTemplate {
  type: TransactionType;
  name: string;
  description: string;
  requiredAccounts: {
    accountType: string;
    entryType: EntryType;
    description: string;
    isDebit: boolean;
  }[];
  optionalAccounts?: {
    accountType: string;
    entryType: EntryType;
    description: string;
    isDebit: boolean;
  }[];
}

// Enhanced transaction result with template suggestions
export interface TransactionResult {
  transaction: any;
  warnings?: any[];
  suggestedTemplate?: TransactionTemplate;
  suggestedAccounts?: any[];
} 