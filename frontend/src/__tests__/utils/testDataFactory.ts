import { v4 as uuidv4 } from 'uuid';

export interface TestUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface TestBusiness {
  id: string;
  name: string;
  entityType: string;
  industry: string;
  fiscalYearStart: string;
}

export interface TestAccount {
  id: string;
  name: string;
  type: string;
  subtype: string;
  balance: number;
  isActive: boolean;
}

export interface TestTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  accountId: string;
  category: string;
  journalEntry: {
    debits: Array<{ account: string; amount: number }>;
    credits: Array<{ account: string; amount: number }>;
  };
}

export const createTestUser = (overrides?: Partial<TestUser>): TestUser => ({
  id: uuidv4(),
  name: 'Jamie Dawson',
  email: 'jamie@greenspace.com',
  password: 'Test123!',
  ...overrides,
});

export const createTestBusiness = (overrides?: Partial<TestBusiness>): TestBusiness => ({
  id: uuidv4(),
  name: 'GreenSpace Lawn Care',
  entityType: 'LLC',
  industry: 'Landscaping',
  fiscalYearStart: '01-01',
  ...overrides,
});

export const createTestAccount = (overrides?: Partial<TestAccount>): TestAccount => ({
  id: uuidv4(),
  name: 'Business Checking',
  type: 'Asset',
  subtype: 'Current Asset',
  balance: 5000,
  isActive: true,
  ...overrides,
});

export const createTestTransaction = (overrides?: Partial<TestTransaction>): TestTransaction => ({
  id: uuidv4(),
  date: new Date().toISOString(),
  description: 'Test Transaction',
  amount: 100,
  accountId: uuidv4(),
  category: 'Expense',
  journalEntry: {
    debits: [{ account: 'Expense Account', amount: 100 }],
    credits: [{ account: 'Cash', amount: 100 }],
  },
  ...overrides,
}); 