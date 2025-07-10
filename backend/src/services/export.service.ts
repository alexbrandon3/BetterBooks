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

    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Generate a simple text report instead of PDF for now
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.report`;

    let reportContent = 'TRANSACTION REPORT\n';
    reportContent += '==================\n\n';
    reportContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
    reportContent += `Total Transactions: ${transactions.length}\n`;
    reportContent += `Total Amount: $${totalAmount.toFixed(2)}\n\n`;
    reportContent += 'Date\t\tDescription\t\tCategory\t\tType\t\tAmount\n';
    reportContent += '----\t\t-----------\t\t--------\t\t----\t\t------\n';

    // Add transaction data
    for (const transaction of transactions) {
      const date = new Date(transaction.date).toLocaleDateString();
      const description = transaction.description.length > 20 ? 
        transaction.description.substring(0, 17) + '...' : transaction.description.padEnd(20);
      const category = (transaction.category || 'Uncategorized').padEnd(15);
      const type = transaction.type.padEnd(10);
      const amount = parseFloat(transaction.amount.toString()).toFixed(2);
      
      reportContent += `${date}\t\t${description}\t\t${category}\t\t${type}\t\t$${amount}\n`;
    }

    logSuccess(`Text report generated with ${transactions.length} transactions`, 'ExportService');

    return {
      data: reportContent,
      filename,
      contentType: 'text/plain',
      totalTransactions: transactions.length,
      totalAmount
    };
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