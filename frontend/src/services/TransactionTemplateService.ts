import api from "../utils/axios";
import { TransactionTemplate } from "../types/transaction";

export const fetchTransactionTemplates = async (): Promise<TransactionTemplate[]> => {
  try {
    const response = await api.get("/transactions/templates");
    return response.data;
  } catch (error) {
    console.error("Error fetching transaction templates:", error);
    throw error;
  }
};

export const createTransactionTemplate = async (template: {
  name: string;
  description: string;
  type: string;
  requiredAccounts: any[];
  optionalAccounts?: any[];
}): Promise<TransactionTemplate> => {
  try {
    const response = await api.post("/transactions/templates", template);
    return response.data;
  } catch (error) {
    console.error("Error creating transaction template:", error);
    throw error;
  }
};

export const deleteTransactionTemplate = async (templateId: number): Promise<void> => {
  try {
    await api.delete(`/transactions/templates/${templateId}`);
  } catch (error) {
    console.error("Error deleting transaction template:", error);
    throw error;
  }
};

export const suggestTransactionTemplate = async (description: string, entries: any[]): Promise<TransactionTemplate | null> => {
  try {
    const response = await api.post("/transactions/suggest-template", { description, entries });
    return response.data.template || null;
  } catch (error) {
    console.error("Error suggesting transaction template:", error);
    return null;
  }
};

export const validateTransactionTemplate = async (transactionType: string, entries: any[]): Promise<{ isValid: boolean; errors: string[] }> => {
  try {
    const response = await api.post("/transactions/validate-template", { transactionType, entries });
    return response.data;
  } catch (error) {
    console.error("Error validating transaction template:", error);
    return { isValid: false, errors: ["Validation failed"] };
  }
}; 