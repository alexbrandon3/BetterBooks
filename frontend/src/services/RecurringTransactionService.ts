import axios from "../utils/axios";

export const fetchRecurringTransactions = async () => {
  try {
    const response = await axios.get("/recurring-transactions");
    return response.data;
  } catch (error) {
    console.error("Error fetching recurring transactions:", error);
    throw error;
  }
};

export const createRecurringTransaction = async (transaction: any) => {
  try {
    const response = await axios.post("/recurring-transactions", transaction);
    return response.data;
  } catch (error) {
    console.error("Error creating recurring transaction:", error);
    throw error;
  }
};

export const updateRecurringTransaction = async (id: number, transaction: any) => {
  try {
    const response = await axios.put(`/recurring-transactions/${id}`, transaction);
    return response.data;
  } catch (error) {
    console.error("Error updating recurring transaction:", error);
    throw error;
  }
};

export const deleteRecurringTransaction = async (id: number) => {
  try {
    await axios.delete(`/recurring-transactions/${id}`);
    console.log("Recurring Transaction deleted successfully");
  } catch (error) {
    console.error("Error deleting recurring transaction:", error);
    throw error;
  }
};