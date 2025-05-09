// report.service.ts

import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";

export const generateIncomeStatement = async (
  startDate: string,
  endDate: string
) => {
  const income = await AppDataSource.getRepository(Transaction).find({
    where: { type: "INCOME" },
  });
  const expenses = await AppDataSource.getRepository(Transaction).find({
    where: { type: "EXPENSE" },
  });

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  return {
    revenue: totalIncome,
    expenses: totalExpenses,
    netIncome,
  };
};

export const generateBalanceSheet = async (date: string) => {
  const accounts = await AppDataSource.getRepository(Account).find();

  const assets = accounts
    .filter((acc) => acc.type === "ASSET")
    .reduce((sum, acc) => sum + acc.balance, 0);
  const liabilities = accounts
    .filter((acc) => acc.type === "LIABILITY")
    .reduce((sum, acc) => sum + acc.balance, 0);
  const equity = assets - liabilities;

  return {
    assets,
    liabilities,
    equity,
  };
};

export const generateCashFlowStatement = async (
  startDate: string,
  endDate: string
) => {
  // Placeholder for now. We can flesh this out after testing the other two.
  return {
    operating: 0,
    investing: 0,
    financing: 0,
  };
};
