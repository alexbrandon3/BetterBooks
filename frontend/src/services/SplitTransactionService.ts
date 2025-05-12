import axios from "../utils/axios";

export const fetchSplitTransactions = async () => {
  try {
    const response = await axios.get("/split-transactions");
    return response.data;
  } catch (error) {
    console.error("Error fetching split transactions:", error);
    throw error;
  }
};

export const createSplitTransaction = async (transaction: any) => {
  try {
    const response = await axios.post("/split-transactions", transaction);
    return response.data;
  } catch (error) {
    console.error("Error creating split transaction:", error);
    throw error;
  }
};

export const deleteSplitTransaction = async (id: number) => {
  try {
    await axios.delete(`/split-transactions/${id}`);
    console.log("Split Transaction deleted successfully");
  } catch (error) {
    console.error("Error deleting split transaction:", error);
    throw error;
  }
};