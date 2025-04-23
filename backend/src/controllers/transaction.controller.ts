// src/controllers/transaction.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { RecurringTransaction } from '../entities/RecurringTransaction';

const transactionRepo = AppDataSource.getRepository(Transaction);
const accountRepo = AppDataSource.getRepository(Account);
const recurringRepo = AppDataSource.getRepository(RecurringTransaction);

// GET all transactions for the logged-in user
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const transactions = await transactionRepo.find({
      where: { user: { id: userId } },
      relations: ['account', 'recurringTransaction'],
      order: { createdAt: 'DESC' },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
};

// POST new transaction
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { description, amount, type, reference, accountId, recurrence } = req.body;
    const userId = (req as any).user.id;

    // Fetch the account, ensuring it belongs to the current user
    const account = await accountRepo.findOne({
      where: {
        id: accountId,
        user: { id: userId },
      },
      relations: ['user'],
    });

    if (!account) {
      return res.status(403).json({ message: 'Not authorized to access this account or account not found' });
    }

    // Create the transaction
    const transaction = transactionRepo.create({
      description,
      amount,
      type,
      reference,
      account,
      user: account.user,
    });

    await transactionRepo.save(transaction);

    // Optional: handle recurring transaction details
    if (recurrence) {
      const recurring = recurringRepo.create({
        description,
        amount,
        type,
        reference,
        recurrence: recurrence.recurrence, // ← THIS was missing
        frequency: recurrence.frequency,
        interval: recurrence.interval,
        nextRun: recurrence.nextRun,
        startDate: new Date(),
        account,
        user: account.user,
        transaction,
      });
    
      await recurringRepo.save(recurring);
    }

    res.status(201).json({ message: 'Transaction created successfully', transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Error creating transaction', error });
  }
};


// PUT update a transaction
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { description, amount, type, reference } = req.body;

    const transaction = await transactionRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!transaction || transaction.user.id !== userId) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }

    transaction.description = description;
    transaction.amount = amount;
    transaction.type = type;
    transaction.reference = reference;

    await transactionRepo.save(transaction);
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error updating transaction', error });
  }
};

// DELETE a transaction
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const transaction = await transactionRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!transaction || transaction.user.id !== userId) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }

    await transactionRepo.remove(transaction);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error });
  }
};

export const getTransactionsByAccountId = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { accountId } = req.params;

    const transactions = await transactionRepo.find({
      where: {
        account: { id: accountId },
        user: { id: userId }
      },
      relations: ['account', 'recurringTransaction'],
      order: { createdAt: 'DESC' }
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions for account', error });
  }
};
