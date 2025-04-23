// src/controllers/report.controller.ts

import { Response } from 'express';
import { AppDataSource } from '../data-source';
import { Transaction, TransactionType } from '../entities/Transaction';
import { AuthedRequest } from '../middleware/auth';

export const getIncomeStatement = async (req: AuthedRequest, res: Response) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  const transactionRepo = AppDataSource.getRepository(Transaction);

  const transactions = await transactionRepo
    .createQueryBuilder('transaction')
    .where('transaction.userId = :userId', { userId })
    .andWhere(startDate ? 'transaction.createdAt >= :startDate' : '1=1', { startDate })
    .andWhere(endDate ? 'transaction.createdAt <= :endDate' : '1=1', { endDate })
    .getMany();

  const income = transactions.filter(t => t.type === TransactionType.INCOME);
  const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);

  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const netIncome = totalIncome - totalExpenses;

  return res.json({
    totalIncome,
    totalExpenses,
    netIncome,
    startDate: startDate || 'Beginning',
    endDate: endDate || 'Now',
  });
};
