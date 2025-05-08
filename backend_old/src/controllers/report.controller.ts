import { Response, Request } from "express";
import { AppDataSource } from "../data-source";
import { Transaction, TransactionType } from "../entities/Transaction";
import { getUser } from "../utils/getUser";
import { Account } from "../entities/Account";
import { SplitTransaction } from "../entities/SplitTransaction";
import { In } from "typeorm";

const transactionRepo = AppDataSource.getRepository(Transaction);
const accountRepo = AppDataSource.getRepository(Account);
const splitRepo = AppDataSource.getRepository(SplitTransaction);

// GET /reports/income-statement
export const getIncomeStatement = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const { startDate, endDate } = req.query;

    const transactions = await transactionRepo.find({
      where: {
        user: { id: user.id },
        type: In([TransactionType.INCOME, TransactionType.EXPENSE]),
      },
      relations: ["entries", "entries.account"],
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      if (tx.entries && tx.entries.length > 0) {
        for (const entry of tx.entries) {
          if (!entry.account) continue;
          const amt = Number(entry.amount);
          if (entry.account.type === "REVENUE") totalIncome += amt;
          else if (entry.account.type === "EXPENSE") totalExpenses += amt;
        }
      } else {
        const amt = Number(tx.amount);
        if (tx.type === TransactionType.INCOME) totalIncome += amt;
        else if (tx.type === TransactionType.EXPENSE) totalExpenses += amt;
      }
    }

    const netIncome = totalIncome - totalExpenses;
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), 0, 1);
    const defaultEnd = now;

    return res.json({
      totalIncome,
      totalExpenses,
      netIncome,
      startDate: startDate || defaultStart.toISOString(),
      endDate: endDate || defaultEnd.toISOString(),
    });
  } catch (err) {
    console.error("Error generating income statement:", err);
    return res
      .status(500)
      .json({ message: "Failed to generate income statement", err });
  }
};

// GET /reports/balance-sheet
export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);

    const accounts = await accountRepo.find({
      where: { user: { id: user.id } },
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const account of accounts) {
      const balance = Number(account.balance || 0);
      switch (account.type) {
        case "ASSET":
          totalAssets += balance;
          break;
        case "LIABILITY":
          totalLiabilities += balance;
          break;
        case "EQUITY":
          totalEquity += balance;
          break;
      }
    }

    return res.json({
      totalAssets,
      totalLiabilities,
      totalEquity,
      assetsMinusLiabilities: totalAssets - totalLiabilities,
    });
  } catch (err) {
    console.error("Error generating balance sheet:", err);
    return res
      .status(500)
      .json({ message: "Failed to generate balance sheet", err });
  }
};
