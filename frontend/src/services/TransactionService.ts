import api from "../utils/axios";
import { Transaction } from "../types/transaction";
import { JournalEntry } from "../types/journalEntry";
import { cache, CACHE_KEYS, withCache, invalidateTransactions } from "../utils/cache";

export interface TransactionForm {
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT' | 'LOAN_PAYMENT' | 'ASSET_PURCHASE' | 'LIABILITY_SETTLEMENT' | 'EQUITY_CONTRIBUTION' | 'EQUITY_WITHDRAWAL';
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
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT' | 'LOAN_PAYMENT' | 'ASSET_PURCHASE' | 'LIABILITY_SETTLEMENT' | 'EQUITY_CONTRIBUTION' | 'EQUITY_WITHDRAWAL';
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

export interface TransactionQueryOptions {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  accountId?: number;
  search?: string;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

// Cached fetch transactions with pagination
export const fetchTransactions = async (options: TransactionQueryOptions = {}): Promise<PaginatedTransactions> => {
  const cacheKey = `${CACHE_KEYS.TRANSACTIONS}_${JSON.stringify(options)}`;
  
  return withCache(cacheKey, async () => {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.type) params.append('type', options.type);
      if (options.accountId) params.append('accountId', options.accountId.toString());
      if (options.search) params.append('search', options.search);

      const response = await api.get(`/transactions?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }, { ttl: 2 * 60 * 1000 }); // 2 minute cache
};

// Cached fetch recent transactions for dashboard
export const fetchRecentTransactions = async (limit: number = 10): Promise<Transaction[]> => {
  const cacheKey = `${CACHE_KEYS.RECENT_TRANSACTIONS}_${limit}`;
  
  return withCache(cacheKey, async () => {
    try {
      const response = await api.get(`/transactions/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      throw error;
    }
  }, { ttl: 1 * 60 * 1000 }); // 1 minute cache
};

export const createTransaction = async (transaction: BackendTransactionForm): Promise<TransactionResponse> => {
  try {
    console.log('📤 Sending transaction data:', JSON.stringify(transaction, null, 2));
    const response = await api.post("/transactions", transaction);
    
    // Invalidate relevant caches
    invalidateTransactions();
    
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
    const response = await api.put(`/transactions/${id}`, transaction);
    
    // Invalidate relevant caches
    invalidateTransactions();
    
    return response.data;
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    await api.delete(`/transactions/${id}`);
    console.log("Transaction deleted successfully");
    
    // Invalidate relevant caches
    invalidateTransactions();
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};

export const getSuggestedAccount = async (description: string): Promise<{ 
  suggestedAccountId: number; 
  suggestedAccountName: string; 
  reason: string;
  accountType: string;
  confidence: number;
  suggestedEntryType: 'DEBIT' | 'CREDIT';
  detailedReason: string;
} | null> => {
  const cacheKey = `${CACHE_KEYS.SUGGESTIONS}_${description.trim()}`;
  
  return withCache(cacheKey, async () => {
    try {
      const response = await api.post('/suggestions/suggest-account', {
        description: description.trim()
      });
      return response.data;
    } catch (error) {
      console.error("Error getting suggested account:", error);
      return null;
    }
  }, { ttl: 10 * 60 * 1000 }); // 10 minute cache for suggestions
};

export const saveUserPreference = async (description: string, accountId: number): Promise<void> => {
  try {
    await api.post('/suggestions/save-preference', {
      description: description.trim(),
      accountId
    });
    console.log('💾 User preference saved successfully');
  } catch (error) {
    console.error("Error saving user preference:", error);
    // Don't throw error - this is not critical for transaction flow
  }
};

export const getTransactionTemplates = async (): Promise<any[]> => {
  const cacheKey = 'transaction_templates';
  
  return withCache(cacheKey, async () => {
    try {
      const response = await api.get('/transactions/templates');
      return response.data;
    } catch (error) {
      console.error("Error fetching transaction templates:", error);
      throw error;
    }
  }, { ttl: 30 * 60 * 1000 }); // 30 minute cache for templates
};

export const suggestTransactionTemplate = async (description: string, entries: any[]): Promise<any> => {
  try {
    const response = await api.post('/transactions/suggest-template', {
      description,
      entries
    });
    return response.data.template;
  } catch (error) {
    console.error("Error suggesting transaction template:", error);
    return null;
  }
};

export const validateTransactionTemplate = async (transactionType: string, entries: any[]): Promise<{ isValid: boolean; errors: string[] }> => {
  try {
    const response = await api.post('/transactions/validate-template', {
      transactionType,
      entries
    });
    return response.data;
  } catch (error) {
    console.error("Error validating transaction template:", error);
    return { isValid: false, errors: ['Validation failed'] };
  }
};