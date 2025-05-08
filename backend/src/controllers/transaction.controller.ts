import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { SplitTransaction } from "../entities/SplitTransaction";
import { getUser } from "../utils/getUser";
import { Between } from "typeorm";

const transactionRepo = AppDataSource.getRepository(Transaction);
const accountRepo = AppDataSource.getRepository(Account);
const recurringRepo = AppDataSource.getRepository(RecurringTransaction);
const splitRepo = AppDataSource.getRepository(SplitTransaction);

type SplitEntry = {
  amount: number;
  accountId: string;
};

// ➡️ Create Transaction Logic
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
      frequency = 1, // ✅ Defaulting to 1 if not provided
      splits,
    } = req.body;

    // ➡️ Validate Required Fields
    if (!description || !type || !date) {
      return res.status(400).json({
        message: "Description, Type, and Date are required fields.",
      });
    }

    // ➡️ Initialize Transaction
    const transaction = transactionRepo.create({
      description,
      type,
      date: new Date(date),
      user,
      amount: 0,
    });

    // ➡️ If Account ID is present, attach it to the transaction
    if (accountId) {
      const account = await accountRepo.findOneBy({ id: accountId });
      if (!account) {
        return res.status(404).json({ message: "Account not found." });
      }
      transaction.account = account;
    }

    // ➡️ Calculate the Total Amount
    if (splits && splits.length > 0) {
      const splitSum = splits.reduce(
        (acc: number, split: SplitEntry) => acc + Number(split.amount),
        0
      );
      transaction.amount = splitSum;
    }

    // ➡️ Handle Recurring Transactions
    if (isRecurring) {
      if (!recurrence || !interval) {
        return res.status(400).json({
          message:
            "Recurring transactions require a recurrence type and interval.",
        });
      }

      const recurring = recurringRepo.create({
        description,
        amount: transaction.amount,
        type,
        user,
        recurrence,
        interval,
        frequency, // ✅ Setting the frequency here
        startDate: new Date(date),
        endDate: endDate ? new Date(endDate) : undefined,
        nextRun: new Date(date),
        account: transaction.account,
      });

      transaction.recurringTransaction = await recurringRepo.save(recurring);
    }

    // ➡️ Save the Main Transaction
    await transactionRepo.save(transaction);

    // ➡️ Handle Splits
    if (splits && splits.length > 0) {
      const splitEntities = await Promise.all(
        splits.map(async (entry: SplitEntry) => {
          const account = await accountRepo.findOneBy({ id: entry.accountId });

          if (!account) {
            throw new Error(`Account with ID ${entry.accountId} not found.`);
          }

          return splitRepo.create({
            transaction,
            account,
            amount: Number(entry.amount),
          });
        })
      );

      await splitRepo.save(splitEntities);
    }

    // ➡️ Fetch and Return the Complete Transaction
    const savedTransaction = await transactionRepo.findOne({
      where: { id: transaction.id },
      relations: [
        "account",
        "recurringTransaction",
        "splits",
        "splits.account",
      ],
    });

    return res.status(201).json(savedTransaction);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Error creating transaction:", error.message);

      if (error.message.includes("not found")) {
        return res.status(404).json({
          message: error.message,
        });
      }

      return res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    } else {
      console.error("❌ Unknown error occurred during transaction creation.");
      return res.status(500).json({ message: "An unknown error occurred." });
    }
  }
};

