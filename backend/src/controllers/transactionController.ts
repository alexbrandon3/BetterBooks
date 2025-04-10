import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/authMiddleware';

const transactionRepository = AppDataSource.getRepository(Transaction);
const accountRepository = AppDataSource.getRepository(Account);

export const createTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId, description, type, amount, date, referenceNumber, notes } = req.body;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    // Verify account exists and belongs to user
    const account = await accountRepository.findOne({
      where: { id: accountId, user: { id: req.user.id } },
    });

    if (!account) {
      throw new AppError(404, 'Account not found');
    }

    const transaction = transactionRepository.create({
      description,
      type,
      amount,
      date: date || new Date(),
      referenceNumber,
      notes,
      account,
    });

    // Update account balance
    if (type === 'debit') {
      account.balance = Number(account.balance) + Number(amount);
    } else {
      account.balance = Number(account.balance) - Number(amount);
    }

    await accountRepository.save(account);
    await transactionRepository.save(transaction);

    res.status(201).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.query;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const where: any = { account: { user: { id: req.user.id } } };
    if (accountId) {
      where.account.id = accountId;
    }

    const transactions = await transactionRepository.find({
      where,
      relations: ['account'],
      order: { date: 'DESC' },
    });

    res.json({
      status: 'success',
      data: {
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const transaction = await transactionRepository.findOne({
      where: { id, account: { user: { id: req.user.id } } },
      relations: ['account'],
    });

    if (!transaction) {
      throw new AppError(404, 'Transaction not found');
    }

    res.json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { description, type, amount, date, referenceNumber, notes, isReconciled } = req.body;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const transaction = await transactionRepository.findOne({
      where: { id, account: { user: { id: req.user.id } } },
      relations: ['account'],
    });

    if (!transaction) {
      throw new AppError(404, 'Transaction not found');
    }

    // If amount or type changes, update account balance
    if (amount !== undefined || type !== undefined) {
      const oldAmount = transaction.amount;
      const oldType = transaction.type;
      const account = transaction.account;

      // Revert old transaction
      if (oldType === 'debit') {
        account.balance = Number(account.balance) - Number(oldAmount);
      } else {
        account.balance = Number(account.balance) + Number(oldAmount);
      }

      // Apply new transaction
      const newAmount = amount || oldAmount;
      const newType = type || oldType;

      if (newType === 'debit') {
        account.balance = Number(account.balance) + Number(newAmount);
      } else {
        account.balance = Number(account.balance) - Number(newAmount);
      }

      await accountRepository.save(account);
    }

    transaction.description = description || transaction.description;
    transaction.type = type || transaction.type;
    transaction.amount = amount || transaction.amount;
    transaction.date = date || transaction.date;
    transaction.referenceNumber = referenceNumber || transaction.referenceNumber;
    transaction.notes = notes || transaction.notes;
    transaction.isReconciled = isReconciled !== undefined ? isReconciled : transaction.isReconciled;

    await transactionRepository.save(transaction);

    res.json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError(401, 'Not authenticated');
    }

    const transaction = await transactionRepository.findOne({
      where: { id, account: { user: { id: req.user.id } } },
      relations: ['account'],
    });

    if (!transaction) {
      throw new AppError(404, 'Transaction not found');
    }

    // Update account balance
    const account = transaction.account;
    if (transaction.type === 'debit') {
      account.balance = Number(account.balance) - Number(transaction.amount);
    } else {
      account.balance = Number(account.balance) + Number(transaction.amount);
    }

    await accountRepository.save(account);
    await transactionRepository.remove(transaction);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
}; 