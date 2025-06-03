import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import {
  Transaction,
  TransactionType,
  CashFlowCategory,
} from "../entities/Transaction";
import { getUser } from "../utils/getUser";
import { Account } from "../entities/Account";

const transactionRepo = AppDataSource.getRepository(Transaction);
const accountRepo = AppDataSource.getRepository(Account);

// GET /reports/income-statement
export const getIncomeStatement = async (req: Request, res: Response) => {
  const user = await getUser(req);
  console.log("🔍 User from request:", user);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const income = await transactionRepo.find({
      where: { user: { id: user.id }, type: TransactionType.INCOME },
    });
    const expenses = await transactionRepo.find({
      where: { user: { id: user.id }, type: TransactionType.EXPENSE },
    });

    const incomeTotal = income.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expenseTotal = expenses.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const netIncome = incomeTotal - expenseTotal;

    const incomeStatementData = { income: incomeTotal, expenses: expenseTotal, netIncome };
    console.log("📊 Returning income statement:", incomeStatementData);
    res.json(incomeStatementData);
  } catch (err) {
    res.status(500).json({ message: "Failed to generate income statement" });
  }
};

// GET /reports/balance-sheet
export const getBalanceSheet = async (req: Request, res: Response) => {
  const user = await getUser(req);
  console.log("🔍 User from request:", user);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const accounts = await accountRepo.find({
      where: { user: { id: user.id } },
    });

    const assets = accounts.filter((acc) => acc.type === "ASSET");
    const liabilities = accounts.filter((acc) => acc.type === "LIABILITY");
    const equity = accounts.filter((acc) => acc.type === "EQUITY");

    const sum = (arr: Account[]) =>
      arr.reduce((total, acc) => total + Number(acc.balance), 0);

    const balanceSheetData = {
      assets: sum(assets),
      liabilities: sum(liabilities),
      equity: sum(equity),
    };
    console.log("📊 Returning balance sheet:", balanceSheetData);
    res.json(balanceSheetData);
  } catch (err) {
    res.status(500).json({ message: "Failed to generate balance sheet" });
  }
};

// GET /reports/cash-flow
export const getCashFlowStatement = async (req: Request, res: Response) => {
  const user = await getUser(req);
  console.log("🔍 User from request:", user);
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  try {
    const transactions = await transactionRepo.find({
      where: { user: { id: user.id } },
    });

    const operating = transactions
      .filter((tx) => tx.cashFlowCategory === CashFlowCategory.OPERATING)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const investing = transactions
      .filter((tx) => tx.cashFlowCategory === CashFlowCategory.INVESTING)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const financing = transactions
      .filter((tx) => tx.cashFlowCategory === CashFlowCategory.FINANCING)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const netCashFlow = operating + investing + financing;

    const cashFlowData = { operating, investing, financing, netCashFlow };
    console.log("📊 Returning cash flow:", cashFlowData);
    res.json(cashFlowData);
  } catch (err) {
    console.error("Cash flow error:", err);
    res.status(500).json({ message: "Failed to generate cash flow statement" });
  }
};
