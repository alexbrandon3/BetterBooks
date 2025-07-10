import api from "../utils/axios";
import { Account, AccountForm, AccountPayload, AccountSuggestion, AccountTemplate } from "../types/account";
import { cache, CACHE_KEYS, withCache, invalidateAccounts } from "../utils/cache";

export const fetchAccounts = async (): Promise<Account[]> => {
  const response = await api.get("/accounts");
  return response.data;
};

export const fetchAccountsWithRecalculatedBalances = async (): Promise<Account[]> => {
  const response = await api.get("/accounts/recalculated");
  return response.data;
};

// Use recalculated balances by default to ensure consistency with balance sheet
export const fetchAccountsWithConsistentBalances = async (): Promise<Account[]> => {
  const cacheKey = CACHE_KEYS.ACCOUNTS;
  
  return withCache(cacheKey, async () => {
    try {
      const response = await api.get("/accounts");
      return response.data;
    } catch (error) {
      console.error("Error fetching accounts:", error);
      throw error;
    }
  }, { ttl: 5 * 60 * 1000 }); // 5 minute cache
};

export const fetchAccountBalances = async (): Promise<Map<number, number>> => {
  const cacheKey = CACHE_KEYS.ACCOUNT_BALANCES;
  
  return withCache(cacheKey, async () => {
    try {
      const response = await api.get("/accounts/balances");
      console.log('📊 Raw account balances response:', response.data);
      
      const balanceMap = new Map<number, number>();
      
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((item: { accountId: number; balance: number }) => {
          // Ensure balance is a number
          const balance = Number(item.balance);
          console.log(`📊 Setting balance for account ${item.accountId}: ${item.balance} -> ${balance} (type: ${typeof balance})`);
          balanceMap.set(item.accountId, balance);
        });
      }
      
      console.log('📊 Final balance map:', Array.from(balanceMap.entries()));
      return balanceMap;
    } catch (error) {
      console.error("Error fetching account balances:", error);
      return new Map();
    }
  }, { ttl: 2 * 60 * 1000 }); // 2 minute cache
};

export const createAccount = async (accountData: Partial<Account>): Promise<Account> => {
  try {
    const response = await api.post("/accounts", accountData);
    
    // Invalidate relevant caches
    invalidateAccounts();
    
    return response.data;
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
};

export const updateAccount = async (id: number, accountData: Partial<Account>): Promise<Account> => {
  try {
    const response = await api.put(`/accounts/${id}`, accountData);
    
    // Invalidate relevant caches
    invalidateAccounts();
    
    return response.data;
  } catch (error) {
    console.error("Error updating account:", error);
    throw error;
  }
};

export const deleteAccount = async (id: number): Promise<void> => {
  try {
    await api.delete(`/accounts/${id}`);
    
    // Invalidate relevant caches
    invalidateAccounts();
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};

// Enhanced suggestion with explanations and confidence
export const suggestAccountMetadata = async (name: string): Promise<AccountSuggestion | null> => {
  try {
    const response = await api.post("/accounts/suggest-account", { name });
    return response.data;
  } catch (error) {
    console.error("Error getting account suggestions:", error);
    return null;
  }
};

// Get account templates for quick-pick options
export const getAccountTemplates = async (): Promise<AccountTemplate[]> => {
  try {
    const response = await api.get("/accounts/templates");
    return response.data;
  } catch (error) {
    console.error("Error getting account templates:", error);
    return [];
  }
};

// Get popular templates only
export const getPopularTemplates = async (): Promise<AccountTemplate[]> => {
  const templates = await getAccountTemplates();
  return templates.filter(template => template.isPopular);
}; 