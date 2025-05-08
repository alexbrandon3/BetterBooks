// transaction.controller.ts

import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";

const transactionRepo = AppDataSource.getRepository(Transaction);

// Transaction Controllers
export const createTransaction = async (req: Request, res: Response) => {
  const { amount, description, type, accountId } = req.body;
  const account = await AppDataSource.getRepository(Account).findOneBy({
    id: accountId,
  });
  if (!account) return res.status(404).send("Account not found");

  const transaction = new Transaction();
  transaction.amount = amount;
  transaction.description = description;
  transaction.type = type;
  transaction.account = account;

  await transactionRepo.save(transaction);
  res.status(201).send(transaction);
};

export const getTransactions = async (req: Request, res: Response) => {
  const transactions = await transactionRepo.find({ relations: ["account"] });
  res.send(transactions);
};

export const deleteTransaction = async (req: Request, res: Response) => {
  const { id } = req.params;
  await transactionRepo.delete(id);
  res.status(204).send();
};
