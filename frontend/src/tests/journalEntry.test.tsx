import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountsProvider } from '../contexts/AccountsContext';
import { LedgerProvider } from '../contexts/LedgerContext';
import { ManualJournalEntry } from '../components/ManualJournalEntry';
import { Account } from '../types/account';
import { JournalEntry } from '../types/ledger';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AccountsProvider>
      <LedgerProvider>
        {children}
      </LedgerProvider>
    </AccountsProvider>
  );
};

describe('Journal Entry Tests', () => {
  it('should create a valid journal entry and update account balances', async () => {
    render(
      <TestWrapper>
        <ManualJournalEntry />
      </TestWrapper>
    );

    // Fill in the journal entry form
    const dateInput = screen.getByLabelText('Date');
    fireEvent.change(dateInput, { target: { value: '2024-03-20' } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Transfer to savings' } });

    // Select Business Checking for debit
    const debitAccountSelect = screen.getAllByLabelText('Account')[0];
    fireEvent.change(debitAccountSelect, { target: { value: 'Business Checking' } });

    // Enter debit amount
    const debitAmountInput = screen.getAllByLabelText('Amount')[0];
    fireEvent.change(debitAmountInput, { target: { value: '1000' } });

    // Select Business Savings for credit
    const creditAccountSelect = screen.getAllByLabelText('Account')[1];
    fireEvent.change(creditAccountSelect, { target: { value: 'Business Savings' } });

    // Enter credit amount
    const creditAmountInput = screen.getAllByLabelText('Amount')[1];
    fireEvent.change(creditAmountInput, { target: { value: '1000' } });

    // Submit the form
    const submitButton = screen.getByText('Create Journal Entry');
    fireEvent.click(submitButton);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Journal entry created successfully!')).toBeInTheDocument();
    });

    // Verify account balances
    const { accounts } = useAccounts();
    const checkingAccount = accounts.find(acc => acc.name === 'Business Checking');
    const savingsAccount = accounts.find(acc => acc.name === 'Business Savings');

    expect(checkingAccount?.balance).toBe(9000); // 10000 - 1000
    expect(savingsAccount?.balance).toBe(51000); // 50000 + 1000
  });

  it('should validate unbalanced journal entries', async () => {
    render(
      <TestWrapper>
        <ManualJournalEntry />
      </TestWrapper>
    );

    // Fill in the journal entry form with unequal amounts
    const dateInput = screen.getByLabelText('Date');
    fireEvent.change(dateInput, { target: { value: '2024-03-20' } });

    const descriptionInput = screen.getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'Invalid transfer' } });

    // Select Business Checking for debit
    const debitAccountSelect = screen.getAllByLabelText('Account')[0];
    fireEvent.change(debitAccountSelect, { target: { value: 'Business Checking' } });

    // Enter debit amount
    const debitAmountInput = screen.getAllByLabelText('Amount')[0];
    fireEvent.change(debitAmountInput, { target: { value: '1000' } });

    // Select Business Savings for credit
    const creditAccountSelect = screen.getAllByLabelText('Account')[1];
    fireEvent.change(creditAccountSelect, { target: { value: 'Business Savings' } });

    // Enter different credit amount
    const creditAmountInput = screen.getAllByLabelText('Amount')[1];
    fireEvent.change(creditAmountInput, { target: { value: '2000' } });

    // Submit the form
    const submitButton = screen.getByText('Create Journal Entry');
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Debits and credits must balance')).toBeInTheDocument();
    });
  });
}); 