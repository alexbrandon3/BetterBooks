import { type BalanceSheet, type IncomeStatement } from '../services/ReportService';
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
  rows.push('Category,Amount');
  rows.push(`Total Income,${formatAmount(data.totalIncome)}`);
  rows.push(`Total Expenses,${formatAmount(data.totalExpenses)}`);
  rows.push(`Net Income,${formatAmount(data.netIncome)}`);
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
  data: BalanceSheet | IncomeStatement | null,
  reportType: 'balance-sheet' | 'income-statement'
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
    default:
      return;
  }
  createDownloadLink(csvContent, filename);
};