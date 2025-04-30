import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Transaction } from '../entities/Transaction';
import { Account } from '../entities/Account';
import { RecurringTransaction } from '../entities/RecurringTransaction';
import { getSmartSuggestion } from '../services/smartSuggestions.service';
import { getUser } from '../utils/getUser';

const transactionRepo = AppDataSource.getRepository(Transaction);
const accountRepo = AppDataSource.getRepository(Account);
const recurringRepo = AppDataSource.getRepository(RecurringTransaction);

// GET all transactions for the logged-in user
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const transactions = await transactionRepo.find({
      where: { user: { id: user.id } },
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
    } = req.body;

    const transaction = transactionRepo.create({
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
    });

    const saved = await transactionRepo.save(transaction);

    const suggestedAccount = await getSmartSuggestion(description, user.id);

    console.log('Smart suggestion result:', suggestedAccount);

    return res.status(201).json({
      transaction: saved,
      suggestedAccountId: suggestedAccount?.id || null,
    });
  } catch (err) {
    console.error('Error creating transaction:', err);
    return res.status(500).json({ message: 'Failed to create transaction' });
  }
};

// PUT update a transaction
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const { id } = req.params;
    const { description, amount, type, reference } = req.body;

    const transaction = await transactionRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!transaction || transaction.user.id !== user.id) {
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
    const user = getUser(req);
    const { id } = req.params;

    const transaction = await transactionRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!transaction || transaction.user.id !== user.id) {
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
    const user = getUser(req);
    const { accountId } = req.params;

    const transactions = await transactionRepo.find({
      where: {
        account: { id: accountId },
        user: { id: user.id }
      },
      relations: ['account', 'recurringTransaction'],
      order: { createdAt: 'DESC' }
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions for account', error });
  }
};
