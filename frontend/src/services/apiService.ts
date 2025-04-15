import axios from 'axios';
import { Account } from '../types/account';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Accounts
  getAccounts: async () => {
    const response = await api.get<Account[]>('/accounts');
    return response.data;
  },

  createAccount: async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Account>('/accounts', account);
    return response.data;
  },

  updateAccount: async (id: string, account: Partial<Account>) => {
    const response = await api.patch<Account>(`/accounts/${id}`, account);
    return response.data;
  },

  deleteAccount: async (id: string) => {
    await api.delete(`/accounts/${id}`);
  },

  // Health check
  checkHealth: async () => {
    try {
      const response = await api.get('/ping');
      return response.data.status === 'pong';
    } catch {
      return false;
    }
  },
}; 