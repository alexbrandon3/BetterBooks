import axios from "../utils/axios";
import { Transaction } from "../types/transaction";
import { JournalEntry } from "../types/journalEntry";

export interface TransactionForm {
  type: 'INCOME' | 'EXPENSE';
  description: string;
  date: string;
  entries: JournalEntryFields[];
  isRecurring?: boolean;
  startDate?: string;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  terminationDate?: string;
}

export interface JournalEntryFields {
  accountId: string;
  amount: string;
  type: 'DEBIT' | 'CREDIT';
  description?: string;
}

export const fetchTransactions = async (): Promise<Transaction[]> => {
  try {
    const response = await axios.get("/transactions");
    return response.data;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

export const createTransaction = async (transaction: TransactionForm): Promise<Transaction> => {
  try {
    const response = await axios.post("/transactions", transaction);
    return response.data;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export const updateTransaction = async (id: string, transaction: TransactionForm): Promise<Transaction> => {
  try {
    const response = await axios.put(`/transactions/${id}`, transaction);
    return response.data;
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    await axios.delete(`/transactions/${id}`);
    console.log("Transaction deleted successfully");
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};

export const getSuggestedAccount = async (description: string): Promise<{ suggestedAccountId: number; suggestedAccountName: string; reason: string } | null> => {
  try {
    const response = await axios.post('/suggestions/suggest-account', {
      description: description.trim()
    });
    return response.data;
  } catch (error) {
    console.error("Error getting suggested account:", error);
    return null;
  }
};