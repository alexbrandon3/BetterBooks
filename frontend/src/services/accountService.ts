import { Account } from '../types/account';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export const accountService = {
  async getAccounts(): Promise<Account[]> {
    const response = await fetch(`${API_BASE_URL}/accounts`);
    if (!response.ok) {
      throw new Error('Failed to fetch accounts');
    }
    const data = await response.json();
    return data.data.accounts;
  },

  async createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(account),
    });
    if (!response.ok) {
      throw new Error('Failed to create account');
    }
    const data = await response.json();
    return data.data.account;
  },

  async updateAccount(id: string, account: Partial<Account>): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(account),
    });
    if (!response.ok) {
      throw new Error('Failed to update account');
    }
    const data = await response.json();
    return data.data.account;
  },

  async deleteAccount(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete account');
    }
  }
}; 