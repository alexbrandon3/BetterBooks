import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { getSmartSuggestion } from "../services/smartSuggestions.service";
import { getUser } from "../utils/getUser";
import { SplitTransaction } from "../entities/SplitTransaction";

const transactionRepo = AppDataSource.getRepository(Transaction);
const accountRepo = AppDataSource.getRepository(Account);
const recurringRepo = AppDataSource.getRepository(RecurringTransaction);

const updateAccountBalance = async (
  accountId: string,
  amount: number,
  side: "DEBIT" | "CREDIT"
) => {
  const account = await accountRepo.findOne({ where: { id: accountId } });
  if (!account) throw new Error(`Account not found for ID: ${accountId}`);

  if (account.type === "ASSET") {
    account.balance =
      side === "DEBIT"
        ? Number(account.balance) + amount
        : Number(account.balance) - amount;
  } else if (account.type === "LIABILITY" || account.type === "EQUITY") {
    account.balance =
      side === "CREDIT"
        ? Number(account.balance) + amount
        : Number(account.balance) - amount;
  } else {
    throw new Error(`Unknown account type: ${account.type}`);
  }

  await accountRepo.save(account);
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const {
      description,
      amount,
      type,
      accountId,
      date,
      isRecurring,
      recurrenceRule,
      recurrence,
      interval,
      recurrencePattern,
      reference,
      entries,
    } = req.body;

    let transaction;
    if (type === "TRANSFER") {
      if (!entries || entries.length !== 2) {
        return res.status(400).json({
          message: "TRANSFER transactions must include exactly two entries",
        });
      }

      transaction = transactionRepo.create({
        description,
        type,
        date: date ? new Date(date) : new Date(),
        account: { id: accountId },
        user,
        isRecurring,
        recurrenceRule,
        recurrence,
        interval,
        recurrencePattern,
        reference,
      });

      transaction.entries = entries.map((entry: any) => {
        if (entry.amount == null || !entry.accountId) {
          throw new Error("Each entry must have amount and accountId");
        }
        const split = new SplitTransaction();
        split.amount = entry.amount;
        split.account = { id: entry.accountId };
        split.user = user;
        split.transaction = transaction;
        return split;
      });
    } else {
      transaction = transactionRepo.create({
        description,
        amount,
        type,
        date: date ? new Date(date) : new Date(),
        account: { id: accountId },
        user,
        isRecurring,
        recurrenceRule,
        recurrence,
        interval,
        recurrencePattern,
        reference,
      });
    }

    const saved = await transactionRepo.save(transaction);

    if (type === "TRANSFER") {
      for (const entry of saved.entries) {
        await updateAccountBalance(entry.account.id, entry.amount, type);
      }
    } else {
      await updateAccountBalance(accountId, amount, type);
    }

    const suggestedAccount = await getSmartSuggestion(description, user.id);

    if (saved.entries) {
      for (const entry of saved.entries) {
        delete entry.transaction; // remove circular reference
      }
    }

    return res.status(201).json({
      transaction: saved,
      suggestedAccountId: suggestedAccount?.id || null,
    });
  } catch (err) {
    console.error("❌ Error creating transaction:", err);
    return res.status(500).json({
      message: "Failed to create transaction",
      error: err instanceof Error ? err.message : err,
    });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const transactions = await transactionRepo.find({
      where: { user: { id: user.id } },
      relations: ["account", "recurringTransaction", "entries"],
      order: { createdAt: "DESC" },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions", error });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const { id } = req.params;
    const { description, amount, type, reference } = req.body;

    const transaction = await transactionRepo.findOneBy({ id });
    if (!transaction || transaction.user.id !== user.id) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    transaction.description = description ?? transaction.description;
    transaction.amount = amount ?? transaction.amount;
    transaction.type = type ?? transaction.type;
    transaction.reference = reference ?? transaction.reference;

    const updated = await transactionRepo.save(transaction);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating transaction", error });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const { id } = req.params;

    const transaction = await transactionRepo.findOneBy({ id });
    if (!transaction || transaction.user.id !== user.id) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await transactionRepo.remove(transaction);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting transaction", error });
  }
};

export const getTransactionsByAccountId = async (
  req: Request,
  res: Response
) => {
  try {
    const user = getUser(req);
    const { accountId } = req.params;

    const transactions = await transactionRepo.find({
      where: {
        account: { id: accountId },
        user: { id: user.id },
      },
      relations: ["account", "entries"],
    });

    res.json(transactions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching transactions by account", error });
  }
};
