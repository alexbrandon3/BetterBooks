export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE"
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
  }[];
  userId: number;
}

export interface UpdateTransactionDTO extends CreateTransactionDTO {} 