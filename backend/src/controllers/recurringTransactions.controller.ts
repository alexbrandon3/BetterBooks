// recurringTransactions.controller.ts

import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { Account } from "../entities/Account";

const recurringRepo = AppDataSource.getRepository(RecurringTransaction);

// Recurring Transaction Controllers
export const createRecurringTransaction = async (
  req: Request,
  res: Response
) => {
  const { amount, description, recurrencePattern, accountId } = req.body;
  const account = await AppDataSource.getRepository(Account).findOneBy({
    id: accountId,
  });
  if (!account) return res.status(404).send("Account not found");

  const recurringTransaction = new RecurringTransaction();
  recurringTransaction.amount = amount;
  recurringTransaction.description = description;
  recurringTransaction.recurrencePattern = recurrencePattern;
  recurringTransaction.account = account;

  await recurringRepo.save(recurringTransaction);
  res.status(201).send(recurringTransaction);
};

export const getRecurringTransactions = async (req: Request, res: Response) => {
  const recurringTransactions = await recurringRepo.find({
    relations: ["account"],
  });
  res.send(recurringTransactions);
};

export const deleteRecurringTransaction = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  await recurringRepo.delete(id);
  res.status(204).send();
};
