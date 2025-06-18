import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { type BalanceSheet, type IncomeStatement } from '../services/ReportService';
import { formatCurrency } from './formatters';
import { DateRange } from '../types/common';

type ReportType = 'balance-sheet' | 'income-statement';

const formatAmount = (amount: unknown): string => {
  if (typeof amount === 'number') {
    return formatCurrency(amount);
  }
  return formatCurrency(0);
};

const formatDateRange = (dateRange: DateRange): string => {
  if (!dateRange.start && !dateRange.end) return 'All Time';
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  if (dateRange.start && dateRange.end) return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
  return dateRange.start ? `From ${formatDate(dateRange.start)}` : `Until ${formatDate(dateRange.end)}`;
};

const generateBalanceSheetPDF = (
  doc: jsPDF,
  data: BalanceSheet,
  dateRange: DateRange
): void => {
  doc.setFontSize(16);
  doc.text('Balance Sheet', 14, 20);
  doc.setFontSize(12);
  doc.text(formatDateRange(dateRange), 14, 30);
  let yPos = 40;
  doc.setFontSize(14);
  doc.text('Assets', 14, yPos);
  yPos += 10;
  data.assets.forEach((group) => {
    const assetData = [
      [group.subcategoryName, '', formatAmount(group.subtotal)],
      ...group.accounts.map((account) => ['', account.name, formatAmount(account.balance)])
    ];
    (doc as any).autoTable({
      startY: yPos,
      head: [['Category', 'Account', 'Amount']],
      body: assetData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 }, 2: { cellWidth: 50, halign: 'right' } }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  });
  const totalAssets = data.assets.reduce((sum, group) => sum + group.subtotal, 0);
  (doc as any).autoTable({
    startY: yPos,
    body: [['Total Assets', '', formatAmount(totalAssets)]],
    theme: 'grid',
    styles: { fontSize: 10, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 }, 2: { cellWidth: 50, halign: 'right' } }
  });
  yPos = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(14);
  doc.text('Liabilities', 14, yPos);
  yPos += 10;
  data.liabilities.forEach((group) => {
    const liabilityData = [
      [group.subcategoryName, '', formatAmount(group.subtotal)],
      ...group.accounts.map((account) => ['', account.name, formatAmount(account.balance)])
    ];
    (doc as any).autoTable({
      startY: yPos,
      head: [['Category', 'Account', 'Amount']],
      body: liabilityData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 }, 2: { cellWidth: 50, halign: 'right' } }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  });
  const totalLiabilities = data.liabilities.reduce((sum, group) => sum + group.subtotal, 0);
  (doc as any).autoTable({
    startY: yPos,
    body: [['Total Liabilities', '', formatAmount(totalLiabilities)]],
    theme: 'grid',
    styles: { fontSize: 10, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 }, 2: { cellWidth: 50, halign: 'right' } }
  });
  yPos = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(14);
  doc.text('Equity', 14, yPos);
  yPos += 10;
  data.equity.forEach((group) => {
    const equityData = [
      [group.subcategoryName, '', formatAmount(group.subtotal)],
      ...group.accounts.map((account) => ['', account.name, formatAmount(account.balance)])
    ];
    (doc as any).autoTable({
      startY: yPos,
      head: [['Category', 'Account', 'Amount']],
      body: equityData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 }, 2: { cellWidth: 50, halign: 'right' } }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  });
  const totalEquity = data.equity.reduce((sum, group) => sum + group.subtotal, 0);
  (doc as any).autoTable({
    startY: yPos,
    body: [['Total Equity', '', formatAmount(totalEquity)]],
    theme: 'grid',
    styles: { fontSize: 10, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 }, 2: { cellWidth: 50, halign: 'right' } }
  });
};

const generateIncomeStatementPDF = (
  doc: jsPDF,
  data: IncomeStatement,
  dateRange: DateRange
): void => {
  doc.setFontSize(16);
  doc.text('Income Statement', 14, 20);
  doc.setFontSize(12);
  doc.text(formatDateRange(dateRange), 14, 30);
  let yPos = 40;
  const tableData = [
    ['Total Income', formatAmount(data.totalIncome)],
    ['Total Expenses', formatAmount(data.totalExpenses)],
    ['Net Income', formatAmount(data.netIncome)]
  ];
  (doc as any).autoTable({
    startY: yPos,
    head: [['Category', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 80, halign: 'right' } }
  });
};

export const exportToPDF = (
  reportType: ReportType,
  data: BalanceSheet | IncomeStatement | null,
  dateRange: DateRange
): void => {
  if (!data) return;
  const doc = new jsPDF();
  switch (reportType) {
    case 'balance-sheet':
      generateBalanceSheetPDF(doc, data as BalanceSheet, dateRange);
      break;
    case 'income-statement':
      generateIncomeStatementPDF(doc, data as IncomeStatement, dateRange);
      break;
    default:
      return;
  }
  const filename = `${reportType.replace('-', '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};