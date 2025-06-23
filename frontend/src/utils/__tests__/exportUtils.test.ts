import {
  formatCurrency,
  escapeCSV,
  balanceSheetToCSV,
  incomeStatementToCSV,
  exportToCSV,
  createDownloadLink
} from '../exportUtils';
import { BalanceSheet, IncomeStatement, CashFlow } from '../../types/reports';

describe('formatCurrency', () => {
  it('formats positive numbers with 2 decimal places', () => {
    expect(formatCurrency(1234.5678)).toBe('1234.57');
    expect(formatCurrency(1000)).toBe('1000.00');
    expect(formatCurrency(0.1)).toBe('0.10');
  });

  it('formats negative numbers with 2 decimal places', () => {
    expect(formatCurrency(-1234.5678)).toBe('-1234.57');
    expect(formatCurrency(-1000)).toBe('-1000.00');
    expect(formatCurrency(-0.1)).toBe('-0.10');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('0.00');
  });

  it('handles large numbers', () => {
    expect(formatCurrency(1000000)).toBe('1000000.00');
    expect(formatCurrency(999999999.99)).toBe('999999999.99');
  });
});

describe('escapeCSV', () => {
  it('escapes strings containing commas', () => {
    expect(escapeCSV('Hello, World')).toBe('"Hello, World"');
  });

  it('escapes strings containing quotes', () => {
    expect(escapeCSV('Hello "World"')).toBe('"Hello ""World"""');
  });

  it('escapes strings containing newlines', () => {
    expect(escapeCSV('Hello\nWorld')).toBe('"Hello\nWorld"');
  });

  it('leaves plain strings unchanged', () => {
    expect(escapeCSV('Hello World')).toBe('Hello World');
  });

  it('handles empty strings', () => {
    expect(escapeCSV('')).toBe('');
  });
});

describe('balanceSheetToCSV', () => {
  const mockBalanceSheet: BalanceSheet = {
    assets: [
      {
        subcategoryName: 'Current Assets',
        accounts: [
          { id: 1, name: 'Cash and Equivalents', balance: 3000 },
          { id: 2, name: 'Accounts Receivable', balance: 2000 }
        ],
        subtotal: 5000,
        displayOrder: 1
      },
      {
        subcategoryName: 'Long-term Assets',
        accounts: [
          { id: 3, name: 'Equipment', balance: 8000 },
          { id: 4, name: 'Buildings', balance: 2000 }
        ],
        subtotal: 10000,
        displayOrder: 2
      }
    ],
    liabilities: [
      {
        subcategoryName: 'Current Liabilities',
        accounts: [
          { id: 5, name: 'Accounts Payable', balance: 1500 },
          { id: 6, name: 'Short-term Loans', balance: 500 }
        ],
        subtotal: 2000,
        displayOrder: 1
      },
      {
        subcategoryName: 'Long-term Liabilities',
        accounts: [
          { id: 7, name: 'Long-term Loans', balance: 8000 }
        ],
        subtotal: 8000,
        displayOrder: 2
      }
    ],
    equity: [
      {
        subcategoryName: 'Equity',
        accounts: [
          { id: 8, name: 'Common Stock', balance: 3000 },
          { id: 9, name: 'Retained Earnings', balance: 2000 }
        ],
        subtotal: 5000,
        displayOrder: 1
      }
    ]
  };

  it('generates correct CSV structure with headers', () => {
    const csv = balanceSheetToCSV(mockBalanceSheet);
    const lines = csv.split('\n');
    
    expect(lines[0]).toBe('Category,Subcategory,Account,Amount');
  });

  it('includes all categories and subcategories', () => {
    const csv = balanceSheetToCSV(mockBalanceSheet);
    expect(csv).toContain('Assets,Current Assets,,');
    expect(csv).toContain('Assets,Long-term Assets,,');
    expect(csv).toContain('Liabilities,Current Liabilities,,');
    expect(csv).toContain('Liabilities,Long-term Liabilities,,');
    expect(csv).toContain('Equity,Equity,,');
  });

  it('formats amounts correctly', () => {
    const csv = balanceSheetToCSV(mockBalanceSheet);
    expect(csv).toContain('Assets,Current Assets,Cash and Equivalents,3000.00');
    expect(csv).toContain('Assets,Current Assets,Total,5000.00');
  });

  it('includes totals and subtotals', () => {
    const csv = balanceSheetToCSV(mockBalanceSheet);
    expect(csv).toContain('Assets,Total Assets,,15000.00');
    expect(csv).toContain('Liabilities,Total Liabilities,,10000.00');
    expect(csv).toContain('Equity,Total Equity,,5000.00');
    expect(csv).toContain('Total Liabilities and Equity,,,15000.00');
  });
});

