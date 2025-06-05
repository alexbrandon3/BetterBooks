import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import axios from '../utils/axios';
import Transactions from "../pages/Transactions";
import { MemoryRouter } from 'react-router-dom';
import { fireEvent } from '@testing-library/react';

// Mock axios
jest.mock('../utils/axios');

// Helper to create a mock response
const createAxiosResponse = (data: any) => ({ data });

// Increase timeout for all tests
jest.setTimeout(10000);

describe('Transactions Recurring Functionality', () => {
  const mockAccounts = [
    { id: '1', name: 'Checking', type: 'BANK', category: 'ASSET', subcategory: 'CASH', financialCategory: 'ASSET', financialSubcategory: 'CASH' },
    { id: '2', name: 'Savings', type: 'BANK', category: 'ASSET', subcategory: 'CASH', financialCategory: 'ASSET', financialSubcategory: 'CASH' },
  ];

  const mockTransactions = [
    {
      id: '1',
      amount: 100,
      type: 'EXPENSE',
      description: 'Test Recurring Transaction',
      accountId: '1',
      date: '2025-06-05',
      isRecurring: true,
      recurrencePattern: 'MONTHLY',
      endDate: '2025-12-31',
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock axios.get for accounts and transactions
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === '/accounts') {
        return Promise.resolve({ data: mockAccounts });
      }
      if (url === '/transactions') {
        return Promise.resolve({ data: mockTransactions });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock axios.post for creating transactions
    (axios.post as jest.Mock).mockResolvedValue({ data: mockTransactions[0] });
  });

  describe('Initial Render', () => {
    it('loads accounts and transactions on mount', async () => {
      await act(async () => {
        render(
          <MemoryRouter>
            <Transactions />
          </MemoryRouter>
        );
      });
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/accounts');
        expect(axios.get).toHaveBeenCalledWith('/transactions');
      });
    });

    it('renders account options correctly', async () => {
      await act(async () => {
        render(
          <MemoryRouter>
            <Transactions />
          </MemoryRouter>
        );
      });
      const accountSelect = await screen.findByLabelText('Account *');
      const options = accountSelect.querySelectorAll('option');
      expect(options).toHaveLength(3);
      expect(accountSelect).toHaveTextContent('Checking');
      expect(accountSelect).toHaveTextContent('Savings');
    });

    it('initially hides recurrence fields', async () => {
      await act(async () => {
        render(
          <MemoryRouter>
            <Transactions />
          </MemoryRouter>
        );
      });
      expect(screen.queryByLabelText('Recurrence Pattern *')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('End Date (Optional)')).not.toBeInTheDocument();
    });
  });

  describe('Toggle Visibility', () => {
    it('renders recurrence fields only when "Make Recurring" checkbox is checked', async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );
      // Wait for initial data to load
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/accounts');
        expect(axios.get).toHaveBeenCalledWith('/transactions');
      });
      // Wait for loading to complete and accounts to be rendered
      await waitFor(() => {
        const accountSelect = screen.getByLabelText(/account/i);
        const options = accountSelect.querySelectorAll('option');
        expect(options).toHaveLength(3);
        expect(accountSelect).toHaveTextContent('Checking');
        expect(accountSelect).toHaveTextContent('Savings');
      });
      // Initially, recurrence fields should not be visible
      expect(screen.queryByLabelText(/recurrence pattern/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/end date/i)).not.toBeInTheDocument();
      // Enable recurring transaction
      const recurringCheckbox = screen.getByLabelText(/make recurring/i);
      await userEvent.click(recurringCheckbox);
      // Wait for recurrence fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/recurrence pattern/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('shows error if recurrence pattern is not selected when "Make Recurring" is enabled', async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );
      // Fill in required fields
      await userEvent.type(screen.getByLabelText('Amount *'), '100');
      await userEvent.selectOptions(screen.getByLabelText('Type *'), 'EXPENSE');
      await userEvent.type(screen.getByLabelText('Description *'), 'Test Transaction');
      await userEvent.selectOptions(screen.getByLabelText('Account *'), '1');
      await userEvent.type(screen.getByLabelText('Date *'), '2025-06-05');

      // Check "Make Recurring" checkbox
      await userEvent.click(screen.getByLabelText('Make Recurring'));

      // Submit form without selecting recurrence pattern
      const submitButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(submitButton);

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText('Recurrence pattern is required for recurring transactions')).toBeInTheDocument();
      });
    });

    it('creates a new recurring transaction successfully', async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );
      // Fill in required fields
      await userEvent.type(screen.getByLabelText('Amount *'), '100');
      await userEvent.selectOptions(screen.getByLabelText('Type *'), 'EXPENSE');
      await userEvent.type(screen.getByLabelText('Description *'), 'Test Transaction');
      await userEvent.selectOptions(screen.getByLabelText('Account *'), '1');
      await userEvent.type(screen.getByLabelText('Date *'), '2025-06-05');

      // Check "Make Recurring" checkbox
      await userEvent.click(screen.getByLabelText('Make Recurring'));

      // Fill in recurrence fields
      await userEvent.selectOptions(screen.getByLabelText('Recurrence Pattern *'), 'MONTHLY');
      await userEvent.type(screen.getByLabelText('End Date (Optional)'), '2025-12-31');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/recurring-transactions', {
          amount: 100,
          type: 'EXPENSE',
          description: 'Test Transaction',
          accountId: '1',
          startDate: '2025-06-05',
          recurrencePattern: 'MONTHLY',
          endDate: '2025-12-31'
        });
      });

      // Verify success message
      expect(screen.getByText('Recurring transaction created successfully!')).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );
      // Mock API error
      (axios.post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      // Fill in required fields
      await userEvent.type(screen.getByLabelText('Amount *'), '100');
      await userEvent.selectOptions(screen.getByLabelText('Type *'), 'EXPENSE');
      await userEvent.type(screen.getByLabelText('Description *'), 'Test Transaction');
      await userEvent.selectOptions(screen.getByLabelText('Account *'), '1');
      await userEvent.type(screen.getByLabelText('Date *'), '2025-06-05');

      // Check "Make Recurring" checkbox
      await userEvent.click(screen.getByLabelText('Make Recurring'));

      // Fill in recurrence fields
      await userEvent.selectOptions(screen.getByLabelText('Recurrence Pattern *'), 'MONTHLY');
      await userEvent.type(screen.getByLabelText('End Date (Optional)'), '2025-12-31');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(submitButton);

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText('Failed to save transaction. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Transaction List', () => {
    it('displays recurring transactions in a table', async () => {
      render(
        <MemoryRouter>
          <Transactions />
        </MemoryRouter>
      );

      // Wait for transactions to load
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/transactions');
      });

      // Verify table headers
      expect(screen.getByRole('columnheader', { name: /date/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /amount/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /account/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

      // Verify transaction data
      await waitFor(() => {
        expect(screen.getByText('Test Recurring Transaction')).toBeInTheDocument();
        expect(screen.getByText('$100.00')).toBeInTheDocument();
        expect(screen.getByText('Checking')).toBeInTheDocument();
      });
    });
  });
});
