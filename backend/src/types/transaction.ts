import { EntryType } from '../entities/JournalEntry';

export interface CreateTransactionDto {
  description: string;
  startDate: Date;
  userId: number;
  entries: {
    amount: number;
    type: EntryType;
    description?: string;
    accountId: number;
  }[];
}

export interface UpdateTransactionDto {
  description: string;
  startDate: Date;
  entries?: {
    amount: number;
    type: EntryType;
    description?: string;
    accountId: number;
  }[];
} 