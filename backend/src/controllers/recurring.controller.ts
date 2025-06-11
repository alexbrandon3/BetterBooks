import { Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { RecurringTransaction } from '../entities/RecurringTransaction';
import { AuthenticatedRequest } from '../types/express';

export const getRecurringTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only fetch recurring transactions for the authenticated user, including required relations
    const recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
    const transactions = await recurringTransactionRepo.find({
      where: { user: { id: req.user.id } },
      relations: ['account'],
      order: { nextRun: 'ASC' }
    });
    return res.json(transactions);
  } catch (error) {
    console.error('❌ Error in getRecurringTransactions:');
    console.error('Error object:', error);
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('User ID:', req.user?.id);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}; 