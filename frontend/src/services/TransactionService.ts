import axios from "../utils/axios";
import { Transaction } from "../types/transaction";
import { JournalEntry } from "../types/journalEntry";

export interface TransactionForm {
  type: 'INCOME' | 'EXPENSE';
  description: string;
  date: string;
  category: string;
  amount: number;
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

// Backend API compatible interface
export interface BackendTransactionForm {
  type: 'INCOME' | 'EXPENSE';
  description: string;
  date: string;
  category: string;
  amount: number;
  entries: {
    accountId: number;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    description: string;
  }[];
  isRecurring?: boolean;
  startDate?: string;
  recurrencePattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  terminationDate?: string;
}

export interface BalanceWarning {
  accountId: number;
  accountName: string;
  currentBalance: number;
  newBalance: number;
  message: string;
}

export interface TransactionResponse {
  transaction: Transaction;
  warnings?: BalanceWarning[];
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

export const createTransaction = async (transaction: BackendTransactionForm): Promise<TransactionResponse> => {
  try {
    console.log('📤 Sending transaction data:', JSON.stringify(transaction, null, 2));
    const response = await axios.post("/transactions", transaction);
    
    // Check if the response contains warnings
    const warnings = response.data.warnings;
    const transactionData = warnings ? { ...response.data, warnings: undefined } : response.data;
    
    return {
      transaction: transactionData,
      warnings: warnings
    };
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    if (error.response) {
      console.error("Backend error response:", error.response.data);
      console.error("Status:", error.response.status);
    }
    throw error;
  }
};

export const updateTransaction = async (id: string, transaction: BackendTransactionForm): Promise<Transaction> => {
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