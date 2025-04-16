// src/utils/accountUtils.ts

export const ACCOUNT_TYPES: Record<string, { label: string; category: string }> = {
    asset: { label: 'Asset', category: 'Balance Sheet' },
    liability: { label: 'Liability', category: 'Balance Sheet' },
    equity: { label: 'Equity', category: 'Balance Sheet' },
    revenue: { label: 'Revenue', category: 'Income Statement' },
    expense: { label: 'Expense', category: 'Income Statement' },
  };
  