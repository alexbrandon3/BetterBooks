interface Account {
  id: string;
  name: string;
  type: string;
  category: string;
  subcategory: string;
  financialCategory: string;
  financialSubcategory: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  description: string;
  accountId: string;
  date: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  endDate?: string;
}

export const mockAccounts: Account[] = [
  { 
    id: '1', 
    name: 'Checking', 
    type: 'CHECKING',
    category: 'Bank',
    subcategory: 'Checking',
    financialCategory: 'Assets',
    financialSubcategory: 'Cash'
  },
  { 
    id: '2', 
    name: 'Savings', 
    type: 'SAVINGS',
    category: 'Bank',
    subcategory: 'Savings',
    financialCategory: 'Assets',
    financialSubcategory: 'Cash'
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 100,
    type: 'EXPENSE',
    description: 'Test Transaction',
    accountId: '1',
    date: '2024-03-20',
    isRecurring: true,
    recurrencePattern: 'MONTHLY',
    endDate: '2024-12-31'
  }
]; 