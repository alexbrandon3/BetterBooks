// src/services/report.service.ts
import axios from "../utils/axios";
import { BalanceSheet, IncomeStatement, CashFlow } from "../types/reports";
import { DateRange } from "../types/common";

export type { BalanceSheet, IncomeStatement, CashFlow };

export const fetchIncomeStatement = async (startDate?: string, endDate?: string): Promise<IncomeStatement> => {
  console.log("🧠 Entered getIncomeStatement");
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await axios.get(`reports/income-statement?${params.toString()}`);
  console.log("💾 Income response data:", response.data);
  return response.data;
};

export const fetchBalanceSheet = async (startDate?: string, endDate?: string): Promise<BalanceSheet> => {
  console.log("🧠 Entered getBalanceSheet");
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await axios.get(`reports/balance-sheet?${params.toString()}`);
  console.log("💾 Balance sheet response data:", response.data);
  return response.data;
};

export const fetchCashFlowStatement = async (startDate?: string, endDate?: string): Promise<CashFlow> => {
  console.log("🧠 Entered getCashFlowStatement");
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await axios.get(`reports/cash-flow?${params.toString()}`);
  console.log("💾 Cash flow response data:", response.data);
  return response.data;
};
