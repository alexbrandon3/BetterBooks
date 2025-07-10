import api from "../utils/axios";

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
    accountId?: string;
    minAmount?: string;
    maxAmount?: string;
  };
  includeHeaders?: boolean;
  includeAccountDetails?: boolean;
  includeCategoryBreakdown?: boolean;
  groupBy?: 'date' | 'category' | 'account' | 'type';
}

export interface FinancialSummary {
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  categoryBreakdown: Map<string, number>;
  typeBreakdown: Map<string, number>;
  monthlyBreakdown: Map<string, number>;
}

export const exportTransactions = async (options: ExportOptions): Promise<void> => {
  try {
    const response = await api.post("/transactions/export", options, {
      responseType: 'blob'
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from response headers or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'transactions.csv';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting transactions:", error);
    throw error;
  }
};

export const generateFinancialSummary = async (dateRange?: { startDate: string; endDate: string }): Promise<FinancialSummary> => {
  try {
    const response = await api.post("/transactions/financial-summary", { dateRange });
    return response.data;
  } catch (error) {
    console.error("Error generating financial summary:", error);
    throw error;
  }
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Helper function to generate export filename
export const generateExportFilename = (format: string, dateRange?: { startDate: string; endDate: string }): string => {
  const date = new Date().toISOString().split('T')[0];
  const range = dateRange ? `_${dateRange.startDate}_to_${dateRange.endDate}` : '';
  return `betterbooks_export_${date}${range}.${format}`;
};

// Helper function to validate export options
export const validateExportOptions = (options: ExportOptions): string[] => {
  const errors: string[] = [];

  if (!options.format || !['csv', 'pdf'].includes(options.format)) {
    errors.push('Invalid format. Must be "csv" or "pdf"');
  }

  if (options.dateRange) {
    if (options.dateRange.startDate && options.dateRange.endDate) {
      const startDate = new Date(options.dateRange.startDate);
      const endDate = new Date(options.dateRange.endDate);
      if (startDate > endDate) {
        errors.push('Start date must be before end date');
      }
    }
  }

  if (options.filters?.minAmount && options.filters?.maxAmount) {
    const min = parseFloat(options.filters.minAmount);
    const max = parseFloat(options.filters.maxAmount);
    if (min > max) {
      errors.push('Minimum amount must be less than maximum amount');
    }
  }

  return errors;
};

// Helper function to get export options from current filters
export const getExportOptionsFromFilters = (
  filters: any,
  format: 'csv' | 'pdf' = 'csv',
  groupBy?: 'date' | 'category' | 'account' | 'type'
): ExportOptions => {
  return {
    format,
    dateRange: filters.startDate || filters.endDate ? {
      startDate: filters.startDate || '',
      endDate: filters.endDate || ''
    } : undefined,
    filters: {
      search: filters.search || undefined,
      type: filters.type || undefined,
      category: filters.category || undefined,
      accountId: filters.accountId || undefined,
      minAmount: filters.minAmount ? filters.minAmount : undefined,
      maxAmount: filters.maxAmount ? filters.maxAmount : undefined
    },
    includeHeaders: true,
    includeAccountDetails: true,
    includeCategoryBreakdown: false,
    groupBy
  };
}; 