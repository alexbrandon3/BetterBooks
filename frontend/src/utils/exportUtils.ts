import { BalanceSheet, IncomeStatement, CashFlow } from '../services/ReportService';

/**
 * Formats a number as a currency string with 2 decimal places
 */
export const formatCurrency = (amount: number): string => {
  return amount.toFixed(2);
};

/**
 * Escapes a string for CSV format
 */
export const escapeCSV = (str: string): string => {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Converts Balance Sheet data to CSV format
 */
export const balanceSheetToCSV = (data: BalanceSheet): string => {
  const rows: string[] = [];
  
  // Headers
  rows.push('Category,Subcategory,Account,Amount');
  
  // Assets
  rows.push('Assets,Current Assets,,');
  Object.entries(data.assets.current.subcategories).forEach(([name, amount]) => {
    rows.push(`Assets,Current Assets,${escapeCSV(name)},${formatCurrency(amount)}`);
  });
  rows.push(`Assets,Current Assets,Total,${formatCurrency(data.assets.current.total)}`);
  
  rows.push('Assets,Long-term Assets,,');
  Object.entries(data.assets.longTerm.subcategories).forEach(([name, amount]) => {
    rows.push(`Assets,Long-term Assets,${escapeCSV(name)},${formatCurrency(amount)}`);
  });
  rows.push(`Assets,Long-term Assets,Total,${formatCurrency(data.assets.longTerm.total)}`);
  rows.push(`Assets,Total Assets,,${formatCurrency(data.assets.total)}`);
  
  // Liabilities
  rows.push('Liabilities,Current Liabilities,,');
  Object.entries(data.liabilities.current.subcategories).forEach(([name, amount]) => {
    rows.push(`Liabilities,Current Liabilities,${escapeCSV(name)},${formatCurrency(amount)}`);
  });
  rows.push(`Liabilities,Current Liabilities,Total,${formatCurrency(data.liabilities.current.total)}`);
  
  rows.push('Liabilities,Long-term Liabilities,,');
  Object.entries(data.liabilities.longTerm.subcategories).forEach(([name, amount]) => {
    rows.push(`Liabilities,Long-term Liabilities,${escapeCSV(name)},${formatCurrency(amount)}`);
  });
  rows.push(`Liabilities,Long-term Liabilities,Total,${formatCurrency(data.liabilities.longTerm.total)}`);
  rows.push(`Liabilities,Total Liabilities,,${formatCurrency(data.liabilities.total)}`);
  
  // Equity
  rows.push('Equity,,,');
  Object.entries(data.equity.subcategories).forEach(([name, amount]) => {
    rows.push(`Equity,,${escapeCSV(name)},${formatCurrency(amount)}`);
  });
  rows.push(`Equity,Total Equity,,${formatCurrency(data.equity.total)}`);
  
  // Total Liabilities and Equity
  rows.push(`Total Liabilities and Equity,,,${formatCurrency(data.liabilities.total + data.equity.total)}`);
  
  return rows.join('\n');
};

/**
 * Converts Income Statement data to CSV format
 */
export const incomeStatementToCSV = (data: IncomeStatement): string => {
  const rows: string[] = [];
  
  // Headers
  rows.push('Category,Amount');
  
  // Data
  rows.push(`Revenue,${formatCurrency(data.revenue)}`);
  rows.push(`Expenses,${formatCurrency(data.expenses)}`);
  rows.push(`Net Income,${formatCurrency(data.netIncome)}`);
  
  return rows.join('\n');
};

/**
 * Converts Cash Flow Statement data to CSV format
 */
export const cashFlowToCSV = (data: CashFlow): string => {
  const rows: string[] = [];
  
  // Headers
  rows.push('Category,Amount');
  
  // Data
  rows.push(`Operating Activities,${formatCurrency(data.operatingActivities)}`);
  rows.push(`Investing Activities,${formatCurrency(data.investingActivities)}`);
  rows.push(`Financing Activities,${formatCurrency(data.financingActivities)}`);
  rows.push(`Net Cash Flow,${formatCurrency(data.netCashFlow)}`);
  
  return rows.join('\n');
};

/**
 * Creates a download link and triggers it
 */
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

/**
 * Exports report data to CSV and triggers download
 */
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