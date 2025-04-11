export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debit: {
    account: string;
    amount: number;
  };
  credit: {
    account: string;
    amount: number;
  };
} 