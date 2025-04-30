import { AppDataSource } from '../data-source';
import { Transaction } from '../entities/Transaction';
import { LessThanOrEqual, Not } from 'typeorm';

export const processRecurringTransactions = async () => {
  const transactionRepo = AppDataSource.getRepository(Transaction);

  const recurringTransactions = await transactionRepo.find({
    where: {
      recurrence: Not(''),
      nextOccurrence: LessThanOrEqual(new Date()),
      isActive: true
    }
  });

  for (const transaction of recurringTransactions) {
    const newTransaction = transactionRepo.create({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      reference: transaction.reference,
      account: transaction.account,
      user: transaction.user,
      isActive: true
    });

    await transactionRepo.save(newTransaction);

    const next = calculateNextDate(transaction.nextOccurrence, transaction.recurrence);
    transaction.nextOccurrence = next;
    await transactionRepo.save(transaction);
  }

  console.log(`[Recurring Service] Processed ${recurringTransactions.length} transaction(s).`);
};

function calculateNextDate(current: Date, recurrence: string): Date {
  const next = new Date(current);
  switch (recurrence) {
    case 'Daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'Weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'Monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'Yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}