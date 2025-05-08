export type RecurrencePattern = 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | 'Yearly';

/**
 * Returns the next occurrence of a recurring transaction based on its pattern.
 * @param currentDate Date of the last occurrence
 * @param pattern Recurrence pattern (Daily, Weekly, Biweekly, Monthly, Yearly)
 * @returns Date of the next occurrence
 */
export function getNextOccurrence(currentDate: Date, pattern: RecurrencePattern): Date {
  const nextDate = new Date(currentDate);

  switch (pattern) {
    case 'Daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'Weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'Biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'Monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'Yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      throw new Error(`Invalid recurrence pattern: ${pattern}`);
  }

  return nextDate;
}