// ➡️ Get Transactions Logic
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const { startDate, endDate, type, accountId } = req.query;

    const queryOptions: any = {
      where: { user: { id: user.id } },
      relations: [
        "account",
        "recurringTransaction",
        "splits",
        "splits.account",
      ],
      order: { date: "DESC" },
    };

    if (startDate && endDate) {
      queryOptions.where.date = Between(
        new Date(startDate as string),
        new Date(endDate as string)
      );
    }

    if (type) {
      queryOptions.where.type = type;
    }

    if (accountId) {
      queryOptions.where.account = { id: accountId };
    }

    const transactions = await transactionRepo.find(queryOptions);

    const formattedTransactions = transactions.map((transaction) => {
      const formattedSplits = transaction.splits.map((split) => ({
        id: split.id,
        amount: parseFloat(split.amount as any).toFixed(2),
        account: {
          id: split.account.id,
          name: split.account.name,
        },
      }));

      return {
        id: transaction.id,
        description: transaction.description,
        amount: parseFloat(transaction.amount as any).toFixed(2),
        type: transaction.type,
        date: transaction.date,
        account: transaction.account
          ? {
              id: transaction.account.id,
              name: transaction.account.name,
            }
          : null,
        recurringTransaction: transaction.recurringTransaction ?? null,
        splits: formattedSplits,
      };
    });

    console.log("🚀 Successfully fetched transactions:", formattedTransactions);

    return res.status(200).json(formattedTransactions);
  } catch (error) {
    // 🔍 Safe Error Handling
    if (error instanceof Error) {
      console.error("❌ Error fetching transactions:", error.message);
      return res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
      });
    } else {
      console.error("❌ Unknown Error:", error);
      return res.status(500).json({
        message: "Internal Server Error",
        error: "Unknown error occurred",
      });
    }
  }
};

// ➡️ Get Transaction by ID Logic
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = getUser(req);

    const transactions = await transactionRepo.find({
      where: {
        user: { id: user.id },
      },
      relations: [
        "account",
        "recurringTransaction",
        "splits",
        "splits.account",
      ],
      order: { date: "DESC" },
    });

    console.log("🚀 Fetched Transactions:", transactions);

    const formattedTransactions = transactions.map((transaction: any) => ({
      ...transaction,
      amount:
        typeof transaction.amount === "number"
          ? transaction.amount.toFixed(2)
          : Number(transaction.amount || 0).toFixed(2), // ✅ Safely parse, fallback to 0
      splits: transaction.splits.map((split: any) => ({
        ...split,
        amount:
          typeof split.amount === "number"
            ? split.amount.toFixed(2)
            : Number(split.amount || 0).toFixed(2), // ✅ Safely parse, fallback to 0
      })),
    }));

    return res.status(200).json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transaction by ID:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

// ➡️ Update Transaction Logic
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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

    const transaction = await transactionRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ["recurringTransaction", "splits"],
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Update core properties
    transaction.description = description ?? transaction.description;
    transaction.type = type ?? transaction.type;
    transaction.date = date ? new Date(date) : transaction.date;

    if (accountId) {
      transaction.account = await accountRepo.findOneByOrFail({
        id: accountId,
      });
    }

    if (isRecurring) {
      const recurring =
        transaction.recurringTransaction ?? recurringRepo.create();
      recurring.user = user;
      recurring.recurrence = recurrence;
      recurring.interval = interval;
      recurring.frequency = frequency;
      recurring.startDate = new Date(date);
      recurring.endDate = endDate ? new Date(endDate) : undefined;
      recurring.nextRun = new Date(date);

      transaction.recurringTransaction = await recurringRepo.save(recurring);
    }

    if (splits && splits.length > 0) {
      await splitRepo.delete({ transaction: { id: transaction.id } });

      const splitEntities = await Promise.all(
        splits.map(async (entry: SplitEntry) => {
          const account = await accountRepo.findOneByOrFail({
            id: entry.accountId,
          });
          return splitRepo.create({
            transaction,
            account,
            amount: Number(entry.amount),
          });
        })
      );
      await splitRepo.save(splitEntities);
    }

    transaction.amount = splits
      ? splits.reduce(
          (acc: number, split: SplitEntry) => acc + Number(split.amount),
          0
        )
      : transaction.amount;

    await transactionRepo.save(transaction);

    const updatedTransaction = await transactionRepo.findOne({
      where: { id: transaction.id },
      relations: [
        "account",
        "recurringTransaction",
        "splits",
        "splits.account",
      ],
    });

    return res.status(200).json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

// ➡️ Delete Transaction Logic
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = getUser(req);

    const transaction = await transactionRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ["splits", "recurringTransaction"],
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.splits.length > 0) {
      await splitRepo.delete({ transaction: { id: transaction.id } });
    }

    if (transaction.recurringTransaction) {
      await recurringRepo.delete({ id: transaction.recurringTransaction.id });
    }

    await transactionRepo.remove(transaction);

    return res
      .status(200)
      .json({ message: "Transaction deleted successfully." });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
