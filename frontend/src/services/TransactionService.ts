import axios from "@/utils/axios";

const API_URL = "/api/transactions";

export const getTransactions = async (params?: any) => {
  try {
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching transactions:", error.message);
    throw error;
  }
};

export const getTransactionById = async (id: string) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching transaction:", error.message);
    throw error;
  }
};

export const createTransaction = async (transactionData: any) => {
  try {
    const response = await axios.post(API_URL, transactionData);
    return response.data;
  } catch (error: any) {
    console.error("Error creating transaction:", error.message);
    throw error;
  }
};

export const updateTransaction = async (id: string, transactionData: any) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, transactionData);
    return response.data;
  } catch (error: any) {
    console.error("Error updating transaction:", error.message);
    throw error;
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting transaction:", error.message);
    throw error;
  }
};
