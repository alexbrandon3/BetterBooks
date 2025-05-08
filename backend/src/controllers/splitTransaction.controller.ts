// splitTransaction.controller.ts

import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { SplitTransaction } from "../entities/SplitTransaction";
import { Transaction } from "../entities/Transaction";

const splitRepo = AppDataSource.getRepository(SplitTransaction);

// Split Transaction Controllers
export const createSplitTransaction = async (req: Request, res: Response) => {
  const { amount, description, transactionId } = req.body;
  const transaction = await AppDataSource.getRepository(Transaction).findOneBy({
    id: transactionId,
  });
  if (!transaction) return res.status(404).send("Transaction not found");

  const splitTransaction = new SplitTransaction();
  splitTransaction.amount = amount;
  splitTransaction.description = description;
  splitTransaction.transaction = transaction;

  await splitRepo.save(splitTransaction);
  res.status(201).send(splitTransaction);
};

export const getSplitTransactions = async (req: Request, res: Response) => {
  const splitTransactions = await splitRepo.find({
    relations: ["transaction"],
  });
  res.send(splitTransactions);
};

export const deleteSplitTransaction = async (req: Request, res: Response) => {
  const { id } = req.params;
  await splitRepo.delete(id);
  res.status(204).send();
};
