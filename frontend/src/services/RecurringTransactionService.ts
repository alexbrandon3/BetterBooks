import api from "../utils/axios";

export interface RecurringTransactionData {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT' | 'LOAN_PAYMENT' | 'ASSET_PURCHASE' | 'LIABILITY_SETTLEMENT' | 'EQUITY_CONTRIBUTION' | 'EQUITY_WITHDRAWAL' | 'CLOSING_ENTRY';
  recurrencePattern: string;
  nextRun: string;
  endDate?: string;
  primaryAccountId: number;
  secondaryAccountId: number;
  primaryEntryType: 'DEBIT' | 'CREDIT';
  secondaryEntryType: 'DEBIT' | 'CREDIT';
}

export const fetchRecurringTransactions = async () => {
  try {
    const response = await api.get("/recurring-transactions");
    return response.data;
  } catch (error) {
    console.error("Error fetching recurring transactions:", error);
    throw error;
  }
};

export const createRecurringTransaction = async (transaction: RecurringTransactionData) => {
  try {
    const response = await api.post("/recurring-transactions", transaction);
    return response.data;
  } catch (error) {
    console.error("Error creating recurring transaction:", error);
    throw error;
  }
};

export const updateRecurringTransaction = async (id: number, transaction: RecurringTransactionData) => {
  try {
    const response = await api.put(`/recurring-transactions/${id}`, transaction);
    return response.data;
  } catch (error) {
    console.error("Error updating recurring transaction:", error);
    throw error;
  }
};

export const deleteRecurringTransaction = async (id: number) => {
  try {
    await api.delete(`/recurring-transactions/${id}`);
    console.log("Recurring Transaction deleted successfully");
  } catch (error) {
    console.error("Error deleting recurring transaction:", error);
    throw error;
  }
};

export const toggleRecurringTransaction = async (id: number) => {
  try {
    const response = await api.patch(`/recurring-transactions/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error("Error toggling recurring transaction:", error);
    throw error;
  }
};