import { renderHook, act } from '@testing-library/react';
import { LedgerProvider, useLedger } from '../contexts/LedgerContext';
import { Account, AccountType } from '../types/account';
import { JournalEntry, LedgerFilters, LedgerContextType, LedgerEntry } from '../types/ledger';

// Mock accounts for testing
const mockAccounts: Record<string, Account> = {
  'business_checking': {
    id: 'business_checking',
    name: 'Business Checking',
    type: 'asset' as AccountType,
    subtype: 'CHECKING',
    balance: 10000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'business_savings': {
    id: 'business_savings',
    name: 'Business Savings',
    type: 'asset' as AccountType,
    subtype: 'SAVINGS',
    balance: 5000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'office_supplies': {
    id: 'office_supplies',
    name: 'Office Supplies',
    type: 'expense' as AccountType,
    subtype: 'SUPPLIES',
    balance: 0,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'service_revenue': {
    id: 'service_revenue',
    name: 'Service Revenue',
    type: 'income' as AccountType,
    subtype: 'SERVICE',
    balance: 0,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'sales_tax_payable': {
    id: 'sales_tax_payable',
    name: 'Sales Tax Payable',
    type: 'liability' as AccountType,
    subtype: 'TAX',
    balance: 0,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'loan_payable': {
    id: 'loan_payable',
    name: 'Loan Payable',
    type: 'liability' as AccountType,
    subtype: 'LOAN',
    balance: 10000,
    currency: 'USD',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'inactive_account': {
    id: 'inactive_account',
    name: 'Inactive Account',
    type: 'asset' as AccountType,
    subtype: 'OTHER',
    balance: 0,
    currency: 'USD',
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LedgerProvider>{children}</LedgerProvider>
);

describe('General Ledger Tests', () => {
  let result: { current: LedgerContextType };

  beforeEach(() => {
    const { result: hookResult } = renderHook(() => useLedger(), { wrapper });
    result = hookResult;
  });

  test('BB-TX-001: Basic Expense Entry', async () => {
    const entry: JournalEntry = {
      id: 'tx-001',
      date: '2025-04-02',
      description: 'Bought printer ink from Staples',
      debits: [{
        account: mockAccounts.office_supplies,
        amount: 85.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 85.00
      }],
      total: 85.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toBeUndefined();

    const officeSuppliesLedger = result.current.getAccountLedger('office_supplies');
    const checkingLedger = result.current.getAccountLedger('business_checking');

    expect(officeSuppliesLedger?.currentBalance).toBe(85.00);
    expect(checkingLedger?.currentBalance).toBe(9915.00);
  });

  test('BB-TX-002: Revenue with Sales Tax', async () => {
    const entry: JournalEntry = {
      id: 'tx-002',
      date: '2025-04-03',
      description: 'Landscaping payment',
      debits: [{
        account: mockAccounts.business_checking,
        amount: 1070.00
      }],
      credits: [
        {
          account: mockAccounts.service_revenue,
          amount: 1000.00
        },
        {
          account: mockAccounts.sales_tax_payable,
          amount: 70.00
        }
      ],
      total: 1070.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toBeUndefined();

    const checkingLedger = result.current.getAccountLedger('business_checking');
    const revenueLedger = result.current.getAccountLedger('service_revenue');
    const taxLedger = result.current.getAccountLedger('sales_tax_payable');

    expect(checkingLedger?.currentBalance).toBe(10985.00);
    expect(revenueLedger?.currentBalance).toBe(-1000.00);
    expect(taxLedger?.currentBalance).toBe(-70.00);
  });

  test('BB-TX-003: Transfer Between Accounts', async () => {
    const entry: JournalEntry = {
      id: 'tx-003',
      date: '2025-04-04',
      description: 'Transfer to savings',
      debits: [{
        account: mockAccounts.business_savings,
        amount: 500.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 500.00
      }],
      total: 500.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toBeUndefined();

    const savingsLedger = result.current.getAccountLedger('business_savings');
    const checkingLedger = result.current.getAccountLedger('business_checking');

    expect(savingsLedger?.currentBalance).toBe(5500.00);
    expect(checkingLedger?.currentBalance).toBe(10485.00);
  });

  test('BB-VAL-001: Unbalanced Journal Entry', async () => {
    const entry: JournalEntry = {
      id: 'tx-004',
      date: '2025-04-05',
      description: 'Invalid entry',
      debits: [{
        account: mockAccounts.office_supplies,
        amount: 200.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 175.00
      }],
      total: 200.00,
      status: 'error',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Debits (200) do not equal credits (175)');
  });

  test('BB-VAL-002: Invalid Account Name', async () => {
    const entry: JournalEntry = {
      id: 'tx-005',
      date: '2025-04-06',
      description: 'Unexpected purchase',
      debits: [{
        account: {
          id: 'alien_account',
          name: 'Alien Accounting Dimension',
          type: 'asset' as AccountType,
          subtype: 'OTHER',
          balance: 0,
          currency: 'USD',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        amount: 999.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 999.00
      }],
      total: 999.00,
      status: 'error',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Account not found in chart of accounts');
  });

  test('BB-MANUAL-001: Manual Journal Entry', async () => {
    const entry: JournalEntry = {
      id: 'tx-006',
      date: '2025-04-10',
      description: 'Loan principal repayment',
      debits: [{
        account: mockAccounts.loan_payable,
        amount: 1000.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 1000.00
      }],
      total: 1000.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toBeUndefined();

    const loanLedger = result.current.getAccountLedger('loan_payable');
    const checkingLedger = result.current.getAccountLedger('business_checking');

    expect(loanLedger?.currentBalance).toBe(9000.00);
    expect(checkingLedger?.currentBalance).toBe(9485.00);
  });

  test('BB-FLAG-001: Flagged Transaction for Review', async () => {
    const entry: JournalEntry = {
      id: 'tx-007',
      date: '2025-04-11',
      description: 'Consulting help from David',
      debits: [{
        account: mockAccounts.office_supplies,
        amount: 300.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 300.00
      }],
      total: 300.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.warnings).toContain('Some entries were flagged for review');

    const flaggedTransactions = result.current.getFlaggedTransactions();
    expect(flaggedTransactions.length).toBeGreaterThan(0);
    expect(flaggedTransactions[0].description).toBe('Consulting help from David');
  });

  test('BB-AUDIT-001: Ledger Audit Summary', async () => {
    // First, let's post a few transactions to create a dataset
    const entries: JournalEntry[] = [
      {
        id: 'tx-008',
        date: '2025-04-12',
        description: 'Test transaction 1',
        debits: [{
          account: mockAccounts.office_supplies,
          amount: 100.00
        }],
        credits: [{
          account: mockAccounts.business_checking,
          amount: 100.00
        }],
        total: 100.00,
        status: 'valid',
        timestamp: new Date().toISOString(),
        userId: 'test-user'
      },
      {
        id: 'tx-009',
        date: '2025-04-13',
        description: 'Test transaction 2',
        debits: [{
          account: mockAccounts.office_supplies,
          amount: 200.00
        }],
        credits: [{
          account: mockAccounts.business_checking,
          amount: 200.00
        }],
        total: 200.00,
        status: 'valid',
        timestamp: new Date().toISOString(),
        userId: 'test-user'
      }
    ];

    for (const entry of entries) {
      await act(async () => {
        result.current.postJournalEntry(entry);
      });
    }

    const summary = result.current.getLedgerSummary();
    expect(summary.totalDebits).toBe(summary.totalCredits);
    expect(summary.flaggedCount).toBeGreaterThanOrEqual(0);
    expect(summary.attachmentCount).toBe(0);
    expect(summary.dateRange.start).toBeLessThanOrEqual(summary.dateRange.end);

    // Verify no duplicate transaction IDs
    const allEntries = result.current.filterLedgerEntries({});
    const transactionIds = new Set(allEntries.map((entry: LedgerEntry) => entry.transactionId));
    expect(transactionIds.size).toBe(allEntries.length);
  });

  test('BB-TX-010: Multiple Debits and Credits', async () => {
    const entry: JournalEntry = {
      id: 'tx-010',
      date: '2025-04-14',
      description: 'Complex transaction with multiple entries',
      debits: [
        {
          account: mockAccounts.office_supplies,
          amount: 150.00
        },
        {
          account: mockAccounts.office_supplies,
          amount: 75.00
        }
      ],
      credits: [
        {
          account: mockAccounts.business_checking,
          amount: 100.00
        },
        {
          account: mockAccounts.business_savings,
          amount: 125.00
        }
      ],
      total: 225.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toBeUndefined();

    const officeSuppliesLedger = result.current.getAccountLedger('office_supplies');
    const checkingLedger = result.current.getAccountLedger('business_checking');
    const savingsLedger = result.current.getAccountLedger('business_savings');

    expect(officeSuppliesLedger?.currentBalance).toBe(225.00);
    expect(checkingLedger?.currentBalance).toBe(9815.00);
    expect(savingsLedger?.currentBalance).toBe(4875.00);
  });

  test('BB-TX-011: Zero Amount Transaction', async () => {
    const entry: JournalEntry = {
      id: 'tx-011',
      date: '2025-04-15',
      description: 'Zero amount transaction',
      debits: [{
        account: mockAccounts.office_supplies,
        amount: 0
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 0
      }],
      total: 0,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toBeUndefined();
    expect(validation.warnings).toContain('Transaction amount is zero');
  });

  test('BB-TX-012: Negative Amount Transaction', async () => {
    const entry: JournalEntry = {
      id: 'tx-012',
      date: '2025-04-16',
      description: 'Negative amount transaction',
      debits: [{
        account: mockAccounts.office_supplies,
        amount: -100.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: -100.00
      }],
      total: -100.00,
      status: 'error',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Negative amounts are not allowed');
  });

  test('BB-TX-013: Inactive Account Transaction', async () => {
    const entry: JournalEntry = {
      id: 'tx-013',
      date: '2025-04-17',
      description: 'Transaction using inactive account',
      debits: [{
        account: mockAccounts.inactive_account,
        amount: 100.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 100.00
      }],
      total: 100.00,
      status: 'error',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Cannot use inactive account');
  });

  test('BB-TX-014: Future Dated Transaction', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    const entry: JournalEntry = {
      id: 'tx-014',
      date: futureDate.toISOString(),
      description: 'Future dated transaction',
      debits: [{
        account: mockAccounts.office_supplies,
        amount: 100.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 100.00
      }],
      total: 100.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.warnings).toContain('Transaction date is in the future');
  });

  test('BB-TX-015: Large Transaction', async () => {
    const entry: JournalEntry = {
      id: 'tx-015',
      date: '2025-04-18',
      description: 'Large equipment purchase',
      debits: [{
        account: mockAccounts.office_supplies,
        amount: 1000000.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 1000000.00
      }],
      total: 1000000.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.warnings).toContain('Large transaction amount detected');
  });

  test('BB-FILTER-001: Filter Ledger Entries', async () => {
    // First, post some transactions
    const entries: JournalEntry[] = [
      {
        id: 'tx-016',
        date: '2025-04-19',
        description: 'Filter test transaction 1',
        debits: [{
          account: mockAccounts.office_supplies,
          amount: 100.00
        }],
        credits: [{
          account: mockAccounts.business_checking,
          amount: 100.00
        }],
        total: 100.00,
        status: 'valid',
        timestamp: new Date().toISOString()
      },
      {
        id: 'tx-017',
        date: '2025-04-20',
        description: 'Filter test transaction 2',
        debits: [{
          account: mockAccounts.office_supplies,
          amount: 200.00
        }],
        credits: [{
          account: mockAccounts.business_savings,
          amount: 200.00
        }],
        total: 200.00,
        status: 'valid',
        timestamp: new Date().toISOString()
      }
    ];

    for (const entry of entries) {
      await act(async () => {
        result.current.postJournalEntry(entry);
      });
    }

    // Test various filters
    const filters: LedgerFilters[] = [
      { accountId: 'office_supplies' },
      { dateRange: [new Date('2025-04-19').getTime(), new Date('2025-04-19').getTime()] },
      { amountRange: { min: 150, max: 250 } },
      { searchTerm: 'test transaction 2' }
    ];

    for (const filter of filters) {
      const filteredEntries = result.current.filterLedgerEntries(filter);
      expect(filteredEntries.length).toBeGreaterThan(0);
    }
  });

  test('BB-AUDIT-002: Audit Trail Integrity', async () => {
    const entry: JournalEntry = {
      id: 'tx-018',
      date: '2025-04-21',
      description: 'Audit trail test',
      debits: [{
        account: mockAccounts.office_supplies,
        amount: 100.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 100.00
      }],
      total: 100.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    await act(async () => {
      result.current.postJournalEntry(entry);
    });

    const officeSuppliesLedger = result.current.getAccountLedger('office_supplies');
    const ledgerEntry = officeSuppliesLedger?.entries[0];

    expect(ledgerEntry?.auditTrail).toBeDefined();
    expect(ledgerEntry?.auditTrail.length).toBeGreaterThan(0);
    expect(ledgerEntry?.auditTrail[0].action).toBe('CREATE');
    expect(ledgerEntry?.auditTrail[0].entityType).toBe('TRANSACTION');
    expect(ledgerEntry?.auditTrail[0].entityId).toBe(entry.id);
  });

  test('BB-AUDIT-003: Ledger Reconciliation', async () => {
    // Post multiple transactions
    const entries: JournalEntry[] = [
      {
        id: 'tx-019',
        date: '2025-04-22',
        description: 'Reconciliation test 1',
        debits: [{
          account: mockAccounts.office_supplies,
          amount: 100.00
        }],
        credits: [{
          account: mockAccounts.business_checking,
          amount: 100.00
        }],
        total: 100.00,
        status: 'valid',
        timestamp: new Date().toISOString()
      },
      {
        id: 'tx-020',
        date: '2025-04-23',
        description: 'Reconciliation test 2',
        debits: [{
          account: mockAccounts.office_supplies,
          amount: 200.00
        }],
        credits: [{
          account: mockAccounts.business_checking,
          amount: 200.00
        }],
        total: 200.00,
        status: 'valid',
        timestamp: new Date().toISOString()
      }
    ];

    for (const entry of entries) {
      await act(async () => {
        result.current.postJournalEntry(entry);
      });
    }

    const summary = result.current.getLedgerSummary();
    
    // Verify ledger integrity
    expect(summary.totalDebits).toBe(summary.totalCredits);
    expect(summary.netChange).toBe(0);
    
    // Verify account balances
    const officeSuppliesLedger = result.current.getAccountLedger('office_supplies');
    const checkingLedger = result.current.getAccountLedger('business_checking');
    
    expect(officeSuppliesLedger?.currentBalance).toBe(300.00);
    expect(checkingLedger?.currentBalance).toBe(9700.00);
    
    // Verify no duplicate transaction IDs
    const allEntries = result.current.filterLedgerEntries({});
    const transactionIds = new Set(allEntries.map(entry => entry.transactionId));
    expect(transactionIds.size).toBe(allEntries.length);
  });

  test('BB-TX-016: Transaction with Attachments', async () => {
    const entry: JournalEntry = {
      id: 'tx-016',
      date: '2025-04-24',
      description: 'Office equipment purchase with receipt',
      debits: [{
        account: mockAccounts.office_supplies,
        amount: 500.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 500.00
      }],
      total: 500.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user',
      attachments: [{
        type: 'receipt',
        name: 'receipt.pdf',
        url: 'https://example.com/receipt.pdf'
      }]
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toBeUndefined();

    const officeSuppliesLedger = result.current.getAccountLedger('office_supplies');
    const ledgerEntry = officeSuppliesLedger?.entries[0];
    expect(ledgerEntry?.attachments).toHaveLength(1);
    expect(ledgerEntry?.attachments?.[0].type).toBe('receipt');
  });

  test('BB-TX-017: Transaction with Audit Trail', async () => {
    const entry: JournalEntry = {
      id: 'tx-017',
      date: '2025-04-25',
      description: 'Modified transaction with audit trail',
      debits: [{
        account: mockAccounts.office_supplies,
        amount: 300.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 300.00
      }],
      total: 300.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toBeUndefined();

    const officeSuppliesLedger = result.current.getAccountLedger('office_supplies');
    const ledgerEntry = officeSuppliesLedger?.entries[0];
    expect(ledgerEntry?.auditTrail).toHaveLength(1);
    expect(ledgerEntry?.auditTrail[0].action).toBe('CREATE');
    expect(ledgerEntry?.auditTrail[0].entityType).toBe('TRANSACTION');
  });

  test('BB-TX-018: Unusual Activity Detection', async () => {
    const entry: JournalEntry = {
      id: 'tx-018',
      date: '2025-04-26',
      description: 'Large round number transaction',
      debits: [{
        account: mockAccounts.office_supplies,
        amount: 10000.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 10000.00
      }],
      total: 10000.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.warnings).toContain('Large transaction amount detected');
    expect(validation.warnings).toContain('Round number transaction detected');

    const flaggedTransactions = result.current.getFlaggedTransactions();
    expect(flaggedTransactions.length).toBeGreaterThan(0);
    expect(flaggedTransactions[0].isFlagged).toBe(true);
  });

  test('BB-TX-019: Multi-Currency Transaction', async () => {
    const entry: JournalEntry = {
      id: 'tx-019',
      date: '2025-04-27',
      description: 'International purchase in EUR',
      debits: [{
        account: {
          ...mockAccounts.office_supplies,
          currency: 'EUR'
        },
        amount: 100.00
      }],
      credits: [{
        account: mockAccounts.business_checking,
        amount: 120.00 // Assuming 1 EUR = 1.2 USD
      }],
      total: 120.00,
      status: 'valid',
      timestamp: new Date().toISOString(),
      userId: 'test-user'
    };

    const validation = await act(async () => {
      return result.current.postJournalEntry(entry);
    });

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toBeUndefined();
    expect(validation.warnings).toContain('Multi-currency transaction detected');

    const officeSuppliesLedger = result.current.getAccountLedger('office_supplies');
    const checkingLedger = result.current.getAccountLedger('business_checking');

    expect(officeSuppliesLedger?.currentBalance).toBe(100.00);
    expect(checkingLedger?.currentBalance).toBe(9880.00);
  });
}); 