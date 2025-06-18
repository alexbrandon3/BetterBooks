import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Transactions from 'pages/Transactions';
import { mockAccounts, mockTransactions } from './mocks';

jest.mock('axios');
const { mockAxiosInstance } = require('../__mocks__/axios');

describe('Transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance.get.mockImplementation((url) => {
      if (url === '/accounts') {
        return Promise.resolve({ data: mockAccounts });
      }
      if (url === '/transactions') {
        return Promise.resolve({ data: mockTransactions });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders transactions page', async () => {
    render(<Transactions />);
    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });
  });

  it('shows recurrence fields when making transaction recurring', async () => {
    render(<Transactions />);
    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    const recurringCheckbox = screen.getByLabelText('Make Recurring');
    userEvent.click(recurringCheckbox);

    expect(screen.getByLabelText('Recurrence Pattern')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
  });

  it('validates recurrence fields when making transaction recurring', async () => {
    render(<Transactions />);
    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    const recurringCheckbox = screen.getByLabelText('Make Recurring');
    userEvent.click(recurringCheckbox);

    const submitButton = screen.getByText('Add Transaction');
    userEvent.click(submitButton);

    expect(screen.getByText('Recurrence pattern is required')).toBeInTheDocument();
    expect(screen.getByText('End date is required')).toBeInTheDocument();
  });

  it('submits recurring transaction with all required fields', async () => {
    render(<Transactions />);
    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    const recurringCheckbox = screen.getByLabelText('Make Recurring');
    userEvent.click(recurringCheckbox);

    const amountInput = screen.getByLabelText('Amount');
    const descriptionInput = screen.getByLabelText('Description');
    const recurrencePatternSelect = screen.getByLabelText('Recurrence Pattern');
    const endDateInput = screen.getByLabelText('End Date');

    await userEvent.type(amountInput, '100');
    await userEvent.type(descriptionInput, 'Test Recurring');
    await userEvent.selectOptions(recurrencePatternSelect, 'monthly');
    await userEvent.type(endDateInput, '2024-12-31');

    const submitButton = screen.getByText('Add Transaction');
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/transactions', {
        amount: 100,
        description: 'Test Recurring',
        isRecurring: true,
        recurrencePattern: 'monthly',
        endDate: '2024-12-31'
      });
    });
  });
}); 