export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
  ADJUSTMENT = "ADJUSTMENT"
}

export interface CreateTransactionDTO {
  description: string;
  startDate: Date;
  entries: {
    amount: number;
    type: string;
    accountId: number;
  }[];
  userId: number;
}

export interface UpdateTransactionDTO extends CreateTransactionDTO {} 