import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { BalanceSheet, IncomeStatement, CashFlow } from '../services/ReportService';

type ReportType = 'balance-sheet' | 'income-statement' | 'cash-flow';

interface DateRange {
  start: string;
  end: string;
}

/**
 * Formats a number as a currency string with 2 decimal places
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formats a date range string for the report title
 */
const formatDateRange = (dateRange: DateRange): string => {
  if (!dateRange.start && !dateRange.end) return 'All Time';
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (dateRange.start && dateRange.end) {
    return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
  }
  
  return dateRange.start ? `From ${formatDate(dateRange.start)}` : `Until ${formatDate(dateRange.end)}`;
};

/**
 * Generates a PDF for the Balance Sheet report
 */
const generateBalanceSheetPDF = (
  doc: jsPDF,
  data: BalanceSheet,
  dateRange: DateRange
): void => {
  // Title
  doc.setFontSize(16);
  doc.text('Balance Sheet', 14, 20);
  doc.setFontSize(12);
  doc.text(formatDateRange(dateRange), 14, 30);

  let yPos = 40;

  // Assets Section
  doc.setFontSize(14);
  doc.text('Assets', 14, yPos);
  yPos += 10;

  // Current Assets
  const currentAssetsData = [
    ['Current Assets', '', formatCurrency(data.assets.current.total)],
    ...Object.entries(data.assets.current.subcategories).map(([name, amount]) => [
      '', name, formatCurrency(amount)
    ])
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [['Category', 'Account', 'Amount']],
    body: currentAssetsData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { cellWidth: 50, halign: 'right' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Long-term Assets
  const longTermAssetsData = [
    ['Long-term Assets', '', formatCurrency(data.assets.longTerm.total)],
    ...Object.entries(data.assets.longTerm.subcategories).map(([name, amount]) => [
      '', name, formatCurrency(amount)
    ])
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [['Category', 'Account', 'Amount']],
    body: longTermAssetsData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { cellWidth: 50, halign: 'right' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Total Assets
  (doc as any).autoTable({
    startY: yPos,
    body: [['Total Assets', '', formatCurrency(data.assets.total)]],
    theme: 'grid',
    styles: { fontSize: 10, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { cellWidth: 50, halign: 'right' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Liabilities Section
  doc.setFontSize(14);
  doc.text('Liabilities', 14, yPos);
  yPos += 10;

  // Current Liabilities
  const currentLiabilitiesData = [
    ['Current Liabilities', '', formatCurrency(data.liabilities.current.total)],
    ...Object.entries(data.liabilities.current.subcategories).map(([name, amount]) => [
      '', name, formatCurrency(amount)
    ])
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [['Category', 'Account', 'Amount']],
    body: currentLiabilitiesData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { cellWidth: 50, halign: 'right' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Long-term Liabilities
  const longTermLiabilitiesData = [
    ['Long-term Liabilities', '', formatCurrency(data.liabilities.longTerm.total)],
    ...Object.entries(data.liabilities.longTerm.subcategories).map(([name, amount]) => [
      '', name, formatCurrency(amount)
    ])
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [['Category', 'Account', 'Amount']],
    body: longTermLiabilitiesData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { cellWidth: 50, halign: 'right' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Total Liabilities
  (doc as any).autoTable({
    startY: yPos,
    body: [['Total Liabilities', '', formatCurrency(data.liabilities.total)]],
    theme: 'grid',
    styles: { fontSize: 10, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { cellWidth: 50, halign: 'right' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Equity Section
  doc.setFontSize(14);
  doc.text('Equity', 14, yPos);
  yPos += 10;

  const equityData = [
    ...Object.entries(data.equity.subcategories).map(([name, amount]) => [
      '', name, formatCurrency(amount)
    ]),
    ['Total Equity', '', formatCurrency(data.equity.total)]
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [['Category', 'Account', 'Amount']],
    body: equityData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { cellWidth: 50, halign: 'right' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Total Liabilities and Equity
  (doc as any).autoTable({
    startY: yPos,
    body: [['Total Liabilities and Equity', '', formatCurrency(data.liabilities.total + data.equity.total)]],
    theme: 'grid',
    styles: { fontSize: 10, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 },
      2: { cellWidth: 50, halign: 'right' }
    }
  });
};

/**
 * Generates a PDF for the Income Statement report
 */
const generateIncomeStatementPDF = (
  doc: jsPDF,
  data: IncomeStatement,
  dateRange: DateRange
): void => {
  // Title
  doc.setFontSize(16);
  doc.text('Income Statement', 14, 20);
  doc.setFontSize(12);
  doc.text(formatDateRange(dateRange), 14, 30);

  const tableData = [
    ['Revenue', formatCurrency(data.revenue)],
    ['Expenses', formatCurrency(data.expenses)],
    ['Net Income', formatCurrency(data.netIncome)]
  ];

  (doc as any).autoTable({
    startY: 40,
    head: [['Category', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 70, halign: 'right' }
    }
  });
};

/**
 * Generates a PDF for the Cash Flow Statement report
 */
const generateCashFlowPDF = (
  doc: jsPDF,
  data: CashFlow,
  dateRange: DateRange
): void => {
  // Title
  doc.setFontSize(16);
  doc.text('Cash Flow Statement', 14, 20);
  doc.setFontSize(12);
  doc.text(formatDateRange(dateRange), 14, 30);

  const tableData = [
    ['Operating Activities', formatCurrency(data.operatingActivities)],
    ['Investing Activities', formatCurrency(data.investingActivities)],
    ['Financing Activities', formatCurrency(data.financingActivities)],
    ['Net Cash Flow', formatCurrency(data.netCashFlow)]
  ];

  (doc as any).autoTable({
    startY: 40,
    head: [['Category', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 70, halign: 'right' }
    }
  });
};

/**
 * Exports report data to PDF and triggers download
 */
export const exportToPDF = (
  reportType: ReportType,
  data: BalanceSheet | IncomeStatement | CashFlow | null,
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
    case 'cash-flow':
      generateCashFlowPDF(doc, data as CashFlow, dateRange);
      break;
  }

  // Save the PDF
  doc.save(`${reportType.replace('-', '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}; 