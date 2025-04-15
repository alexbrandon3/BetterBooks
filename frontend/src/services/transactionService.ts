import { Transaction, TransactionWithJournal } from '../types/transaction';
import { API_BASE_URL } from '../config';

export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<TransactionWithJournal> => {
  const response = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create transaction');
  }

  return response.json();
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await fetch(`${API_BASE_URL}/api/transactions`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  return response.json();
};

export const getTransactionById = async (id: string): Promise<TransactionWithJournal> => {
  const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch transaction');
  }

  return response.json();
}; 