import { Response, Request } from 'express';
import { AppDataSource } from '../data-source';
import { Transaction, TransactionType } from '../entities/Transaction';
import { getUser } from '../utils/getUser';

const transactionRepo = AppDataSource.getRepository(Transaction);

// GET /reports/income-statement
export const getIncomeStatement = async (req: Request, res: Response) => {
  try {
    const user = getUser(req);
    const { startDate, endDate } = req.query;

    const query = transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId: user.id })
      .andWhere('transaction.type IN (:...types)', { types: ['INCOME', 'EXPENSE'] });

    if (startDate) {
      query.andWhere('transaction.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('transaction.createdAt <= :endDate', { endDate });
    }

    const transactions = await query.getMany();

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      if (tx.type === TransactionType.INCOME) totalIncome += Number(tx.amount);
      else if (tx.type === TransactionType.EXPENSE) totalExpenses += Number(tx.amount);
    }

    const netIncome = totalIncome - totalExpenses;

    return res.json({
      totalIncome,
      totalExpenses,
      netIncome,
      startDate: startDate || 'Beginning',
      endDate: endDate || 'Today',
    });
  } catch (err) {
    console.error('Error generating income statement:', err);
    return res.status(500).json({ message: 'Failed to generate income statement', err });
  }
};
