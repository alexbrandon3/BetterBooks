import { Account } from '../types/account';
import { JournalEntry, JournalEntryInput, JournalEntryValidationResult } from '../types/journalEntry';
import { useAccounts } from '../contexts/AccountsContext';

export const validateJournalEntry = (
  input: JournalEntryInput,
  accounts: Account[]
): JournalEntryValidationResult => {
  // Validate required fields
  if (!input.date) {
    return { status: 'error', message: 'Transaction date is required' };
  }
  if (!input.description) {
    return { status: 'error', message: 'Description is required' };
  }
  if (!input.debits?.length || !input.credits?.length) {
    return { status: 'error', message: 'At least one debit and one credit are required' };
  }

  // Calculate totals
  const debitTotal = input.debits.reduce((sum, line) => sum + line.amount, 0);
  const creditTotal = input.credits.reduce((sum, line) => sum + line.amount, 0);

  // Validate balance
  if (Math.abs(debitTotal - creditTotal) > 0.01) { // Allow for small floating point differences
    return {
      status: 'error',
      message: `Debits and credits must total the same amount. Debits: $${debitTotal.toFixed(2)} | Credits: $${creditTotal.toFixed(2)}`
    };
  }

  // Validate accounts exist
  const allAccountNames = input.debits.map(d => d.account).concat(input.credits.map(c => c.account));
  const missingAccounts = allAccountNames.filter(name => 
    !accounts.some(account => account.name === name)
  );

  if (missingAccounts.length > 0) {
    return {
      status: 'error',
      message: `The following accounts do not exist: ${missingAccounts.join(', ')}`
    };
  }

  return {
    status: 'valid',
    total: debitTotal
  };
};

export const formatJournalEntry = (
  input: JournalEntryInput,
  accounts: Account[],
  validationResult: JournalEntryValidationResult
): JournalEntry => {
  const timestamp = new Date().toISOString();
  const id = `JE-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

  const findAccount = (name: string) => accounts.find(account => account.name === name)!;

  return {
    id,
    date: input.date,
    description: input.description,
    debits: input.debits.map(line => ({
      account: findAccount(line.account),
      amount: line.amount
    })),
    credits: input.credits.map(line => ({
      account: findAccount(line.account),
      amount: line.amount
    })),
    total: validationResult.total || 0,
    status: validationResult.status,
    errorMessage: validationResult.message,
    attachment: input.attachment,
    tags: input.tags,
    timestamp
  };
};

export const formatJournalEntryForDisplay = (entry: JournalEntry): string => {
  const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;
  const formatLine = (line: { account: Account; amount: number }) => 
    `${line.account.name}: ${formatAmount(line.amount)}`;

  const lines = [
    `Date: ${entry.date}`,
    `Description: ${entry.description}`,
    'Debits:',
    ...entry.debits.map(line => `  ${formatLine(line)}`),
    'Credits:',
    ...entry.credits.map(line => `  ${formatLine(line)}`),
    `Total: ${formatAmount(entry.total)}`,
    `Status: ${entry.status.toUpperCase()}`
  ];

  if (entry.errorMessage) {
    lines.push(`Error: ${entry.errorMessage}`);
  }

  if (entry.tags?.length) {
    lines.push(`Tags: ${entry.tags.join(', ')}`);
  }

  return lines.join('\n');
}; 