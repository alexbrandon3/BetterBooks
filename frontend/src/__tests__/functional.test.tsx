import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import authReducer from '../store/slices/authSlice';
import businessReducer from '../store/slices/businessSlice';
import accountsReducer from '../store/slices/accountsSlice';
import transactionsReducer from '../store/slices/transactionsSlice';

// Mock API calls
jest.mock('../api/auth', () => ({
  register: jest.fn().mockResolvedValue({ token: 'mock-token' }),
  login: jest.fn().mockResolvedValue({ token: 'mock-token' }),
}));

jest.mock('../api/business', () => ({
  createBusiness: jest.fn().mockResolvedValue({ id: 'mock-business-id' }),
  getBusiness: jest.fn().mockResolvedValue({
    id: 'mock-business-id',
    name: 'GreenSpace Lawn Care',
    entityType: 'LLC',
    industry: 'Landscaping',
    fiscalYearStart: '01-01',
  }),
}));

jest.mock('../api/accounts', () => ({
  createAccount: jest.fn().mockResolvedValue({ id: 'mock-account-id' }),
  getAccounts: jest.fn().mockResolvedValue([]),
}));

jest.mock('../api/transactions', () => ({
  createTransaction: jest.fn().mockResolvedValue({ id: 'mock-transaction-id' }),
  getTransactions: jest.fn().mockResolvedValue([]),
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      business: businessReducer,
      accounts: accountsReducer,
      transactions: transactionsReducer,
    },
  });
};