describe('incomeStatementToCSV', () => {
  const mockIncomeStatement: IncomeStatement = {
    revenue: [],
    expenses: [],
    totalIncome: 5000,
    totalExpenses: 7000,
    netIncome: -2000
  };

  it('generates correct CSV structure with headers', () => {
    const csv = incomeStatementToCSV(mockIncomeStatement);
    const lines = csv.split('\n');
    
    expect(lines[0]).toBe('Category,Amount');
  });

  it('includes all categories with correct amounts', () => {
    const csv = incomeStatementToCSV(mockIncomeStatement);
    expect(csv).toContain('Total Income,5000.00');
    expect(csv).toContain('Total Expenses,7000.00');
    expect(csv).toContain('Net Income,-2000.00');
  });

  it('handles positive net income', () => {
    const positiveIncome: IncomeStatement = {
      revenue: [],
      expenses: [],
      totalIncome: 10000,
      totalExpenses: 6000,
      netIncome: 4000
    };
    const csv = incomeStatementToCSV(positiveIncome);
    expect(csv).toContain('Net Income,4000.00');
  });

  it('handles zero values', () => {
    const zeroIncome: IncomeStatement = {
      revenue: [],
      expenses: [],
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0
    };
    const csv = incomeStatementToCSV(zeroIncome);
    expect(csv).toContain('Total Income,0.00');
    expect(csv).toContain('Total Expenses,0.00');
    expect(csv).toContain('Net Income,0.00');
  });
});

describe('createDownloadLink', () => {
  beforeEach(() => {
    // Mock document methods
    Object.defineProperty(document, 'createElement', {
      value: jest.fn(() => ({
        setAttribute: jest.fn(),
        style: {},
        click: jest.fn()
      })),
      writable: true
    });
    Object.defineProperty(document, 'body', {
      value: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
      },
      writable: true
    });
    Object.defineProperty(URL, 'createObjectURL', {
      value: jest.fn(() => 'blob:mock-url'),
      writable: true
    });
  });

  it('creates and triggers download link', () => {
    const mockLink = {
      setAttribute: jest.fn(),
      style: {},
      click: jest.fn()
    };
    (document.createElement as jest.Mock).mockReturnValue(mockLink);
    const mockBody = {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    };
    (document.body as any) = mockBody;

    createDownloadLink('test content', 'test.csv');

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'test.csv');
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockBody.appendChild).toHaveBeenCalledWith(mockLink);
    expect(mockBody.removeChild).toHaveBeenCalledWith(mockLink);
  });
});

describe('exportToCSV', () => {
  beforeEach(() => {
    // Mock createDownloadLink
    jest.spyOn(require('../exportUtils'), 'createDownloadLink').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports balance sheet correctly', () => {
    const mockBalanceSheet: BalanceSheet = {
      assets: [
        {
          subcategoryName: 'Current Assets',
          accounts: [],
          subtotal: 0,
          displayOrder: 1
        }
      ],
      liabilities: [
        {
          subcategoryName: 'Current Liabilities',
          accounts: [],
          subtotal: 0,
          displayOrder: 1
        }
      ],
      equity: [
        {
          subcategoryName: 'Equity',
          accounts: [],
          subtotal: 0,
          displayOrder: 1
        }
      ]
    };

    exportToCSV(mockBalanceSheet, 'balance-sheet');
    expect(require('../exportUtils').createDownloadLink).toHaveBeenCalled();
  });

  it('exports income statement correctly', () => {
    const mockIncomeStatement: IncomeStatement = {
      revenue: [],
      expenses: [],
      totalIncome: 1000,
      totalExpenses: 500,
      netIncome: 500
    };

    exportToCSV(mockIncomeStatement, 'income-statement');
    expect(require('../exportUtils').createDownloadLink).toHaveBeenCalled();
  });

  it('handles null data gracefully', () => {
    exportToCSV(null, 'balance-sheet');
    expect(require('../exportUtils').createDownloadLink).not.toHaveBeenCalled();
  });

  it('handles invalid report type gracefully', () => {
    const mockBalanceSheet: BalanceSheet = {
      assets: [],
      liabilities: [],
      equity: []
    };

    exportToCSV(mockBalanceSheet, 'invalid-type' as any);
    expect(require('../exportUtils').createDownloadLink).not.toHaveBeenCalled();
  });
}); 