import React, { createContext, useContext, useState, useEffect } from 'react';
import { Account } from '../types/account';
import { accountService } from '../services/accountService';

interface AccountsContextType {
  accounts: Account[];
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const CHART_OF_ACCOUNTS = {
  assets: {
    cash: 'Cash & Checking',
    savings: 'Savings',
    accounts_receivable: 'Accounts Receivable',
    inventory: 'Inventory',
    prepaid_expenses: 'Prepaid Expenses',
    vehicles: 'Vehicles',
    equipment: 'Equipment',
    furniture: 'Furniture',
    leasehold_improvements: 'Leasehold Improvements',
    deposits: 'Deposits',
    intangible_assets: 'Intangible Assets',
  },
  liabilities: {
    accounts_payable: 'Accounts Payable',
    credit_card: 'Credit Card Payable',
    sales_tax: 'Sales Tax Payable',
    payroll: 'Payroll Liabilities',
    vehicle_loans: 'Vehicle Loans',
    sba_loan: 'SBA Loan',
    mortgage: 'Mortgage Payable',
  },
  equity: {
    owners_equity: "Owner's Equity",
    owners_contributions: "Owner's Contributions",
    owners_draws: "Owner's Draws",
    retained_earnings: 'Retained Earnings',
  },
  income: {
    service_revenue: 'Service Revenue',
    product_sales: 'Product Sales',
    interest_income: 'Interest Income',
    rental_income: 'Rental Income',
    consulting_revenue: 'Consulting Revenue',
    commission_income: 'Commission Income',
    other_income: 'Other Income',
  },
  cogs: {
    materials: 'Materials & Supplies',
    inventory_cost: 'Cost of Inventory Sold',
    subcontractor: 'Subcontractor Fees',
    shipping: 'Shipping & Delivery',
  },
  expenses: {
    advertising: 'Advertising & Marketing',
    office_supplies: 'Office Supplies',
    utilities: 'Utilities',
    insurance: 'Insurance',
    fuel: 'Fuel',
    meals: 'Meals & Entertainment',
    professional_services: 'Professional Services',
    repairs: 'Repairs & Maintenance',
    rent: 'Rent',
    software: 'Software Subscriptions',
    wages: 'Wages & Payroll',
    taxes: 'Taxes & Licenses',
    travel: 'Travel',
    bank_fees: 'Bank Fees',
    telephone: 'Telephone',
    internet: 'Internet',
    training: 'Training & Development',
    cleaning: 'Cleaning Services',
    security: 'Security Services',
    landscaping: 'Landscaping Services',
    parking: 'Parking',
    postage: 'Postage & Delivery',
    printing: 'Printing & Reproduction',
    storage: 'Storage',
    uniforms: 'Uniforms & Work Clothes',
    waste: 'Waste Disposal',
    water: 'Water',
    workers_comp: 'Workers Compensation',
    other: 'Other Expenses',
  },
};

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

// Sample accounts for testing - TODO: Remove before production
const SAMPLE_ACCOUNTS: Account[] = [
  {
    id: 'cash-1',
    name: 'Business Checking',
    type: 'asset',
    subType: 'checking',
    category: 'cash',
    balance: 10000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'cash-2',
    name: 'Business Savings',
    type: 'asset',
    subType: 'savings',
    category: 'cash',
    balance: 50000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'cash-3',
    name: 'Petty Cash',
    type: 'asset',
    subType: 'petty',
    category: 'cash',
    balance: 500,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'credit-1',
    name: 'Capital One Credit Card',
    type: 'liability',
    subType: 'credit_card',
    category: 'credit_card',
    balance: -2000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'payment-1',
    name: 'Stripe Balance',
    type: 'asset',
    subType: 'payment_processor',
    category: 'payment_processor',
    balance: 1500,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'payment-2',
    name: 'PayPal Balance',
    type: 'asset',
    subType: 'payment_processor',
    category: 'payment_processor',
    balance: 800,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'undeposited-1',
    name: 'Undeposited Funds',
    type: 'asset',
    subType: 'undeposited',
    category: 'undeposited',
    balance: 1200,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // TEST ACCOUNT - REMOVE BEFORE PRODUCTION
  {
    id: 'test-1',
    name: 'Test Business Account',
    type: 'asset',
    subType: 'checking',
    category: 'cash',
    balance: 5000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const loadedAccounts = await accountService.getAccounts();
        setAccounts(loadedAccounts);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
        // Fallback to sample accounts if API fails
        setAccounts(SAMPLE_ACCOUNTS);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, []);

  const addAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newAccount = await accountService.createAccount(account);
      setAccounts(prev => [...prev, newAccount]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      throw err;
    }
  };

  const updateAccount = async (id: string, account: Partial<Account>) => {
    try {
      const updatedAccount = await accountService.updateAccount(id, account);
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
      throw err;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      await accountService.deleteAccount(id);
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      throw err;
    }
  };

  return (
    <AccountsContext.Provider value={{ accounts, addAccount, updateAccount, deleteAccount, isLoading, error }}>
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
}; 