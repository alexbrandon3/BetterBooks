import axios from "../utils/axios";

export const fetchIncomeStatement = async (
  startDate?: string,
  endDate?: string
) => {
  try {
    const response = await axios.get("/reports/income-statement", {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch income statement:", error);
    throw new Error("Could not fetch income statement");
  }
};

export const fetchBalanceSheet = async (
  startDate?: string,
  endDate?: string
) => {
  try {
    const response = await axios.get("/reports/balance-sheet", {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch balance sheet:", error);
    throw new Error("Could not fetch balance sheet");
  }
};

export const fetchCashFlowStatement = async (
  startDate?: string,
  endDate?: string
) => {
  try {
    const response = await axios.get("/reports/cash-flow-statement", {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch cash flow statement:", error);
    throw new Error("Could not fetch cash flow statement");
  }
};
