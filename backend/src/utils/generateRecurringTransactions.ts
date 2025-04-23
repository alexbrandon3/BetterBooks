// src/utils/generateRecurringTransactions.ts
import { AppDataSource } from '../data-source';
import { RecurringTransaction } from '../entities/RecurringTransaction';
import { Transaction, TransactionType } from '../entities/Transaction';
import { LessThanOrEqual } from 'typeorm';

export const generateRecurringTransactions = async () => {
  const recurringRepo = AppDataSource.getRepository(RecurringTransaction);
  const transactionRepo = AppDataSource.getRepository(Transaction);

  const now = new Date();

  const dueRecurrences = await recurringRepo.find({
    where: { nextRun: LessThanOrEqual(now), isActive: true },
    relations: ['account', 'user'],
  });

  for (const recurrence of dueRecurrences) {
    // Stop recurrence if the end date has passed
    if (recurrence.endDate && now > recurrence.endDate) {
      recurrence.isActive = false;
      await recurringRepo.save(recurrence);
      continue;
    }

    const newTransaction = new Transaction();
    newTransaction.description = recurrence.description;
    newTransaction.amount = recurrence.amount;
    newTransaction.type = recurrence.type as TransactionType;
    newTransaction.reference = recurrence.reference ?? '';
    newTransaction.account = recurrence.account;
    newTransaction.user = recurrence.user;
    newTransaction.recurringTransaction = recurrence;
    newTransaction.isRecurring = true;
    newTransaction.recurrence = recurrence.recurrence;
    newTransaction.recurrencePattern = recurrence.recurrence;
    newTransaction.interval = recurrence.recurrence.toLowerCase() as 'daily' | 'weekly' | 'monthly' | 'yearly';
    newTransaction.nextOccurrence = recurrence.nextRun;
    newTransaction.isActive = true;

    await transactionRepo.save(newTransaction);

    const next = new Date(recurrence.nextRun);
    switch (recurrence.recurrence) {
      case 'Daily':
        next.setDate(next.getDate() + recurrence.interval);
        break;
      case 'Weekly':
        next.setDate(next.getDate() + 7 * recurrence.interval);
        break;
      case 'Biweekly':
        next.setDate(next.getDate() + 14 * recurrence.interval);
        break;
      case 'Monthly':
        next.setMonth(next.getMonth() + recurrence.interval);
        break;
      case 'Yearly':
        next.setFullYear(next.getFullYear() + recurrence.interval);
        break;
    }

    recurrence.nextRun = next;
    await recurringRepo.save(recurrence);
  }
};