describe('BetterBooks Functional Test Suite', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    );
  });

  describe('Step 1: Account Creation & Login', () => {
    it('should create a new user account', async () => {
      // Navigate to register page
      fireEvent.click(screen.getByText(/register/i));

      // Fill registration form
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Jamie Dawson' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'jamie@greenspace.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Test123!' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'Test123!' },
      });

      // Submit form
      fireEvent.click(screen.getByText(/create account/i));

      // Verify redirect to dashboard
      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });
    });

    it('should login with created account', async () => {
      // Fill login form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'jamie@greenspace.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Test123!' },
      });

      // Submit form
      fireEvent.click(screen.getByText(/login/i));

      // Verify redirect to dashboard
      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Business Onboarding', () => {
    it('should complete business setup', async () => {
      // Navigate to business setup
      fireEvent.click(screen.getByText(/setup/i));

      // Fill business form
      fireEvent.change(screen.getByLabelText(/business name/i), {
        target: { value: 'GreenSpace Lawn Care' },
      });
      fireEvent.change(screen.getByLabelText(/entity type/i), {
        target: { value: 'LLC' },
      });
      fireEvent.change(screen.getByLabelText(/industry/i), {
        target: { value: 'Landscaping' },
      });
      fireEvent.change(screen.getByLabelText(/fiscal year start/i), {
        target: { value: '01-01' },
      });

      // Submit form
      fireEvent.click(screen.getByText(/save/i));

      // Verify redirect to asset setup
      await waitFor(() => {
        expect(screen.getByText(/asset setup/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Asset Setup', () => {
    it('should create initial assets and generate correct journal entries', async () => {
      // Add business checking
      fireEvent.change(screen.getByLabelText(/account name/i), {
        target: { value: 'Business Checking' },
      });
      fireEvent.change(screen.getByLabelText(/amount/i), {
        target: { value: '5000' },
      });
      fireEvent.click(screen.getByText(/add account/i));

      // Add vehicle
      fireEvent.change(screen.getByLabelText(/account name/i), {
        target: { value: 'Vehicle' },
      });
      fireEvent.change(screen.getByLabelText(/amount/i), {
        target: { value: '12000' },
      });
      fireEvent.click(screen.getByText(/add account/i));

      // Add equipment
      fireEvent.change(screen.getByLabelText(/account name/i), {
        target: { value: 'Equipment' },
      });
      fireEvent.change(screen.getByLabelText(/amount/i), {
        target: { value: '3000' },
      });
      fireEvent.click(screen.getByText(/add account/i));

      // Verify journal entries
      await waitFor(() => {
        expect(screen.getByText(/journal entries/i)).toBeInTheDocument();
        expect(screen.getByText(/dr: business checking \$5,000/i)).toBeInTheDocument();
        expect(screen.getByText(/dr: vehicle \$12,000/i)).toBeInTheDocument();
        expect(screen.getByText(/dr: equipment \$3,000/i)).toBeInTheDocument();
        expect(screen.getByText(/cr: owner's equity \$20,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 4: Chart of Accounts Review', () => {
    it('should display and allow editing of chart of accounts', async () => {
      // Navigate to chart of accounts
      fireEvent.click(screen.getByText(/chart of accounts/i));

      // Verify default accounts
      expect(screen.getByText(/business checking/i)).toBeInTheDocument();
      expect(screen.getByText(/vehicle/i)).toBeInTheDocument();
      expect(screen.getByText(/equipment/i)).toBeInTheDocument();
      expect(screen.getByText(/owner's equity/i)).toBeInTheDocument();

      // Edit account name
      const fuelAccount = screen.getByText(/fuel/i);
      fireEvent.click(fuelAccount);
      fireEvent.change(screen.getByDisplayValue(/fuel/i), {
        target: { value: 'Truck Fuel' },
      });
      fireEvent.click(screen.getByText(/save/i));

      // Verify change
      expect(screen.getByText(/truck fuel/i)).toBeInTheDocument();
    });
  });

  describe('Step 5: Transactions', () => {
    it('should record and classify transactions correctly', async () => {
      // Navigate to transactions
      fireEvent.click(screen.getByText(/transactions/i));

      // Add fuel expense
      fireEvent.click(screen.getByText(/new transaction/i));
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Paid to Shell' },
      });
      fireEvent.change(screen.getByLabelText(/amount/i), {
        target: { value: '150' },
      });
      fireEvent.change(screen.getByLabelText(/account/i), {
        target: { value: 'Business Checking' },
      });
      fireEvent.change(screen.getByLabelText(/category/i), {
        target: { value: 'Truck Fuel' },
      });
      fireEvent.click(screen.getByText(/save/i));

      // Add service revenue
      fireEvent.click(screen.getByText(/new transaction/i));
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'HOA client payment' },
      });
      fireEvent.change(screen.getByLabelText(/amount/i), {
        target: { value: '1200' },
      });
      fireEvent.change(screen.getByLabelText(/account/i), {
        target: { value: 'Business Checking' },
      });
      fireEvent.change(screen.getByLabelText(/category/i), {
        target: { value: 'Service Revenue' },
      });
      fireEvent.click(screen.getByText(/save/i));

      // Verify transactions
      await waitFor(() => {
        expect(screen.getByText(/paid to shell/i)).toBeInTheDocument();
        expect(screen.getByText(/hoa client payment/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 6: Financial Statements', () => {
    it('should generate accurate financial statements', async () => {
      // Navigate to financial statements
      fireEvent.click(screen.getByText(/financial statements/i));

      // Generate balance sheet
      fireEvent.click(screen.getByText(/generate balance sheet/i));
      await waitFor(() => {
        expect(screen.getByText(/balance sheet/i)).toBeInTheDocument();
        expect(screen.getByText(/cash: \$5,550/i)).toBeInTheDocument();
      });

      // Generate income statement
      fireEvent.click(screen.getByText(/generate income statement/i));
      await waitFor(() => {
        expect(screen.getByText(/income statement/i)).toBeInTheDocument();
        expect(screen.getByText(/revenue: \$1,200/i)).toBeInTheDocument();
        expect(screen.getByText(/expenses: \$150/i)).toBeInTheDocument();
        expect(screen.getByText(/net income: \$1,050/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 7: Ledger & Audit Trail', () => {
    it('should display transaction history and audit trail', async () => {
      // Navigate to audit trail
      fireEvent.click(screen.getByText(/audit trail/i));

      // Filter for fuel expense
      fireEvent.change(screen.getByLabelText(/filter/i), {
        target: { value: 'Truck Fuel' },
      });

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText(/paid to shell/i)).toBeInTheDocument();
        expect(screen.getByText(/\$150/i)).toBeInTheDocument();
      });

      // Verify audit trail details
      const transaction = screen.getByText(/paid to shell/i);
      fireEvent.click(transaction);
      await waitFor(() => {
        expect(screen.getByText(/journal entry/i)).toBeInTheDocument();
        expect(screen.getByText(/timestamp/i)).toBeInTheDocument();
        expect(screen.getByText(/user: jamie dawson/i)).toBeInTheDocument();
      });
    });
  });
}); 