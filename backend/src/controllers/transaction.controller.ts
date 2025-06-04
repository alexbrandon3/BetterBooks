// transaction.controller.ts

import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";
import { getUser } from "../utils/getUser";
import { AuthedRequest } from "../middleware/auth.middleware";
import { NotFoundError, AuthenticationError, AuthorizationError } from "../utils/errors";

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
      throw new AuthenticationError();
    }

    const { amount, description, type, accountId } = req.body;

    // Ensure the account belongs to the user
    const account = await accountRepo.findOne({
      where: {
        id: parseInt(accountId),
        user: { id: user.id },
      },
    });

    if (!account) {
      throw new NotFoundError("Account not found");
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
      throw new AuthenticationError();
    }

    const transactions = await transactionRepo.find({
      where: {
        account: {
          user: { id: user.id },
        },
      },
      relations: ["account"],
    });

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
    const user = await getUser(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const transaction = await transactionRepo.findOne({
      where: { id: parseInt(id) },
      relations: ["account", "account.user"],
    });

    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    if (transaction.account.user.id !== user.id) {
      throw new AuthorizationError("Transaction does not belong to this user");
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

    const user = await getUser(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const transaction = await transactionRepo.findOne({
      where: { id: parseInt(id) },
      relations: ["account", "account.user"],
    });

    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    if (transaction.account.user.id !== user.id) {
      throw new AuthorizationError("Transaction does not belong to this user");
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
        throw new NotFoundError("Account not found");
      }

      if (newAccount.user.id !== user.id) {
        throw new AuthorizationError("Account does not belong to this user");
      }

      transaction.account = newAccount;
    }

    await transactionRepo.save(transaction);

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
    const user = await getUser(req);
    if (!user) {
      throw new AuthenticationError();
    }

    const transaction = await transactionRepo.findOne({
      where: { id: parseInt(id) },
      relations: ["account", "account.user"],
    });

    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    if (transaction.account.user.id !== user.id) {
      throw new AuthorizationError("Transaction does not belong to this user");
    }

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
      throw new AuthenticationError();
    }

    const { description } = req.body;

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
      throw new NotFoundError("No matching account found");
    }
  } catch (error) {
    next(error);
  }
};