import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";
import { TransactionService } from "./transaction.service";
import { AccountService } from "./AccountService";
import { logInfo, logSuccess, logError } from '../utils/logger';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ExportOptions {
  format: 'csv' | 'pdf';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  filters?: {
    search?: string;
    type?: string;
    category?: string;
    accountId?: number;
    minAmount?: number;
    maxAmount?: number;
  };
  includeHeaders?: boolean;
  includeAccountDetails?: boolean;
  includeCategoryBreakdown?: boolean;
  groupBy?: 'date' | 'category' | 'account' | 'type';
}

export interface ExportResult {
  data: string | Buffer;
  filename: string;
  contentType: string;
  totalTransactions: number;
  totalAmount: number;
}

export class ExportService {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  async exportTransactions(userId: number, options: ExportOptions): Promise<ExportResult> {
    logInfo(`Starting transaction export for user ${userId}`, 'ExportService');

    try {
      // Get transactions with filters
      const transactions = await this.transactionService.getTransactionsWithFilters(userId, {
        search: options.filters?.search,
        type: options.filters?.type,
        category: options.filters?.category,
        accountId: options.filters?.accountId,
        minAmount: options.filters?.minAmount,
        maxAmount: options.filters?.maxAmount,
        startDate: options.dateRange?.startDate,
        endDate: options.dateRange?.endDate
      });

      // Get accounts for reference
      const accounts = await AccountService.getAccounts(userId.toString());

      if (options.format === 'csv') {
        return this.generateCSVExport(transactions, accounts);
      } else if (options.format === 'pdf') {
        return this.generatePDFExport(transactions);
      } else {
        throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      logError(`Error in exportTransactions: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ExportService');
      throw error;
    }
  }

  private async generateCSVExport(
    transactions: Transaction[], 
    accounts: Account[]
  ): Promise<ExportResult> {
    logInfo('Generating CSV export', 'ExportService');

    const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Create CSV headers
    const headers = [
      'Date',
      'Description',
      'Category',
      'Type',
      'Amount',
      'Account',
      'Entry Type',
      'Balance Impact'
    ];

    // Create CSV rows
    const rows = transactions.map(transaction => {
      const account = accountMap.get(transaction.entries?.[0]?.account?.id || 0);
      const entryType = transaction.entries?.[0]?.type || '';
      
      // Calculate balance impact based on account type and entry type
      let balanceImpact = '';
      if (account && entryType) {
        const amount = parseFloat(transaction.amount.toString());
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          balanceImpact = entryType === 'DEBIT' ? `+$${amount.toFixed(2)}` : `-$${amount.toFixed(2)}`;
        } else {
          balanceImpact = entryType === 'CREDIT' ? `+$${amount.toFixed(2)}` : `-$${amount.toFixed(2)}`;
        }
      }

      return [
        new Date(transaction.date).toLocaleDateString(),
        transaction.description,
        transaction.category || 'Uncategorized',
        transaction.type,
        `$${parseFloat(transaction.amount.toString()).toFixed(2)}`,
        account?.name || 'Unknown Account',
        entryType,
        balanceImpact
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;

    logSuccess(`CSV export generated with ${transactions.length} transactions`, 'ExportService');

    return {
      data: csvContent,
      filename,
      contentType: 'text/csv',
      totalTransactions: transactions.length,
      totalAmount
    };
  }

  private async generatePDFExport(
    transactions: Transaction[]
  ): Promise<ExportResult> {
    logInfo('Generating PDF export', 'ExportService');

    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { height } = page.getSize();

      // Embed the standard font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Set initial position
      let yPos = height - 50;
      const margin = 50;
      const lineHeight = 20;

      // Title
      page.drawText('TRANSACTION REPORT', {
        x: margin,
        y: yPos,
        size: 24,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      yPos -= 40;

      // Subtitle with date
      page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
        x: margin,
        y: yPos,
        size: 12,
        font: font,
        color: rgb(0.4, 0.4, 0.4)
      });
      yPos -= 30;

      // Summary information
      const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const incomeTransactions = transactions.filter(t => t.type === 'INCOME');
      const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      // Helper function to format currency with commas
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount);
      };

      // Helper function to format transaction types
      const formatTransactionType = (type: string) => {
        return type
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      page.drawText(`Total Transactions: ${transactions.length}`, {
        x: margin,
        y: yPos,
        size: 12,
        font: font,
        color: rgb(0, 0, 0)
      });
      yPos -= lineHeight;

      page.drawText(`Total Income: $${formatCurrency(totalIncome)}`, {
        x: margin,
        y: yPos,
        size: 12,
        font: font,
        color: rgb(0, 0.6, 0)
      });
      yPos -= lineHeight;

      page.drawText(`Total Expenses: $${formatCurrency(totalExpenses)}`, {
        x: margin,
        y: yPos,
        size: 12,
        font: font,
        color: rgb(0.8, 0, 0)
      });
      yPos -= lineHeight;

      page.drawText(`Net Amount: $${formatCurrency(totalAmount)}`, {
        x: margin,
        y: yPos,
        size: 14,
        font: boldFont,
        color: totalAmount >= 0 ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0)
      });
      yPos -= 40;

      // Table headers
      const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
      const columnWidths = [70, 180, 120, 120, 80];
      const startX = margin;

      // Draw header background
      page.drawRectangle({
        x: startX,
        y: yPos - 15,
        width: columnWidths.reduce((sum, width) => sum + width, 0),
        height: 20,
        color: rgb(0.9, 0.9, 0.9)
      });

      // Draw headers
      let currentX = startX;
      headers.forEach((header, index) => {
        page.drawText(header, {
          x: currentX + 5,
          y: yPos,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0)
        });
        currentX += columnWidths[index];
      });
      yPos -= 25;

      // Draw transaction rows
      let rowCount = 0;
      for (const transaction of transactions) {
        // Check if we need a new page
        if (yPos < 100) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPos = height - 50;
          
          // Redraw headers on new page
          page.drawRectangle({
            x: startX,
            y: yPos - 15,
            width: columnWidths.reduce((sum, width) => sum + width, 0),
            height: 20,
            color: rgb(0.9, 0.9, 0.9)
          });

          currentX = startX;
          headers.forEach((header, index) => {
            page.drawText(header, {
              x: currentX + 5,
              y: yPos,
              size: 10,
              font: boldFont,
              color: rgb(0, 0, 0)
            });
            currentX += columnWidths[index];
          });
          yPos -= 25;
        }

        const date = new Date(transaction.date).toLocaleDateString();
        const description = transaction.description.length > 25 ? 
          transaction.description.substring(0, 22) + '...' : transaction.description;
        const category = (transaction.category || 'Uncategorized').length > 15 ? 
          (transaction.category || 'Uncategorized').substring(0, 12) + '...' : (transaction.category || 'Uncategorized');
        const type = formatTransactionType(transaction.type);
        const amount = formatCurrency(parseFloat(transaction.amount.toString()));

        // Alternate row colors
        if (rowCount % 2 === 0) {
          page.drawRectangle({
            x: startX,
            y: yPos - 15,
            width: columnWidths.reduce((sum, width) => sum + width, 0),
            height: 18,
            color: rgb(0.98, 0.98, 0.98)
          });
        }

        // Draw row data
        currentX = startX;
        page.drawText(date, {
          x: currentX + 5,
          y: yPos,
          size: 9,
          font: font,
          color: rgb(0, 0, 0)
        });
        currentX += columnWidths[0];

        page.drawText(description, {
          x: currentX + 5,
          y: yPos,
          size: 9,
          font: font,
          color: rgb(0, 0, 0)
        });
        currentX += columnWidths[1];

        page.drawText(category, {
          x: currentX + 5,
          y: yPos,
          size: 9,
          font: font,
          color: rgb(0, 0, 0)
        });
        currentX += columnWidths[2];

        page.drawText(type, {
          x: currentX + 5,
          y: yPos,
          size: 9,
          font: font,
          color: rgb(0, 0, 0)
        });
        currentX += columnWidths[3];

        // Color code amounts based on type
        const amountColor = type === 'INCOME' ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0);
        page.drawText(amount, {
          x: currentX + 5,
          y: yPos,
          size: 9,
          font: font,
          color: amountColor
        });

        yPos -= 20;
        rowCount++;
      }

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save();
      const filename = `transactions_${new Date().toISOString().split('T')[0]}.pdf`;

      logSuccess(`PDF export generated with ${transactions.length} transactions`, 'ExportService');

      return {
        data: Buffer.from(pdfBytes),
        filename,
        contentType: 'application/pdf',
        totalTransactions: transactions.length,
        totalAmount
      };
    } catch (error) {
      logError(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ExportService');
      throw error;
    }
  }

  async generateFinancialSummary(userId: number, dateRange?: { startDate: string; endDate: string }): Promise<any> {
    logInfo(`Generating financial summary for user ${userId}`, 'ExportService');

    try {
      const transactions = await this.transactionService.getTransactionsWithFilters(userId, {
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate
      });

      const summary = {
        totalTransactions: transactions.length,
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        categoryBreakdown: new Map<string, number>(),
        typeBreakdown: new Map<string, number>(),
        monthlyBreakdown: new Map<string, number>()
      };

      transactions.forEach((transaction: Transaction) => {
        const amount = parseFloat(transaction.amount.toString());
        
        if (transaction.type === 'INCOME') {
          summary.totalIncome += amount;
        } else if (transaction.type === 'EXPENSE') {
          summary.totalExpenses += amount;
        }

        summary.netAmount = summary.totalIncome - summary.totalExpenses;

        // Category breakdown
        const category = transaction.category || 'Uncategorized';
        summary.categoryBreakdown.set(category, (summary.categoryBreakdown.get(category) || 0) + amount);

        // Type breakdown
        summary.typeBreakdown.set(transaction.type, (summary.typeBreakdown.get(transaction.type) || 0) + amount);

        // Monthly breakdown
        const month = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        summary.monthlyBreakdown.set(month, (summary.monthlyBreakdown.get(month) || 0) + amount);
      });

      logSuccess(`Financial summary generated for user ${userId}`, 'ExportService');
      return summary;
    } catch (error) {
      logError(`Error generating financial summary: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ExportService');
      throw error;
    }
  }
} 