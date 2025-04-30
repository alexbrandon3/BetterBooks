// src/controllers/recurring.controller.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { RecurringTransaction } from '../entities/RecurringTransaction';

export const previewRecurringTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const repo = AppDataSource.getRepository(RecurringTransaction);

    const previews = await repo.find({
      where: {
        user: { id: userId },
        isActive: true,
      },
      order: { nextRun: 'ASC' },
      take: 5,
      relations: ['account'],
    });

    res.json(previews);
  } catch (err) {
    console.error('[previewRecurringTransactions]', err);
    res.status(500).json({ message: 'Failed to fetch preview' });
  }
};
