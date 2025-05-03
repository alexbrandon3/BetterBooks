import { Response, Request } from "express";
import { AppDataSource } from "../data-source";
import { Transaction, TransactionType } from "../entities/Transaction";
import { getUser } from "../utils/getUser";
import { Account } from "../entities/Account";

const transactionRepo = AppDataSource.getRepository(Transaction);
const accountRepo = AppDataSource.getRepository(Account);

// GET /reports/income-statement
export const getIncomeStatement = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const { startDate, endDate } = req.query;

    const query = transactionRepo
      .createQueryBuilder("transaction")
      .where("transaction.userId = :userId", { userId: user.id })
      .andWhere("transaction.type IN (:...types)", {
        types: ["INCOME", "EXPENSE"],
      });

    if (startDate) {
      query.andWhere("transaction.createdAt >= :startDate", { startDate });
    }

    if (endDate) {
      query.andWhere("transaction.createdAt <= :endDate", { endDate });
    }

    const transactions = await query.getMany();

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      if (tx.type === TransactionType.INCOME) totalIncome += Number(tx.amount);
      else if (tx.type === TransactionType.EXPENSE)
        totalExpenses += Number(tx.amount);
    }

    const netIncome = totalIncome - totalExpenses;

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
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
