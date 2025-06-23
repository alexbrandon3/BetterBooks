import api from "../utils/axios";
import { Account, AccountForm, AccountPayload, AccountSuggestion, AccountTemplate } from "../types/account";

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
  return fetchAccountsWithRecalculatedBalances();
};

export const createAccount = async (account: AccountPayload): Promise<Account> => {
  const response = await api.post("/accounts", account);
  return response.data;
};

export const updateAccount = async (id: number, account: AccountPayload): Promise<Account> => {
  const response = await api.put(`/accounts/${id}`, account);
  return response.data;
};

export const deleteAccount = async (id: number): Promise<void> => {
  await api.delete(`/accounts/${id}`);
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