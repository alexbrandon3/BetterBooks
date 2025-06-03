// transaction.controller.ts

import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";
import { getUser } from "../utils/getUser";
import { AuthedRequest } from "../middleware/auth.middleware";

const transactionRepo = AppDataSource.getRepository(Transaction);
const accountRepo = AppDataSource.getRepository(Account);

// Transaction Controllers
export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await getUser(req);
    if (!user) {
      console.error("User not authorized");
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { amount, description, type, accountId } = req.body;

    // Validate input
    if (!amount || !description || !type || !accountId) {
      console.error("Missing required fields");
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Ensure the account belongs to the user
    const account = await accountRepo.findOne({
      where: {
        id: parseInt(accountId),
        user: { id: user.id },
      },
    });

    if (!account) {
      console.error("Account not found or does not belong to the user");
      res.status(404).json({ message: "Account not found" });
      return;
    }

    // Create the transaction
    const newTransaction = transactionRepo.create({
      amount,
      description,
      type,
      account,
    });

    await transactionRepo.save(newTransaction);

    // Respond with the transaction
    const responsePayload = {
      id: newTransaction.id,
      amount: newTransaction.amount,
      description: newTransaction.description,
      type: newTransaction.type,
      account: {
        id: account.id,
        name: account.name,
      },
    };

    res.status(201).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await getUser(req);
    if (!user) {
      console.error("User not authorized");
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    console.log(`Fetching transactions for User ID: ${user.id}`);

    const transactions = await transactionRepo.find({
      where: {
        account: {
          user: { id: user.id },
        },
      },
      relations: ["account"],
    });

    console.log(`Found ${transactions.length} transactions.`);

    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      description: transaction.description,
      type: transaction.type,
      account: {
        id: transaction.account.id,
        name: transaction.account.name,
      },
    }));

    res.status(200).json(formattedTransactions);
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    console.log("Transaction ID received from request:", id);

    const user = await getUser(req);
    if (!user) {
      console.error("User not authorized");
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    console.log("Authenticated User ID:", user.id);

    console.log("Fetching transaction from database...");
    const transaction = await transactionRepo.findOne({
      where: { id: parseInt(id) },
      relations: ["account", "account.user"],
    });

    if (!transaction) {
      console.error("Transaction not found in DB.");
      res.status(404).json({ message: "Transaction not found" });
      return;
    }
    console.log("Transaction found:", transaction);

    if (transaction.account.user.id !== user.id) {
      console.error("Transaction does not belong to this user");
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const responsePayload = {
      id: transaction.id,
      amount: transaction.amount,
      description: transaction.description,
      type: transaction.type,
      account: {
        id: transaction.account.id,
        name: transaction.account.name,
      },
    };

    console.log("Responding with transaction data:", responsePayload);
    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, description, type, accountId } = req.body;

    console.log("Transaction ID received for update:", id);

    const user = await getUser(req);
    if (!user) {
      console.error("User not authorized");
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    console.log("Authenticated User ID:", user.id);

    const transaction = await transactionRepo.findOne({
      where: { id: parseInt(id) },
      relations: ["account", "account.user"],
    });

    if (!transaction) {
      console.error("Transaction not found in DB.");
      res.status(404).json({ message: "Transaction not found" });
      return;
    }

    console.log("Transaction found:", transaction);

    if (transaction.account.user.id !== user.id) {
      console.error("Transaction does not belong to this user");
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    transaction.amount = amount ?? transaction.amount;
    transaction.description = description ?? transaction.description;
    transaction.type = type ?? transaction.type;

    if (accountId) {
      const newAccount = await accountRepo.findOne({
        where: { id: accountId },
        relations: ["user"],
      });

      if (!newAccount) {
        console.error("New account not found");
        res.status(404).json({ message: "Account not found" });
        return;
      }

      if (newAccount.user.id !== user.id) {
        console.error("New account does not belong to the user");
        res.status(403).json({ message: "Forbidden" });
        return;
      }

      transaction.account = newAccount;
    }

    await transactionRepo.save(transaction);
    console.log("Transaction updated successfully:", transaction);

    const responsePayload = {
      id: transaction.id,
      amount: transaction.amount,
      description: transaction.description,
      type: transaction.type,
      account: {
        id: transaction.account.id,
        name: transaction.account.name,
      },
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await transactionRepo.delete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const suggestAccount = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await getUser(req);
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { description } = req.body;

    if (!description || typeof description !== "string") {
      res.status(400).json({ message: "Invalid or missing description" });
      return;
    }

    const accountRepo = AppDataSource.getRepository(Account);
    const accounts = await accountRepo.find({ where: { user: { id: user.id } } });

    const lowerDesc = description.toLowerCase();

    const match = accounts.find(acc =>
      acc.name.toLowerCase().includes(lowerDesc) ||
      acc.category.toLowerCase().includes(lowerDesc) ||
      acc.subcategory.toLowerCase().includes(lowerDesc)
    );

    if (match) {
      res.json({
        suggestedAccountId: match.id,
        suggestedAccountName: match.name,
      });
    } else {
      res.status(404).json({ message: "No matching account found" });
    }
  } catch (error) {
    next(error);
  }
};