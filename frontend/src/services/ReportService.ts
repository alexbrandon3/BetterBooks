// src/services/report.service.ts
import axios from "../utils/axios";

export const fetchIncomeStatement = async () => {
  console.log("🧠 Entered getIncomeStatement");
  const response = await axios.get("reports/income-statement");
  console.log("💾 Income response data:", response.data);
  return response.data; // Returns an object with income, expenses, netIncome
};

export const fetchBalanceSheet = async () => {
  console.log("🧠 Entered getBalanceSheet");
  const response = await axios.get("reports/balance-sheet");
  console.log("💾 Balance sheet response data:", response.data);
  return response.data; // Returns an object with assets, liabilities, equity
};

export const fetchCashFlowStatement = async () => {
  console.log("🧠 Entered getCashFlowStatement");
  const response = await axios.get("reports/cash-flow");
  console.log("💾 Cash flow response data:", response.data);
  return response.data; // Returns an object with operating, investing, financing, netCashFlow
};
