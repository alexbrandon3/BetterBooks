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

    // Construct date range if provided
    const whereConditions: any = {
      user: { id: user.id },
      type: In([TransactionType.INCOME, TransactionType.EXPENSE]),
    };

    if (startDate && endDate) {
      whereConditions.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const transactions = await transactionRepo.find({
      where: whereConditions,
      relations: ["account", "recurringTransaction", "splits"],
      order: { date: "DESC" },
    });

    return res.status(200).json(transactions);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error generating income statement:", error.message);
    } else {
      console.error("Unknown error generating income statement");
    }
    return res.status(500).json({ message: "Internal Server Error", error });
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
