import { type BalanceSheet, type IncomeStatement, type CashFlow } from '../services/ReportService';
import { formatCurrency } from './formatters';

export { formatCurrency };

export const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const formatAmount = (amount: unknown): string => {
  if (typeof amount === 'number') {
    return formatCurrency(amount);
  }
  return formatCurrency(0);
};

export const balanceSheetToCSV = (data: BalanceSheet): string => {
  const rows: string[] = [];
  rows.push('Category,Subcategory,Account,Amount');
  data.assets.forEach((group) => {
    rows.push(`Assets,${escapeCSV(group.subcategoryName)},,`);
    group.accounts.forEach((account) => {
      rows.push(`Assets,${escapeCSV(group.subcategoryName)},${escapeCSV(account.name)},${formatAmount(account.balance)}`);
    });
    rows.push(`Assets,${escapeCSV(group.subcategoryName)},Total,${formatAmount(group.subtotal)}`);
  });
  const totalAssets = data.assets.reduce((sum, group) => sum + group.subtotal, 0);
  rows.push(`Assets,Total Assets,,${formatAmount(totalAssets)}`);
  data.liabilities.forEach((group) => {
    rows.push(`Liabilities,${escapeCSV(group.subcategoryName)},,`);
    group.accounts.forEach((account) => {
      rows.push(`Liabilities,${escapeCSV(group.subcategoryName)},${escapeCSV(account.name)},${formatAmount(account.balance)}`);
    });
    rows.push(`Liabilities,${escapeCSV(group.subcategoryName)},Total,${formatAmount(group.subtotal)}`);
  });
  const totalLiabilities = data.liabilities.reduce((sum, group) => sum + group.subtotal, 0);
  rows.push(`Liabilities,Total Liabilities,,${formatAmount(totalLiabilities)}`);
  data.equity.forEach((group) => {
    rows.push(`Equity,${escapeCSV(group.subcategoryName)},,`);
    group.accounts.forEach((account) => {
      rows.push(`Equity,${escapeCSV(group.subcategoryName)},${escapeCSV(account.name)},${formatAmount(account.balance)}`);
    });
    rows.push(`Equity,${escapeCSV(group.subcategoryName)},Total,${formatAmount(group.subtotal)}`);
  });
  const totalEquity = data.equity.reduce((sum, group) => sum + group.subtotal, 0);
  rows.push(`Equity,Total Equity,,${formatAmount(totalEquity)}`);
  rows.push(`Total Liabilities and Equity,,,${formatAmount(totalLiabilities + totalEquity)}`);
  return rows.join('\n');
};

export const incomeStatementToCSV = (data: IncomeStatement): string => {
  const rows: string[] = [];
  rows.push('Section,Category,Account,Amount');
  
  // Revenue Section
  rows.push('Revenue,,,');
  if (data.revenue.length > 0) {
    data.revenue.forEach((group) => {
      rows.push(`Revenue,${escapeCSV(group.subcategoryName)},,`);
      group.accounts.forEach((account) => {
        rows.push(`Revenue,${escapeCSV(group.subcategoryName)},${escapeCSV(account.name)},${formatAmount(account.balance)}`);
      });
      rows.push(`Revenue,${escapeCSV(group.subcategoryName)},Total,${formatAmount(group.subtotal)}`);
    });
  } else {
    rows.push('Revenue,No revenue found for the selected period,,');
  }
  rows.push(`Revenue,Total Revenue,,${formatAmount(data.totalIncome)}`);
  
  // Expenses Section
  rows.push('Expenses,,,');
  if (data.expenses.length > 0) {
    data.expenses.forEach((group) => {
      rows.push(`Expenses,${escapeCSV(group.subcategoryName)},,`);
      group.accounts.forEach((account) => {
        rows.push(`Expenses,${escapeCSV(group.subcategoryName)},${escapeCSV(account.name)},${formatAmount(account.balance)}`);
      });
      rows.push(`Expenses,${escapeCSV(group.subcategoryName)},Total,${formatAmount(group.subtotal)}`);
    });
  } else {
    rows.push('Expenses,No expenses found for the selected period,,');
  }
  rows.push(`Expenses,Total Expenses,,${formatAmount(data.totalExpenses)}`);
  
  // Net Income
  rows.push(`Net Income,,,${formatAmount(data.netIncome)}`);
  
  return rows.join('\n');
};

export const cashFlowToCSV = (data: CashFlow): string => {
  const rows: string[] = [];
  rows.push('Section,Category,Account,Amount');
  
  // Operating Activities
  rows.push('Operating Activities,,,');
  if (data.operating && Object.keys(data.operating.subcategories).length > 0) {
    Object.entries(data.operating.subcategories).forEach(([account, amount]) => {
      rows.push(`Operating Activities,${escapeCSV(account)},,${formatAmount(amount)}`);
    });
  } else {
    rows.push('Operating Activities,No operating activities found for the selected period,,');
  }
  rows.push(`Operating Activities,Total Operating Activities,,${formatAmount(data.operating?.total || 0)}`);
  
  // Investing Activities
  rows.push('Investing Activities,,,');
  if (data.investing && Object.keys(data.investing.subcategories).length > 0) {
    Object.entries(data.investing.subcategories).forEach(([account, amount]) => {
      rows.push(`Investing Activities,${escapeCSV(account)},,${formatAmount(amount)}`);
    });
  } else {
    rows.push('Investing Activities,No investing activities found for the selected period,,');
  }
  rows.push(`Investing Activities,Total Investing Activities,,${formatAmount(data.investing?.total || 0)}`);
  
  // Financing Activities
  rows.push('Financing Activities,,,');
  if (data.financing && Object.keys(data.financing.subcategories).length > 0) {
    Object.entries(data.financing.subcategories).forEach(([account, amount]) => {
      rows.push(`Financing Activities,${escapeCSV(account)},,${formatAmount(amount)}`);
    });
  } else {
    rows.push('Financing Activities,No financing activities found for the selected period,,');
  }
  rows.push(`Financing Activities,Total Financing Activities,,${formatAmount(data.financing?.total || 0)}`);
  
  // Net Cash Flow
  rows.push(`Net Cash Flow,,,${formatAmount(data.netCashFlow)}`);
  
  return rows.join('\n');
};

export const createDownloadLink = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToCSV = (
  data: BalanceSheet | IncomeStatement | CashFlow | null,
  reportType: 'balance-sheet' | 'income-statement' | 'cash-flow'
): void => {
  if (!data) return;
  let csvContent: string;
  let filename: string;
  switch (reportType) {
    case 'balance-sheet':
      csvContent = balanceSheetToCSV(data as BalanceSheet);
      filename = `balance_sheet_${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'income-statement':
      csvContent = incomeStatementToCSV(data as IncomeStatement);
      filename = `income_statement_${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'cash-flow':
      csvContent = cashFlowToCSV(data as CashFlow);
      filename = `cash_flow_${new Date().toISOString().split('T')[0]}.csv`;
      break;
    default:
      return;
  }
  createDownloadLink(csvContent, filename);
};