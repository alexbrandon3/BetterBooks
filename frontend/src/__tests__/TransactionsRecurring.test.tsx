import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import axios from '../utils/axios';
import RecurringTransactions from "../pages/RecurringTransactions";
import { MemoryRouter } from 'react-router-dom';
import { fireEvent } from '@testing-library/react';
import { toast } from 'react-hot-toast';

// Mock axios
jest.mock('../utils/axios');

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Helper to create a mock response
const createAxiosResponse = (data: any) => ({ data });

// Increase timeout for all tests
jest.setTimeout(10000);

describe('RecurringTransactions Component', () => {
  const mockAccounts = [
    { id: '1', name: 'Checking', type: 'BANK', category: 'ASSET', subcategory: 'CASH', financialCategory: 'ASSET', financialSubcategory: 'CASH' },
    { id: '2', name: 'Savings', type: 'BANK', category: 'ASSET', subcategory: 'CASH', financialCategory: 'ASSET', financialSubcategory: 'CASH' },
  ];

  const mockRecurringTransactions = [
    {
      id: 1,
      amount: 100,
      description: 'Test Recurring Transaction',
      recurrencePattern: 'monthly',
      account: {
        id: 1,
        name: 'Checking'
      },
    },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock axios.get for accounts and recurring transactions
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === '/accounts') {
        return Promise.resolve({ data: mockAccounts });
      }
      if (url === '/recurring-transactions') {
        return Promise.resolve({ data: mockRecurringTransactions });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock axios.post for creating recurring transactions
    (axios.post as jest.Mock).mockResolvedValue({ data: mockRecurringTransactions[0] });
    
    // Mock axios.delete for deleting recurring transactions
    (axios.delete as jest.Mock).mockResolvedValue({ data: {} });
  });

  describe('Initial Render', () => {
    it('loads accounts and recurring transactions on mount', async () => {
      await act(async () => {
        render(
          <MemoryRouter>
            <RecurringTransactions />
          </MemoryRouter>
        );
      });
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/accounts');
        expect(axios.get).toHaveBeenCalledWith('/recurring-transactions');
      });
    });

    it('renders account options correctly', async () => {
      await act(async () => {
        render(
          <MemoryRouter>
            <RecurringTransactions />
          </MemoryRouter>
        );
      });
      const accountSelect = await screen.findByDisplayValue('Select Account');
      const options = accountSelect.querySelectorAll('option');
      expect(options).toHaveLength(3); // Including "Select Account" option
      expect(accountSelect).toHaveTextContent('Checking');
      expect(accountSelect).toHaveTextContent('Savings');
    });

    it('renders table headers correctly', async () => {
      await act(async () => {
        render(
          <MemoryRouter>
            <RecurringTransactions />
          </MemoryRouter>
        );
      });
      
      // Wait for the table to be rendered
      await waitFor(() => {
        expect(screen.getByRole('columnheader', { name: /date/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /amount/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /account/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
      });
    });
  });

  describe('Form Functionality', () => {
    it('creates a new recurring transaction successfully', async () => {
      await act(async () => {
        render(
          <MemoryRouter>
            <RecurringTransactions />
          </MemoryRouter>
        );
      });
      
      // Wait for loading to complete and form to be available
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      // Wait for form elements to be available
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument();
      });
      
      // Fill in the form
      await userEvent.type(screen.getByPlaceholderText('Amount'), '100');
      await userEvent.type(screen.getByPlaceholderText('Description'), 'Test Transaction');
      await userEvent.selectOptions(screen.getByDisplayValue('Monthly'), 'monthly');
      await userEvent.selectOptions(screen.getByDisplayValue('Select Account'), '1');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create recurring transaction/i });
      await userEvent.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/recurring-transactions', {
          amount: 100,
          description: 'Test Transaction',
          recurrencePattern: 'monthly',
          accountId: '1',
        });
      });

      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith('Recurring transaction created successfully!');
    });
  });
});
