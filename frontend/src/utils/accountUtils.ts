import { Account, AccountType } from '../types/account';

export const ACCOUNT_TYPES: Record<AccountType, { label: string; description: string; color: string }> = {
  asset: {
    label: 'Assets',
    description: 'Resources owned by the business that have economic value',
    color: '#4CAF50'
  },
  liability: {
    label: 'Liabilities',
    description: 'Obligations or debts owed by the business',
    color: '#F44336'
  },
  equity: {
    label: 'Equity',
    description: 'Owner\'s claim on the business assets after liabilities',
    color: '#2196F3'
  },
  income: {
    label: 'Income',
    description: 'Revenue earned from business operations',
    color: '#9C27B0'
  },
  expense: {
    label: 'Expenses',
    description: 'Costs incurred in running the business',
    color: '#FF9800'
  }
};

export const ACCOUNT_SUBTYPES: Record<AccountType, string[]> = {
  asset: ['cash', 'checking', 'savings', 'petty', 'stripe', 'paypal', 'general'],
  liability: ['credit_card', 'loan', 'tax_payable', 'accounts_payable'],
  equity: ['owner_equity', 'retained_earnings', 'common_stock'],
  income: ['sales', 'service', 'interest', 'other_income'],
  expense: ['supplies', 'rent', 'utilities', 'salary', 'marketing', 'other_expense']
};

export const sortAccounts = (accounts: Account[], sortBy: keyof Account, sortOrder: 'asc' | 'desc'): Account[] => {
  return [...accounts].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });
};

export const filterAccounts = (
  accounts: Account[],
  searchTerm: string,
  typeFilter: AccountType | 'all',
  showArchived: boolean
): Account[] => {
  return accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.subType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || account.type === typeFilter;
    const matchesArchiveStatus = showArchived || account.isActive;
    
    return matchesSearch && matchesType && matchesArchiveStatus;
  });
};

export const suggestSubtype = (name: string, type: AccountType): string => {
  const nameLower = name.toLowerCase();
  const possibleSubtypes = ACCOUNT_SUBTYPES[type];
  
  // Try to find a matching subtype based on the name
  const matchingSubtype = possibleSubtypes.find(subtype => 
    nameLower.includes(subtype.replace('_', ' '))
  );
  
  return matchingSubtype || possibleSubtypes[0];
};

export const validateAccount = (account: Partial<Account>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!account.name?.trim()) {
    errors.push('Account name is required');
  }
  
  if (!account.type) {
    errors.push('Account type is required');
  }
  
  if (!account.subType) {
    errors.push('Account subtype is required');
  }
  
  if (account.balance === undefined || account.balance === null) {
    errors.push('Initial balance is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 