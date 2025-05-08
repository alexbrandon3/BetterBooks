// src/utils/recurringProcessor.ts
import { AppDataSource } from '../data-source';
import { RecurringTransaction } from '../entities/RecurringTransaction';
import { Transaction } from '../entities/Transaction';
import { LessThanOrEqual } from 'typeorm';

export const generateRecurringTransactions = async () => {
  const recurringRepo = AppDataSource.getRepository(RecurringTransaction);
  const transactionRepo = AppDataSource.getRepository(Transaction);

  const now = new Date();

  const dueRecurrings = await recurringRepo.find({
    where: { nextRun: LessThanOrEqual(now) },
    relations: ['transaction', 'transaction.account', 'transaction.user'],
  });

  for (const recurring of dueRecurrings) {
    const base = recurring.transaction;

    const newTransaction = transactionRepo.create({
      description: base.description,
      amount: base.amount,
      type: base.type,
      reference: base.reference,
      account: base.account,
      user: base.user,
    });

    await transactionRepo.save(newTransaction);

    // Update nextRun based on frequency and interval
    const nextDate = new Date(recurring.nextRun);
    switch (recurring.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + recurring.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7 * recurring.interval);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + recurring.interval);
        break;
    }

    recurring.nextRun = nextDate;
    await recurringRepo.save(recurring);
  }
};
