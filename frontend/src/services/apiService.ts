import api from '@/utils/axios'; // ✅ This is already your preconfigured instance
import { Account } from '../types/account';

export const apiService = {
  // ✅ Fetch all accounts
  getAccounts: async (): Promise<Account[]> => {
    const response = await api.get<Account[]>('/accounts');
    return response.data;
  },

  // ✅ Create a new account
  createAccount: async (
    account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Account> => {
    const response = await api.post<Account>('/accounts', account);
    return response.data;
  },

  // ✅ Update an account
  updateAccount: async (
    id: string,
    account: Partial<Account>
  ): Promise<Account> => {
    const response = await api.patch<Account>(`/accounts/${id}`, account);
    return response.data;
  },

  // ✅ Delete an account
  deleteAccount: async (id: string): Promise<void> => {
    await api.delete(`/accounts/${id}`);
  },

  // ✅ Health check
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await api.get<{ status: string }>('/ping');
      return response.data.status === 'pong';
    } catch {
      return false;
    }
  },
};
