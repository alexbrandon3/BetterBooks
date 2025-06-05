import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios, { AxiosRequestConfig } from 'axios';
import { useNavigate } from 'react-router-dom';
import TransactionsRecurringEdit from "../pages/TransactionsRecurringEdit";
import '@testing-library/jest-dom';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();

describe('TransactionsRecurringEdit Component', () => {
  const mockAccounts = [
    { id: '1', name: 'Checking' },
    { id: '2', name: 'Savings' },
  ];

  const mockTransaction = {
    id: '1',
    amount: 100,
    type: 'EXPENSE',
    description: 'Test Transaction',
    accountId: '1',
    startDate: '2025-06-05',
    isRecurring: true,
    recurrencePattern: 'MONTHLY',
    endDate: '2025-12-31',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockAxios.get.mockImplementation((url) => {
      if (url === '/accounts') {
        return Promise.resolve({ data: mockAccounts });
      }
      if (url === '/recurring-transactions/1') {
        return Promise.resolve({ data: mockTransaction });
      }
      return Promise.reject(new Error('Not found'));
    });
    mockAxios.put.mockImplementation((url: string, data?: unknown, config?: AxiosRequestConfig) => {
      if (url === '/recurring-transactions/1') {
        return Promise.resolve({ data: { ...(data as object), id: '1' } });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/recurring-transactions/edit/1']}>
        <Routes>
          <Route path="/recurring-transactions/edit/:id" element={<TransactionsRecurringEdit />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Initial Render', () => {
    it('loads accounts and transaction data on mount', async () => {
      renderComponent();
      
      // Wait for form fields to be populated
      await waitFor(() => {
        expect(screen.getByLabelText(/amount/i)).toHaveValue(100);
        expect(screen.getByLabelText(/description/i)).toHaveValue('Test Transaction');
        expect(screen.getByLabelText(/start date/i)).toHaveValue('2025-06-05');
        expect(screen.getByLabelText(/end date/i)).toHaveValue('2025-12-31');
      });

      // Verify account options are loaded
      const accountSelect = screen.getByLabelText(/account \*/i);
      expect(accountSelect).toHaveValue('1');
      expect(screen.getByText('Checking')).toBeInTheDocument();
      expect(screen.getByText('Savings')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('updates recurring transaction successfully', async () => {
      mockAxios.put.mockResolvedValueOnce({ data: { ...mockTransaction, amount: 150 } });

      renderComponent();

      // Wait for form to be populated
      await waitFor(() => {
        expect(screen.getByLabelText(/amount/i)).toHaveValue(100);
      });

      // Update amount
      await userEvent.clear(screen.getByLabelText(/amount/i));
      await userEvent.type(screen.getByLabelText(/amount/i), '150');

      // Update account selection
      const accountSelect = screen.getByLabelText(/account \*/i) || screen.getByRole('combobox', { name: /account/i });
      fireEvent.change(accountSelect, { target: { value: '1' } });

      // Set date
      const dateInput = screen.getByLabelText(/Start Date/i);
      fireEvent.change(dateInput, { target: { value: '2025-06-05' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /update/i }));

      // Verify API call
      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith(
          '/recurring-transactions/1',
          expect.objectContaining({
            amount: 150,
            type: 'EXPENSE',
            description: 'Test Transaction',
            accountId: '1',
            date: '2025-06-05',
            isRecurring: true,
            recurrencePattern: 'MONTHLY',
            endDate: '2025-12-31'
          })
        );
      });

      // Verify navigation
      expect(mockNavigate).toHaveBeenCalledWith('/transactions');
    });

    it('handles API errors gracefully', async () => {
      mockAxios.put.mockRejectedValueOnce(new Error('Failed to update'));

      renderComponent();

      // Wait for form to be populated
      await waitFor(() => {
        expect(screen.getByLabelText(/amount/i)).toHaveValue(100);
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /update/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/failed to update recurring transaction/i)).toBeInTheDocument();
      });
    });

    it('submits the updated recurring transaction', async () => {
      mockAxios.put.mockResolvedValueOnce({ data: { ...mockTransaction, amount: 1200, description: 'Updated Monthly Rent' } });

      renderComponent();

      // Wait for form to be populated
      await waitFor(() => {
        expect(screen.getByLabelText(/amount/i)).toHaveValue(100);
      });

      // Update amount
      await userEvent.clear(screen.getByLabelText(/amount/i));
      await userEvent.type(screen.getByLabelText(/amount/i), '1200');
      await userEvent.clear(screen.getByLabelText(/description/i));
      await userEvent.type(screen.getByLabelText(/description/i), 'Updated Monthly Rent');
      await userEvent.selectOptions(screen.getByLabelText(/recurrence pattern/i), 'MONTHLY');

      // Update account selection
      const accountSelect = screen.getByLabelText(/account \*/i) || screen.getByRole('combobox', { name: /account/i });
      fireEvent.change(accountSelect, { target: { value: '1' } });

      // Set date
      const dateInput = screen.getByLabelText(/Start Date/i);
      fireEvent.change(dateInput, { target: { value: '2025-06-05' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /update/i }));

      // Verify API call
      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith(
          '/recurring-transactions/1',
          expect.objectContaining({
            amount: 1200,
            type: 'EXPENSE',
            description: 'Updated Monthly Rent',
            accountId: '1',
            date: '2025-06-05',
            isRecurring: true,
            recurrencePattern: 'MONTHLY',
            endDate: '2025-12-31'
          })
        );
      });

      // Verify navigation
      expect(mockNavigate).toHaveBeenCalledWith('/transactions');
    });

    it('handles API errors gracefully', async () => {
      mockAxios.put.mockRejectedValueOnce(new Error('Failed to update'));

      renderComponent();

      // Wait for form to be populated
      await waitFor(() => {
        expect(screen.getByLabelText(/amount/i)).toHaveValue(100);
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /update/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/failed to update recurring transaction/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('resets form when cancel is clicked', async () => {
      renderComponent();

      // Wait for form to be populated
      await waitFor(() => {
        expect(screen.getByLabelText(/amount/i)).toHaveValue(100);
      });

      // Click cancel button
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Verify navigation
      expect(mockNavigate).toHaveBeenCalledWith('/transactions');
    });
  });
}); 