import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { SplitTransaction } from "../entities/SplitTransaction";
import { getUser } from "../utils/getUser";
import { getSmartSuggestion } from "../services/smartSuggestions.service";

const transactionRepo = AppDataSource.getRepository(Transaction);
const accountRepo = AppDataSource.getRepository(Account);
const recurringRepo = AppDataSource.getRepository(RecurringTransaction);
const splitRepo = AppDataSource.getRepository(SplitTransaction);

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const {
      description,
      type,
      accountId,
      date,
      isRecurring,
      recurrence,
      interval,
      endDate,
      frequency,
      splits,
    } = req.body;

    const transaction = new Transaction();
    transaction.description = description;
    transaction.type = type;
    transaction.date = new Date(date);
    transaction.user = user;

    if (accountId) {
      const account = await accountRepo.findOneByOrFail({ id: accountId });
      transaction.account = account;
    }

    if (isRecurring) {
      const recurring = new RecurringTransaction();
      recurring.user = user;
      recurring.recurrence = recurrence;
      recurring.interval = interval;
      recurring.frequency = frequency;
      recurring.startDate = new Date(date);
      recurring.endDate = endDate ? new Date(endDate) : undefined;
      recurring.nextRun = new Date(date);
      transaction.recurringTransaction = recurring;
      await recurringRepo.save(recurring);
    }

    await transactionRepo.save(transaction);

    for (const entry of splits) {
      const split = new SplitTransaction();
      split.transaction = transaction;
      split.amount = entry.amount;

      const account = await accountRepo.findOneByOrFail({
        id: entry.accountId,
      });
      split.account = account;

      await splitRepo.save(split);

      if (entry.transaction) delete entry.transaction;
    }

    return res.status(201).json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
