import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBalanceSheet, fetchIncomeStatement, type BalanceSheet, type IncomeStatement } from '../services/ReportService';
import { exportToCSV } from '../utils/exportUtils';
import { exportToPDF } from '../utils/pdfExportUtils';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { DateRange } from '../types/common';

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
  console.log('🔍 Reports component rendering');
  const { user } = useAuth();
  console.log('👤 Current user:', user);
  const [reportType, setReportType] = useState<'balance-sheet' | 'income-statement'>('balance-sheet');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  console.log('📅 Date range:', dateRange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);

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
    console.log('🔄 Reports useEffect triggered');
    const fetchReports = async () => {
      try {
        console.log('📥 Starting to fetch reports...');
        setLoading(true);
        setError(null);
        
        console.log('📊 Fetching balance sheet...');
        const balanceSheetData = await fetchBalanceSheet(dateRange.start, dateRange.end);
        console.log('📊 Balance sheet data received:', JSON.stringify(balanceSheetData, null, 2));
        
        console.log('💰 Fetching income statement...');
        const incomeStatementData = await fetchIncomeStatement(dateRange.start, dateRange.end);
        console.log('💰 Income statement data received:', JSON.stringify(incomeStatementData, null, 2));
        
        setBalanceSheet(balanceSheetData);
        setIncomeStatement(incomeStatementData);
        console.log('✅ Reports data set successfully');
      } catch (err) {
        console.error('❌ Error loading reports:', err);
        setError('Failed to load reports');
      } finally {
        setLoading(false);
        console.log('🏁 Loading finished');
      }
    };

    fetchReports();
  }, [dateRange.start, dateRange.end]);

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
                   (reportType === 'income-statement' && incomeStatement);

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

  // Helper function to properly capitalize subcategory names
  const formatSubcategoryName = (name: string): string => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const renderBalanceSheet = () => {
    if (!balanceSheet) return null;

    // Handle the actual backend response structure
    // Backend returns: { assets: SubcategoryGroup[], liabilities: SubcategoryGroup[], equity: SubcategoryGroup[] }
    // Where SubcategoryGroup = { subcategoryName: string, accounts: AccountBalance[], subtotal: number, displayOrder: number }

    return (
      <div className="space-y-6" role="region" aria-label="Balance Sheet report">
        <div>
          <h2 className="text-xl font-semibold mb-4">Assets</h2>
          <div className="space-y-4">
            {balanceSheet.assets.length > 0 ? (
              balanceSheet.assets.map((group, index) => (
                <div key={index}>
                  <h3 className="font-medium mb-2">{formatSubcategoryName(group.subcategoryName) || 'Other Assets'}</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200" aria-label={`${formatSubcategoryName(group.subcategoryName) || 'Assets'}`}>
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.accounts.map((account) => (
                          <tr key={account.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatAmount(account.balance)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total {formatSubcategoryName(group.subcategoryName) || 'Assets'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatAmount(group.subtotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No assets found for the selected period.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Liabilities</h2>
          <div className="space-y-4">
            {balanceSheet.liabilities.length > 0 ? (
              balanceSheet.liabilities.map((group, index) => (
                <div key={index}>
                  <h3 className="font-medium mb-2">{formatSubcategoryName(group.subcategoryName) || 'Other Liabilities'}</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200" aria-label={`${formatSubcategoryName(group.subcategoryName) || 'Liabilities'}`}>
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.accounts.map((account) => (
                          <tr key={account.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatAmount(account.balance)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total {formatSubcategoryName(group.subcategoryName) || 'Liabilities'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatAmount(group.subtotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No liabilities found for the selected period.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Equity</h2>
          <div className="space-y-4">
            {balanceSheet.equity.length > 0 ? (
              balanceSheet.equity.map((group, index) => (
                <div key={index}>
                  <h3 className="font-medium mb-2">{formatSubcategoryName(group.subcategoryName) || 'Equity'}</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200" aria-label={`${formatSubcategoryName(group.subcategoryName) || 'Equity'}`}>
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {group.accounts.map((account) => (
                          <tr key={account.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatAmount(account.balance)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total {formatSubcategoryName(group.subcategoryName) || 'Equity'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatAmount(group.subtotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No equity accounts found for the selected period.</p>
              </div>
            )}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total Income</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatAmount(incomeStatement.totalIncome)}</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total Expenses</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatAmount(incomeStatement.totalExpenses)}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Net Income</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatAmount(incomeStatement.netIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Update the formatCurrency calls to handle unknown types
  const formatAmount = (amount: unknown): string => {
    if (typeof amount === 'number') {
      return formatCurrency(amount);
    }
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      if (!isNaN(parsed)) {
        return formatCurrency(parsed);
      }
    }
    return formatCurrency(0);
  };

  return (
    <div className="container mx-auto px-4 py-8" lang="en">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex items-center gap-4">
          <div role="tablist" aria-label="Report type selection">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'balance-sheet' | 'income-statement')}
              className="border rounded px-3 py-2"
              aria-label="Select report type"
            >
              <option value="balance-sheet">Balance Sheet</option>
              <option value="income-statement">Income Statement</option>
            </select>
          </div>
          {renderExportButton()}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <label htmlFor="start-date" className="text-sm font-medium">
            Start Date:
          </label>
          <input
            id="start-date"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="border rounded px-3 py-2"
          />
          <label htmlFor="end-date" className="text-sm font-medium">
            End Date:
          </label>
          <input
            id="end-date"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading reports...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow">
          {reportType === 'balance-sheet' && renderBalanceSheet()}
          {reportType === 'income-statement' && renderIncomeStatement()}
        </div>
      )}
    </div>
  );
};

export default Reports;
