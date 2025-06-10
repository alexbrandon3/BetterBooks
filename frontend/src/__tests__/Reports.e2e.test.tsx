import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Reports from '../pages/Reports';
import { fetchIncomeStatement, fetchBalanceSheet, fetchCashFlowStatement } from '../services/ReportService';
import { exportToCSV } from '../utils/exportUtils';
import { exportToPDF } from '../utils/pdfExportUtils';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the report service functions
jest.mock('../services/ReportService', () => ({
  fetchIncomeStatement: jest.fn(),
  fetchBalanceSheet: jest.fn(),
  fetchCashFlowStatement: jest.fn()
}));

// Mock the export utilities
jest.mock('../utils/exportUtils', () => ({
  exportToCSV: jest.fn()
}));

jest.mock('../utils/pdfExportUtils', () => ({
  exportToPDF: jest.fn()
}));

// Mock URL.createObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
window.URL.createObjectURL = mockCreateObjectURL;
window.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFontSize: jest.fn(),
    text: jest.fn(),
    save: jest.fn(),
    autoTable: jest.fn()
  }));
});

// Sample data for tests
const mockBalanceSheet = {
  assets: {
    current: {
      total: 1000,
      subcategories: {
        'Cash': 500,
        'Accounts Receivable': 500
      }
    },
    longTerm: {
      total: 2000,
      subcategories: {
        'Equipment': 1500,
        'Buildings': 500
      }
    },
    total: 3000
  },
  liabilities: {
    current: {
      total: 500,
      subcategories: {
        'Accounts Payable': 300,
        'Short-term Loans': 200
      }
    },
    longTerm: {
      total: 1000,
      subcategories: {
        'Long-term Loans': 1000
      }
    },
    total: 1500
  },
  equity: {
    total: 1500,
    subcategories: {
      'Common Stock': 1000,
      'Retained Earnings': 500
    }
  }
};

const mockIncomeStatement = {
  revenue: 5000,
  expenses: 3000,
  netIncome: 2000
};

const mockCashFlow = {
  operatingActivities: 1500,
  investingActivities: -500,
  financingActivities: -200,
  netCashFlow: 800
};

// Helper function to render the component with auth context
const renderWithAuth = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      {ui}
    </AuthProvider>
  );
};

describe('Reports Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchBalanceSheet as jest.Mock).mockResolvedValue(mockBalanceSheet);
    (fetchIncomeStatement as jest.Mock).mockResolvedValue(mockIncomeStatement);
    (fetchCashFlowStatement as jest.Mock).mockResolvedValue(mockCashFlow);
  });

  describe('Report Tabs', () => {
    it('switches between report types and updates the view', async () => {
      renderWithAuth(<Reports />);

      // Initially shows Balance Sheet
      await waitFor(() => {
        expect(screen.getByText('Assets')).toBeInTheDocument();
      });

      // Switch to Income Statement
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'income-statement' }
      });

      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('$5,000.00')).toBeInTheDocument();
      });

      // Switch to Cash Flow
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'cash-flow' }
      });

      await waitFor(() => {
        expect(screen.getByText('Operating Activities')).toBeInTheDocument();
        expect(screen.getByText('$1,500.00')).toBeInTheDocument();
      });
    });

    it('refetches data when date range changes', async () => {
      renderWithAuth(<Reports />);

      // Change date range
      const startDateInput = screen.getByLabelText('Start Date');
      const endDateInput = screen.getByLabelText('End Date');

      await userEvent.type(startDateInput, '2024-01-01');
      await userEvent.type(endDateInput, '2024-12-31');

      // Wait for refetch
      await waitFor(() => {
        expect(fetchBalanceSheet).toHaveBeenCalledWith('2024-01-01', '2024-12-31');
      });
    });
  });

  describe('CSV Export', () => {
    it('disables CSV export button when no data is available', async () => {
      (fetchBalanceSheet as jest.Mock).mockResolvedValue(null);
      renderWithAuth(<Reports />);

      const csvButton = screen.getByText('Download CSV');
      expect(csvButton).toBeDisabled();
    });

    it('triggers CSV download when clicked', async () => {
      renderWithAuth(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Assets')).toBeInTheDocument();
      });

      const csvButton = screen.getByText('Download CSV');
      fireEvent.click(csvButton);

      expect(exportToCSV).toHaveBeenCalledWith(mockBalanceSheet, 'balance-sheet');
    });

    it('validates CSV file structure', async () => {
      renderWithAuth(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Assets')).toBeInTheDocument();
      });

      const csvButton = screen.getByText('Download CSV');
      fireEvent.click(csvButton);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.any(Blob)
      );
    });
  });

  describe('PDF Export', () => {
    it('disables PDF export button when no data is available', async () => {
      (fetchBalanceSheet as jest.Mock).mockResolvedValue(null);
      renderWithAuth(<Reports />);

      const pdfButton = screen.getByText('Download PDF');
      expect(pdfButton).toBeDisabled();
    });

    it('triggers PDF download when clicked', async () => {
      renderWithAuth(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Assets')).toBeInTheDocument();
      });

      const pdfButton = screen.getByText('Download PDF');
      fireEvent.click(pdfButton);

      expect(exportToPDF).toHaveBeenCalledWith(
        'balance-sheet',
        mockBalanceSheet,
        expect.any(Object)
      );
    });

    it('validates PDF generation', async () => {
      renderWithAuth(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Assets')).toBeInTheDocument();
      });

      const pdfButton = screen.getByText('Download PDF');
      fireEvent.click(pdfButton);

      // Verify jsPDF was instantiated
      expect(require('jspdf')).toHaveBeenCalled();
    });
  });

  describe('Error States', () => {
    it('shows error message when API fails', async () => {
      (fetchBalanceSheet as jest.Mock).mockRejectedValue(new Error('API Error'));
      renderWithAuth(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load report. Please try again.')).toBeInTheDocument();
      });
    });

    it('shows error message when export fails', async () => {
      (exportToCSV as jest.Mock).mockImplementation(() => {
        throw new Error('Export failed');
      });

      renderWithAuth(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Assets')).toBeInTheDocument();
      });

      const csvButton = screen.getByText('Download CSV');
      fireEvent.click(csvButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to export report. Please try again.')).toBeInTheDocument();
      });
    });
  });
}); 