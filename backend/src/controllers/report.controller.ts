// report.controller.ts

import { Request, Response } from "express";
import {
  generateIncomeStatement,
  generateBalanceSheet,
  generateCashFlowStatement,
} from "../services/report.service";

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
    const { startDate, endDate } = req.query;
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
