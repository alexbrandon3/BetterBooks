import { AppDataSource } from "../config/data-source";
import { Transaction, TransactionType } from "../entities/Transaction";

const transactionRepo = AppDataSource.getRepository(Transaction);

export const calculateTotals = async () => {
  const income = await transactionRepo.find({
    where: { type: TransactionType.INCOME },
  });
  const expenses = await transactionRepo.find({
    where: { type: TransactionType.EXPENSE },
  });

  const incomeTotal = income.reduce((sum, tx) => sum + tx.amount, 0);
  const expenseTotal = expenses.reduce((sum, tx) => sum + tx.amount, 0);

  return { incomeTotal, expenseTotal };
};
