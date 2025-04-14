import React, { createContext, useContext, useState } from 'react';

interface Account {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  balance: number;
  isActive?: boolean;
  category?: string;
}

interface AccountsContextType {
  accounts: Account[];
  addAccount: (account: Account) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
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
    category: 'assets',
    type: 'cash',
    balance: 10000,
    isActive: true,
  },
  {
    id: 'cash-2',
    name: 'Business Savings',
    category: 'assets',
    type: 'cash',
    balance: 50000,
    isActive: true,
  },
  {
    id: 'cash-3',
    name: 'Petty Cash',
    category: 'assets',
    type: 'cash',
    balance: 500,
    isActive: true,
  },
  {
    id: 'credit-1',
    name: 'Capital One Credit Card',
    category: 'assets',
    type: 'credit_card',
    balance: -2000,
    isActive: true,
  },
  {
    id: 'payment-1',
    name: 'Stripe Balance',
    category: 'assets',
    type: 'payment_processor',
    balance: 1500,
    isActive: true,
  },
  {
    id: 'payment-2',
    name: 'PayPal Balance',
    category: 'assets',
    type: 'payment_processor',
    balance: 800,
    isActive: true,
  },
  {
    id: 'undeposited-1',
    name: 'Undeposited Funds',
    category: 'assets',
    type: 'undeposited',
    balance: 1200,
    isActive: true,
  },
];

export const AccountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(SAMPLE_ACCOUNTS);

  const addAccount = (account: Account) => {
    setAccounts(prev => [...prev, account]);
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(account => 
      account.id === id ? { ...account, ...updates } : account
    ));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(account => account.id !== id));
  };

  return (
    <AccountsContext.Provider value={{ accounts, addAccount, updateAccount, deleteAccount }}>
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
}; 