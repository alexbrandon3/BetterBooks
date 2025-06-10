import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchIncomeStatement, fetchBalanceSheet, fetchCashFlowStatement, BalanceSheet, IncomeStatement, CashFlow } from '../services/ReportService';
import { exportToCSV } from '../utils/exportUtils';
import { exportToPDF } from '../utils/pdfExportUtils';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatUtils';

// Constants for pagination
const ITEMS_PER_PAGE = 10;

// Export options type
type ExportFormat = 'csv' | 'pdf';

interface ExportOption {
  label: string;
  value: ExportFormat;
  icon: string;
}

const exportOptions: ExportOption[] = [
  { label: 'Download as CSV', value: 'csv', icon: '📊' },
  { label: 'Download as PDF', value: 'pdf', icon: '📄' }
];

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [reportType, setReportType] = useState<'balance-sheet' | 'income-statement' | 'cash-flow'>('balance-sheet');
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, format?: ExportFormat) => {
    switch (event.key) {
      case 'Escape':
        setShowExportMenu(false);
        break;
      case 'Enter':
        if (format) {
          handleExport(format);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (format) {
          const currentIndex = exportOptions.findIndex(opt => opt.value === format);
          const nextIndex = (currentIndex + 1) % exportOptions.length;
          const nextOption = exportOptions[nextIndex];
          const nextButton = document.querySelector(`[data-export-option="${nextOption.value}"]`) as HTMLButtonElement;
          nextButton?.focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (format) {
          const currentIndex = exportOptions.findIndex(opt => opt.value === format);
          const prevIndex = (currentIndex - 1 + exportOptions.length) % exportOptions.length;
          const prevOption = exportOptions[prevIndex];
          const prevButton = document.querySelector(`[data-export-option="${prevOption.value}"]`) as HTMLButtonElement;
          prevButton?.focus();
        }
        break;
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        switch (reportType) {
          case 'income-statement':
            const incomeData = await fetchIncomeStatement(dateRange.start, dateRange.end);
            setIncomeStatement(incomeData);
            break;
          case 'balance-sheet':
            const balanceData = await fetchBalanceSheet();
            setBalanceSheet(balanceData);
            break;
          case 'cash-flow':
            const cashData = await fetchCashFlowStatement(dateRange.start, dateRange.end);
            setCashFlow(cashData);
            break;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [reportType, dateRange.start, dateRange.end]);

  const handleExport = async (format: ExportFormat) => {
    if (exporting) return;
    
    setExporting(true);
    try {
      switch (reportType) {
        case 'balance-sheet':
          if (balanceSheet) {
            if (format === 'csv') {
              exportToCSV(balanceSheet, 'balance-sheet');
            } else {
              exportToPDF('balance-sheet', balanceSheet, dateRange);
            }
          }
          break;
        case 'income-statement':
          if (incomeStatement) {
            if (format === 'csv') {
              exportToCSV(incomeStatement, 'income-statement');
            } else {
              exportToPDF('income-statement', incomeStatement, dateRange);
            }
          }
          break;
        case 'cash-flow':
          if (cashFlow) {
            if (format === 'csv') {
              exportToCSV(cashFlow, 'cash-flow');
            } else {
              exportToPDF('cash-flow', cashFlow, dateRange);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  };

  const renderExportButton = () => {
    const hasData = (reportType === 'balance-sheet' && balanceSheet) ||
                   (reportType === 'income-statement' && incomeStatement) ||
                   (reportType === 'cash-flow' && cashFlow);

    return (
      <div className="relative" ref={exportMenuRef} data-testid="export-button-container">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={!hasData || exporting}
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            !hasData || exporting
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          aria-label="Export options"
          aria-expanded={showExportMenu}
          aria-haspopup="true"
          data-testid="export-button"
        >
          {exporting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </span>
          ) : (
            <>
              <span>Export</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>

        {showExportMenu && (
          <div 
            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="export-menu"
            data-testid="export-menu"
          >
            {exportOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleExport(option.value)}
                onKeyDown={(e) => handleKeyDown(e, option.value)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                role="menuitem"
                aria-label={`Export as ${option.label}`}
                disabled={exporting}
                data-export-option={option.value}
                data-testid={`export-option-${option.value}`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPagination = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-4" role="navigation" aria-label="Pagination">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border disabled:opacity-50"
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="text-sm" aria-live="polite">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border disabled:opacity-50"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!balanceSheet) return null;

    return (
      <div className="space-y-6" role="region" aria-label="Balance Sheet report">
        <div>
          <h2 className="text-xl font-semibold mb-4">Assets</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Current Assets</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Current Assets">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(balanceSheet.assets.current.subcategories).map(([name, amount]) => (
                      <tr key={name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Current Assets</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(balanceSheet.assets.current.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Long-term Assets</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Long-term Assets">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(balanceSheet.assets.longTerm.subcategories).map(([name, amount]) => (
                      <tr key={name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Long-term Assets</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(balanceSheet.assets.longTerm.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Liabilities</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Current Liabilities</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Current Liabilities">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(balanceSheet.liabilities.current.subcategories).map(([name, amount]) => (
                      <tr key={name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Current Liabilities</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(balanceSheet.liabilities.current.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Long-term Liabilities</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" aria-label="Long-term Liabilities">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(balanceSheet.liabilities.longTerm.subcategories).map(([name, amount]) => (
                      <tr key={name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Long-term Liabilities</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(balanceSheet.liabilities.longTerm.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Equity</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" aria-label="Equity">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(balanceSheet.equity.subcategories).map(([name, amount]) => (
                  <tr key={name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(amount)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Equity</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(balanceSheet.equity.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (!incomeStatement) return null;

    return (
      <div className="space-y-6" role="region" aria-label="Income Statement report">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" aria-label="Income Statement">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Revenue</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(incomeStatement.revenue)}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Expenses</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(incomeStatement.expenses)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Net Income</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(incomeStatement.netIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCashFlowStatement = () => {
    if (!cashFlow) return null;

    return (
      <div className="space-y-6" role="region" aria-label="Cash Flow Statement report">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" aria-label="Cash Flow Statement">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Operating Activities</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(cashFlow.operatingActivities)}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Investing Activities</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(cashFlow.investingActivities)}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Financing Activities</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(cashFlow.financingActivities)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Net Cash Flow</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(cashFlow.netCashFlow)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8" lang="en">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex items-center gap-4">
          <div role="tablist" aria-label="Report type selection">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'balance-sheet' | 'income-statement' | 'cash-flow')}
              className="border rounded px-3 py-2"
              aria-label="Select report type"
            >
              <option value="balance-sheet" role="tab">Balance Sheet</option>
              <option value="income-statement" role="tab">Income Statement</option>
              <option value="cash-flow" role="tab">Cash Flow Statement</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border rounded px-3 py-2"
              aria-label="Start date"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border rounded px-3 py-2"
              aria-label="End date"
            />
          </div>

          {renderExportButton()}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          {reportType === 'balance-sheet' && renderBalanceSheet()}
          {reportType === 'income-statement' && renderIncomeStatement()}
          {reportType === 'cash-flow' && renderCashFlowStatement()}
        </div>
      )}
    </div>
  );
};

export default Reports;
