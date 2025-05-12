import axios from "../utils/axios";

export const fetchTransactions = async () => {
  try {
    const response = await axios.get("/transactions");
    return response.data;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

export const createTransaction = async (transaction: any) => {
  try {
    const response = await axios.post("/transactions", transaction);
    return response.data;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export const deleteTransaction = async (id: number) => {
  try {
    await axios.delete(`/transactions/${id}`);
    console.log("Transaction deleted successfully");
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};