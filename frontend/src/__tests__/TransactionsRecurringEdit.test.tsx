import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Transactions from '../pages/Transactions';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Helper to create a mock response
const createAxiosResponse = (data: any) => ({ data });

// Mock recurring transaction data
const mockRecurringTransaction = {
  id: '123',
  amount: 100,
  type: 'EXPENSE' as const,
  description: 'Monthly Rent',
  accountId: '1',
  account: { id: '1', name: 'Checking' },
  startDate: '2024-03-20',
  recurrencePattern: 'MONTHLY' as const,
  endDate: '2024-12-31'
};

describe('Recurring Transaction Editing', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock GET requests
    mockAxios.get.mockImplementation((url) => {
      if (url === '/accounts') {
        return Promise.resolve(createAxiosResponse([
          { id: '1', name: 'Checking' },
          { id: '2', name: 'Savings' }
        ]));
      }
      if (url === '/transactions') {
        return Promise.resolve(createAxiosResponse([mockRecurringTransaction]));
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock PUT request for recurring transactions
    mockAxios.put.mockImplementation((url) => {
      if (url === '/recurring-transactions/123') {
        return Promise.resolve(createAxiosResponse({ id: '123' }));
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  describe('Form Population', () => {
    it('populates form when Edit button is clicked', async () => {
      render(<Transactions />);

      // Wait for transactions to load
      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith('/transactions');
      });

      // Click edit button for the recurring transaction
      const editButton = screen.getByTestId('edit-transaction-123');
      await userEvent.click(editButton);

      // Assert form title
      expect(screen.getByText('Edit Recurring Transaction')).toBeInTheDocument();

      // Assert form fields are populated
      expect(screen.getByLabelText(/amount/i)).toHaveValue('100');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Monthly Rent');
      expect(screen.getByLabelText(/account/i)).toHaveValue('1');
      expect(screen.getByLabelText(/date/i)).toHaveValue('2024-03-20');
      expect(screen.getByLabelText(/recurrence pattern/i)).toHaveValue('MONTHLY');
      expect(screen.getByLabelText(/end date/i)).toHaveValue('2024-12-31');
      expect(screen.getByLabelText(/make recurring/i)).toBeChecked();
    });
  });

  describe('Form Submission', () => {
    it('submits updated values correctly', async () => {
      render(<Transactions />);

      // Wait for transactions to load
      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith('/transactions');
      });

      // Click edit button
      const editButton = screen.getByTestId('edit-transaction-123');
      await userEvent.click(editButton);

      // Update form values
      await userEvent.clear(screen.getByLabelText(/amount/i));
      await userEvent.type(screen.getByLabelText(/amount/i), '1200');
      await userEvent.clear(screen.getByLabelText(/description/i));
      await userEvent.type(screen.getByLabelText(/description/i), 'Updated Monthly Rent');
      await userEvent.clear(screen.getByLabelText(/end date/i));
      await userEvent.type(screen.getByLabelText(/end date/i), '2025-12-31');

      // Submit form
      await userEvent.click(screen.getByRole('button', { name: /update/i }));

      // Assert PUT request was made with updated data
      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith('/recurring-transactions/123', {
          amount: 1200,
          type: 'EXPENSE',
          description: 'Updated Monthly Rent',
          accountId: '1',
          startDate: '2024-03-20',
          recurrencePattern: 'MONTHLY',
          endDate: '2025-12-31'
        });
      });

      // Assert success message
      expect(await screen.findByText('Recurring transaction updated successfully!')).toBeInTheDocument();
    });
  });

  describe('Cancel Edit', () => {
    it('resets form when cancel is clicked', async () => {
      render(<Transactions />);

      // Wait for transactions to load
      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith('/transactions');
      });

      // Click edit button
      const editButton = screen.getByTestId('edit-transaction-123');
      await userEvent.click(editButton);

      // Verify we're in edit mode
      expect(screen.getByText('Edit Recurring Transaction')).toBeInTheDocument();

      // Click cancel button
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Assert form is reset
      expect(screen.getByText('Add New Transaction')).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/make recurring/i)).not.toBeChecked();

      // Assert no PUT request was made
      expect(mockAxios.put).not.toHaveBeenCalled();
    });
  });
}); 