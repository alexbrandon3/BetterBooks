// transaction.controller.ts

import { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";
import { getUser } from "../utils/getUser";

const transactionRepo = AppDataSource.getRepository(Transaction);
const accountRepo = AppDataSource.getRepository(Account);

// Transaction Controllers
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    if (!user) {
      console.error("User not authorized");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { amount, description, type, accountId } = req.body;

    // Validate input
    if (!amount || !description || !type || !accountId) {
      console.error("Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
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
      return res.status(404).json({ message: "Account not found" });
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
    console.error("Error in createTransaction:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    // ✅ Get the authenticated user
    const user = await getUser(req);
    if (!user) {
      console.error("User not authorized");
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log(`Fetching transactions for User ID: ${user.id}`);

    // ✅ Fetch all transactions directly, joining with accounts
    const transactions = await transactionRepo.find({
      where: {
        account: {
          user: { id: user.id },
        },
      },
      relations: ["account"],
    });

    console.log(`Found ${transactions.length} transactions.`);

    // ✅ Format the response
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
  } catch (error: any) {
    console.error("Error in getTransactions:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("Transaction ID received from request:", id);

    // ✅ Get the authenticated user
    const user = await getUser(req);
    if (!user) {
      console.error("User not authorized");
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log("Authenticated User ID:", user.id);

    // ✅ Find the transaction and its account, including the user
    console.log("Fetching transaction from database...");
    const transaction = await transactionRepo.findOne({
      where: { id: parseInt(id) },
      relations: ["account", "account.user"],
    });

    if (!transaction) {
      console.error("Transaction not found in DB.");
      return res.status(404).json({ message: "Transaction not found" });
    }
    console.log("Transaction found:", transaction);

    // ✅ Verify ownership
    if (transaction.account.user.id !== user.id) {
      console.error("Transaction does not belong to this user");
      return res.status(403).json({ message: "Forbidden" });
    }

    // ✅ Send back the clean response
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
  } catch (error: any) {
    console.error("Error in getTransactionById:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, description, type, accountId } = req.body;

    console.log("Transaction ID received for update:", id);

    // ✅ Get the authenticated user
    const user = await getUser(req);
    if (!user) {
      console.error("User not authorized");
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log("Authenticated User ID:", user.id);

    // ✅ Find the transaction
    const transaction = await transactionRepo.findOne({
      where: { id: parseInt(id) },
      relations: ["account", "account.user"],
    });

    if (!transaction) {
      console.error("Transaction not found in DB.");
      return res.status(404).json({ message: "Transaction not found" });
    }

    console.log("Transaction found:", transaction);

    // ✅ Verify ownership
    if (transaction.account.user.id !== user.id) {
      console.error("Transaction does not belong to this user");
      return res.status(403).json({ message: "Forbidden" });
    }

    // ✅ Update fields
    transaction.amount = amount ?? transaction.amount;
    transaction.description = description ?? transaction.description;
    transaction.type = type ?? transaction.type;

    // ✅ If account ID is provided, we update the account
    if (accountId) {
      const newAccount = await accountRepo.findOne({
        where: { id: accountId },
        relations: ["user"],
      });

      if (!newAccount) {
        console.error("New account not found");
        return res.status(404).json({ message: "Account not found" });
      }

      if (newAccount.user.id !== user.id) {
        console.error("New account does not belong to the user");
        return res.status(403).json({ message: "Forbidden" });
      }

      transaction.account = newAccount;
    }

    // ✅ Save the updated transaction
    await transactionRepo.save(transaction);
    console.log("Transaction updated successfully:", transaction);

    // ✅ Return the updated transaction
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
  } catch (error: any) {
    console.error("Error in updateTransaction:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  const { id } = req.params;
  await transactionRepo.delete(id);
  res.status(204).send();
};
