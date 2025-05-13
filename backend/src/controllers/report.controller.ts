// report.controller.ts

import { Request, Response } from "express";
import {
  generateIncomeStatement,
  generateBalanceSheet,
  generateCashFlowStatement,
} from "../services/report.service";
import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";

export const getIncomeStatement = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await generateIncomeStatement(
      startDate as string,
      endDate as string
    );
    res.status(200).json(report);
  } catch (error) {
    console.error("Error generating income statement:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const report = await generateBalanceSheet(date as string);
    res.status(200).json(report);
  } catch (error) {
    console.error("Error generating balance sheet:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCashFlowStatement = async (req: Request, res: Response) => {
  try {
    let { startDate, endDate } = req.query;

    // Default to the beginning and end of the current year if not specified
    if (!startDate) {
      startDate = new Date(new Date().getFullYear(), 0, 1).toISOString();
    }
    if (!endDate) {
      endDate = new Date(new Date().getFullYear(), 11, 31).toISOString();
    }

    const report = await generateCashFlowStatement(
      startDate as string,
      endDate as string
    );
    res.status(200).json(report);
  } catch (error) {
    console.error("Error generating cash flow statement:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getOperatingActivities = async (req: Request, res: Response) => {
  try {
    const transactions = await AppDataSource.getRepository(Transaction)
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.account", "account")
      .where("account.type = :type", { type: "EXPENSE" })
      .getMany();

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching operating activities:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getInvestingActivities = async (req: Request, res: Response) => {
  try {
    const transactions = await AppDataSource.getRepository(Transaction)
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.account", "account")
      .where("account.type = :type", { type: "ASSET" })
      .getMany();

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching investing activities:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getFinancingActivities = async (req: Request, res: Response) => {
  try {
    const transactions = await AppDataSource.getRepository(Transaction)
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.account", "account")
      .where("account.type = :type", { type: "LIABILITY" })
      .getMany();

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching financing activities:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
