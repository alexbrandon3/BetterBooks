// src/services/report.service.ts
import api from "../utils/axios";
import { BalanceSheet, IncomeStatement, CashFlow } from "../types/reports";
import { DateRange } from "../types/common";

export type { BalanceSheet, IncomeStatement, CashFlow };

export interface DrillDownTransaction {
  id: number;
  date: string;
  description: string;
  netAmount: number;
  entries: {
    accountName: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    accountType: string;
    financialCategory: string;
    financialSubcategory: string;
    isRelevant: boolean;
  }[];
}

export const fetchBalanceSheet = async (): Promise<BalanceSheet> => {
  console.log("🧠 Entered getBalanceSheet");
  const response = await api.get("reports/balance-sheet");
  console.log("💾 Balance sheet response data:", response.data);
  return response.data;
};

export const fetchIncomeStatement = async (startDate?: string, endDate?: string): Promise<IncomeStatement> => {
  console.log("🧠 Entered getIncomeStatement");
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await api.get(`reports/income-statement?${params.toString()}`);
  console.log("💾 Income statement response data:", response.data);
  return response.data;
};

export const fetchCashFlowStatement = async (startDate?: string, endDate?: string): Promise<CashFlow> => {
  console.log("🧠 Entered getCashFlowStatement");
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await api.get(`reports/cash-flow?${params.toString()}`);
  console.log("💾 Cash flow response data:", response.data);
  return response.data;
};

export const fetchDrillDown = async (
  type: string,
  accountId?: number,
  subcategory?: string,
  startDate?: string,
  endDate?: string
): Promise<DrillDownTransaction[]> => {
  console.log("🔍 Fetching drill-down data:", { type, accountId, subcategory, startDate, endDate });
  
  const params = new URLSearchParams();
  params.append('type', type);
  if (accountId) params.append('accountId', accountId.toString());
  if (subcategory) params.append('subcategory', subcategory);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await api.get(`reports/drilldown?${params.toString()}`);
  console.log("💾 Drill-down response data:", response.data);
  return response.data;
};
