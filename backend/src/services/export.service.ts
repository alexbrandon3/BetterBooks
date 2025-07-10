import { Transaction } from "../entities/Transaction";
import { Account } from "../entities/Account";
import { TransactionService } from "./transaction.service";
import { AccountService } from "./AccountService";
import { logInfo, logSuccess, logError } from '../utils/logger';

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
  data: string;
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

    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Generate HTML content for PDF
    const htmlContent = this.generatePDFHTML(transactions, totalAmount);

    // For now, return HTML content as a downloadable file
    // In production, you might want to use a service like wkhtmltopdf or a cloud PDF service
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.html`;

    logSuccess(`HTML export generated with ${transactions.length} transactions`, 'ExportService');

    return {
      data: htmlContent,
      filename,
      contentType: 'text/html',
      totalTransactions: transactions.length,
      totalAmount
    };
  }

  private generatePDFHTML(
    transactions: Transaction[], 
    totalAmount: number
  ): string {
    // Group transactions by date for better organization
    const groups = new Map();
    transactions.forEach((transaction: Transaction) => {
      const key = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(transaction);
    });
    const groupedTransactions = Array.from(groups.entries()).map(([key, transactions]) => ({
      group: key,
      transactions: transactions as Transaction[]
    }));

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Transaction Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .summary-item { text-align: center; }
        .summary-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .summary-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
        .group { margin-bottom: 30px; }
        .group-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #495057; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .amount-positive { color: #28a745; }
        .amount-negative { color: #dc3545; }
        .type-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .type-INCOME { background: #d4edda; color: #155724; }
        .type-EXPENSE { background: #f8d7da; color: #721c24; }
        .type-TRANSFER { background: #d1ecf1; color: #0c5460; }
        .footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Transaction Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="summary">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-value">${transactions.length}</div>
                <div class="summary-label">Total Transactions</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">$${totalAmount.toFixed(2)}</div>
                <div class="summary-label">Total Amount</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${new Set(transactions.map(t => t.category)).size}</div>
                <div class="summary-label">Unique Categories</div>
            </div>
            <div class="summary-item">
                <div class="summary-value">${new Set(transactions.map(t => t.type)).size}</div>
                <div class="summary-label">Transaction Types</div>
            </div>
        </div>
    </div>

    ${groupedTransactions.map(group => `
        <div class="group">
            <div class="group-title">${group.group}</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Account</th>
                    </tr>
                </thead>
                <tbody>
                    ${group.transactions.map((transaction: Transaction) => {
                        const amount = parseFloat(transaction.amount.toString());
                        const isPositive = transaction.type === 'INCOME';
                        
                        return `
                            <tr>
                                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                                <td>${transaction.description}</td>
                                <td>${transaction.category || 'Uncategorized'}</td>
                                <td><span class="type-badge type-${transaction.type}">${transaction.type}</span></td>
                                <td class="${isPositive ? 'amount-positive' : 'amount-negative'}">
                                    ${isPositive ? '+' : ''}$${amount.toFixed(2)}
                                </td>
                                <td>${transaction.entries?.[0]?.account?.name || 'Unknown Account'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `).join('')}

    <div class="footer">
        <p>Report generated by BetterBooks - Small Business Accounting</p>
    </div>
</body>
</html>`;

    return html;
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