import api from '../utils/axios';
import { AccountWeight, AccountWeightData, AccountWeightWithAccount } from '../types/suggestion';
import { Account } from '../types/account';

export class AccountWeightService {
  static async getUserWeights(): Promise<AccountWeightWithAccount[]> {
    try {
      const response = await api.get('/suggestions/weights');
      return response.data;
    } catch (error) {
      console.error('Error fetching user weights:', error);
      throw error;
    }
  }

  static async createOrUpdateWeight(data: AccountWeightData): Promise<AccountWeight> {
    try {
      const response = await api.post('/suggestions/weights', data);
      return response.data;
    } catch (error) {
      console.error('Error creating/updating weight:', error);
      throw error;
    }
  }

  static async deleteWeight(id: number): Promise<void> {
    try {
      await api.delete(`/suggestions/weights/${id}`);
    } catch (error) {
      console.error('Error deleting weight:', error);
      throw error;
    }
  }

  static async initializeDefaultWeights(): Promise<void> {
    try {
      await api.post('/suggestions/weights/initialize-defaults');
    } catch (error) {
      console.error('Error initializing default weights:', error);
      throw error;
    }
  }

  static async getAccounts(): Promise<Account[]> {
    try {
      const response = await api.get('/accounts');
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }
} 