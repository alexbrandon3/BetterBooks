import { AppDataSource } from '../data-source';
import { Transaction } from '../entities/Transaction';
import { Between } from 'typeorm';
import { TransactionType } from '../entities/Transaction';

export const generateIncomeStatement = async (userId: string, startDate: Date, endDate: Date) => {
  const transactionRepo = AppDataSource.getRepository(Transaction);

  const transactions = await transactionRepo.find({
    where: {
      user: { id: userId },
      createdAt: Between(startDate, endDate),
      isActive: true,
    },
  });

  const revenue = transactions
    .filter(tx => tx.type === TransactionType.INCOME)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const expenses = transactions
    .filter(tx => tx.type === TransactionType.EXPENSE)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const netIncome = revenue - expenses;

  return {
    startDate,
    endDate,
    revenue,
    expenses,
    netIncome,
  };
};
