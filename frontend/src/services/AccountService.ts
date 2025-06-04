import api from "../utils/axios";
import { Account, AccountForm, AccountPayload } from "../types/account";

export const fetchAccounts = async (): Promise<Account[]> => {
  const response = await api.get("/accounts");
  return response.data;
};

export const createAccount = async (data: AccountPayload): Promise<Account> => {
  const response = await api.post("/accounts", data);
  return response.data;
};

export const updateAccount = async (id: number, data: AccountPayload): Promise<Account> => {
  const response = await api.put(`/accounts/${id}`, data);
  return response.data;
};

export const deleteAccount = async (id: number): Promise<void> => {
  await api.delete(`/accounts/${id}`);
};

export const suggestAccountMetadata = async (name: string): Promise<Partial<Account>> => {
  const response = await api.post("/accounts/suggest-account", { name });
  return response.data;
}; 