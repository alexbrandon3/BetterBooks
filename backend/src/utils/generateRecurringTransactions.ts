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
    // Stop recurrence if end date has passed
    if (recurrence.endDate && now > recurrence.endDate) {
      recurrence.isActive = false;
      await recurringRepo.save(recurrence);
      continue;
    }

    const newTransaction = transactionRepo.create({
      description: recurrence.description,
      amount: Number(recurrence.amount), // ✅ Make sure amount is a number
      type: recurrence.type as TransactionType,
      reference: recurrence.reference ?? '',
      account: recurrence.account,
      user: recurrence.user,
      recurringTransaction: recurrence,
      isRecurring: true,
      recurrence: recurrence.recurrence,
      recurrencePattern: recurrence.recurrence,
      interval: recurrence.interval ?? 1, // ✅ Safe default fallback
      nextOccurrence: recurrence.nextRun,
      isActive: true,
      date: recurrence.nextRun, // ✅ Add the transaction date
    });

    await transactionRepo.save(newTransaction);

    // Calculate the next run date
    const next = new Date(recurrence.nextRun);
    const interval = recurrence.interval ?? 1; // ✅ Safe fallback

    switch (recurrence.recurrence) {
      case 'Daily':
        next.setDate(next.getDate() + interval);
        break;
      case 'Weekly':
        next.setDate(next.getDate() + 7 * interval);
        break;
      case 'Biweekly':
        next.setDate(next.getDate() + 14 * interval);
        break;
      case 'Monthly':
        next.setMonth(next.getMonth() + interval);
        break;
      case 'Yearly':
        next.setFullYear(next.getFullYear() + interval);
        break;
      default:
        console.warn(`Unknown recurrence pattern: ${recurrence.recurrence}`);
        break;
    }

    recurrence.nextRun = next;
    await recurringRepo.save(recurrence);
  }
};
