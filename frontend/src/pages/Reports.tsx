import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { fetchBalanceSheet, fetchIncomeStatement, type BalanceSheet, type IncomeStatement } from '../services/ReportService';
import { exportToCSV } from '../utils/exportUtils';
import { exportToPDF } from '../utils/pdfExportUtils';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { DateRange } from '../types/common';
import { toast } from 'react-hot-toast';
import { useDrilldown } from '../hooks/useDrilldown';
import DrilldownModal from '../components/DrilldownModal';
import CloseBooksModal from '../components/reports/CloseBooksModal';

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

// Helper to format enum-like strings to title case with spaces
function formatEnumLabel(str: string): string {
  return str
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to format account counts with proper grammar
function formatAccountCount(count: number, label: string = 'account'): string {
  if (count === 0) {
    return `No ${label}s`;
  } else if (count === 1) {
    return `1 ${label}`;
  } else {
    return `${count} ${label}s`;
  }
}

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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const drilldown = useDrilldown();
  const [isCloseBooksModalOpen, setIsCloseBooksModalOpen] = useState(false);

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
  const handleKeyDown = useCallback((event: React.KeyboardEvent, format?: ExportFormat) => {
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
  }, []);

  useEffect(() => {
    console.log('🔄 Reports useEffect triggered');
    const fetchReports = async () => {
      try {
        console.log('📥 Starting to fetch reports...');
        setLoading(true);
        setError(null);
        
        console.log('📊 Fetching balance sheet...');
        const balanceSheetData = await fetchBalanceSheet();
        console.log('📊 Balance sheet data received:', JSON.stringify(balanceSheetData, null, 2));
        
        console.log('💰 Fetching income statement...');
        const incomeStatementData = await fetchIncomeStatement(dateRange.start, dateRange.end);
        console.log('💰 Income statement data received:', JSON.stringify(incomeStatementData, null, 2));
        
        setBalanceSheet(balanceSheetData);
        setIncomeStatement(incomeStatementData);
        console.log('✅ Reports data set successfully');
      } catch (err) {
        console.error('❌ Error loading reports:', err);
        setError('Failed to load reports. Please try again.');
        toast.error('Failed to load reports. Please try again.');
      } finally {
        setLoading(false);
        console.log('🏁 Loading finished');
      }
    };

    fetchReports();
  }, [dateRange.start, dateRange.end]);

  const handleExport = useCallback(async (format: ExportFormat) => {
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
      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export report. Please try again.');
      toast.error('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  }, [exporting, reportType, balanceSheet, incomeStatement, dateRange]);

  // Memoize the hasData check to prevent unnecessary re-renders
  const hasData = useMemo(() => {
    return (reportType === 'balance-sheet' && balanceSheet) ||
           (reportType === 'income-statement' && incomeStatement);
  }, [reportType, balanceSheet, incomeStatement]);

  const renderExportButton = () => {
    return (
      <div className="relative" ref={exportMenuRef} data-testid="export-button-container">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={!hasData || exporting}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
            !hasData || exporting
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>

        {showExportMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            <div className="py-1">
              {exportOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleExport(option.value)}
                  onKeyDown={(e) => handleKeyDown(e, option.value)}
                  data-export-option={option.value}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors duration-150"
                  role="menuitem"
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!balanceSheet) return null;

    const totalAssets = balanceSheet.assets.reduce((sum, group) => sum + group.subtotal, 0);
    const totalLiabilities = balanceSheet.liabilities.reduce((sum, group) => sum + group.subtotal, 0);
    const totalEquity = balanceSheet.equity.reduce((sum, group) => sum + group.subtotal, 0);
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    return (
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Total Assets</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAssets)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {formatAccountCount(balanceSheet.assets.reduce((sum, group) => sum + group.accounts.length, 0))}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Total Liabilities</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalLiabilities)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {formatAccountCount(balanceSheet.liabilities.reduce((sum, group) => sum + group.accounts.length, 0))}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Total Equity</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEquity)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {formatAccountCount(balanceSheet.equity.reduce((sum, group) => sum + group.accounts.length, 0))}
            </p>
          </div>
        </div>

        {/* Balance Sheet Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Balance Sheet</h2>
            <p className="text-sm text-gray-600 mt-1">As of {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Assets */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                Assets
              </h3>
              <div className="space-y-3">
                {balanceSheet.assets.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-2">
                    <div 
                      className="flex justify-between items-center py-2 px-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleDrilldownClick(
                        `Balance Sheet → Assets → ${formatEnumLabel(group.subcategoryName)}`,
                        'asset',
                        undefined,
                        group.subcategoryName
                      )}
                      title="View details"
                    >
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatEnumLabel(group.subcategoryName)}</p>
                          <p className="text-xs text-gray-500">Subcategory</p>
                        </div>
                        <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(group.subtotal)}
                      </p>
                    </div>
                    {group.accounts.map((account, accountIndex) => (
                      <div 
                        key={accountIndex} 
                        className="flex justify-between items-center py-2 px-6 bg-gray-50 rounded-lg ml-4 hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
                        onClick={() => handleDrilldownClick(
                          `Balance Sheet → Assets → ${formatEnumLabel(group.subcategoryName)} → ${account.name}`,
                          'asset',
                          account.id,
                          undefined
                        )}
                        title="View details"
                      >
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{account.name}</p>
                            <p className="text-xs text-gray-500">Account</p>
                          </div>
                          <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(account.balance)}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex justify-between items-center py-4 px-4 bg-green-100 rounded-lg border-2 border-green-300">
                  <p className="font-semibold text-gray-900">Total Assets</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(totalAssets)}</p>
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                Liabilities
              </h3>
              <div className="space-y-3">
                {balanceSheet.liabilities.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-2">
                    <div 
                      className="flex justify-between items-center py-2 px-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleDrilldownClick(
                        `Balance Sheet → Liabilities → ${formatEnumLabel(group.subcategoryName)}`,
                        'liability',
                        undefined,
                        group.subcategoryName
                      )}
                      title="View details"
                    >
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatEnumLabel(group.subcategoryName)}</p>
                          <p className="text-xs text-gray-500">Subcategory</p>
                        </div>
                        <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(group.subtotal)}
                      </p>
                    </div>
                    {group.accounts.map((account, accountIndex) => (
                      <div 
                        key={accountIndex} 
                        className="flex justify-between items-center py-2 px-6 bg-gray-50 rounded-lg ml-4 hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
                        onClick={() => handleDrilldownClick(
                          `Balance Sheet → Liabilities → ${formatEnumLabel(group.subcategoryName)} → ${account.name}`,
                          'liability',
                          account.id,
                          undefined
                        )}
                        title="View details"
                      >
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{account.name}</p>
                            <p className="text-xs text-gray-500">Account</p>
                          </div>
                          <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(account.balance)}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex justify-between items-center py-4 px-4 bg-red-100 rounded-lg border-2 border-red-300">
                  <p className="font-semibold text-gray-900">Total Liabilities</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(totalLiabilities)}</p>
                </div>
              </div>
            </div>

            {/* Equity */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                Equity
              </h3>
              <div className="space-y-3">
                {balanceSheet.equity.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-2">
                    <div 
                      className="flex justify-between items-center py-2 px-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleDrilldownClick(
                        `Balance Sheet → Equity → ${formatEnumLabel(group.subcategoryName)}`,
                        'equity',
                        undefined,
                        group.subcategoryName
                      )}
                      title="View details"
                    >
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatEnumLabel(group.subcategoryName)}</p>
                          <p className="text-xs text-gray-500">Subcategory</p>
                        </div>
                        <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(group.subtotal)}
                      </p>
                    </div>
                    {group.accounts.map((account, accountIndex) => (
                      <div 
                        key={accountIndex} 
                        className="flex justify-between items-center py-2 px-6 bg-gray-50 rounded-lg ml-4 hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
                        onClick={() => handleDrilldownClick(
                          `Balance Sheet → Equity → ${formatEnumLabel(group.subcategoryName)} → ${account.name}`,
                          'equity',
                          account.id,
                          undefined
                        )}
                        title="View details"
                      >
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{account.name}</p>
                            <p className="text-xs text-gray-500">Account</p>
                          </div>
                          <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(account.balance)}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex justify-between items-center py-4 px-4 bg-blue-100 rounded-lg border-2 border-blue-300">
                  <p className="font-semibold text-gray-900">Total Equity</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(totalEquity)}</p>
                </div>
              </div>
            </div>

            {/* Balance Sheet Equation */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-2">Balance Sheet Equation</p>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Assets = Liabilities + Equity
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {formatCurrency(totalAssets)} = {formatCurrency(totalLiabilities)} + {formatCurrency(totalEquity)}
                </p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isBalanced 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isBalanced ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Balanced
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Not Balanced
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIncomeStatement = () => {
    if (!incomeStatement) return null;

    const totalRevenue = incomeStatement.revenue.reduce((sum, group) => sum + group.subtotal, 0);
    const totalExpenses = incomeStatement.expenses.reduce((sum, group) => sum + group.subtotal, 0);
    const netIncome = incomeStatement.netIncome;

    return (
      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {formatAccountCount(incomeStatement.revenue.reduce((sum, group) => sum + group.accounts.length, 0))} revenue sources
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {formatAccountCount(incomeStatement.expenses.reduce((sum, group) => sum + group.accounts.length, 0))} expense categories
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <svg className={`w-6 h-6 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Net Income</span>
            </div>
            <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netIncome)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {netIncome >= 0 ? 'Profit' : 'Loss'} for the period
            </p>
          </div>
        </div>

        {/* Income Statement Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Income Statement</h2>
            <p className="text-sm text-gray-600 mt-1">For the period ending {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Revenue */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                Revenue
              </h3>
              <div className="space-y-3">
                {incomeStatement.revenue.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-2">
                    <div 
                      className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleDrilldownClick(
                        `Income Statement → Revenue → ${formatEnumLabel(group.subcategoryName)}`,
                        'income',
                        undefined,
                        group.subcategoryName
                      )}
                      title="View details"
                    >
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatEnumLabel(group.subcategoryName)}</p>
                          <p className="text-xs text-gray-500">Revenue Category</p>
                        </div>
                        <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(group.subtotal)}
                      </p>
                    </div>
                    {group.accounts.map((account, accountIndex) => (
                      <div 
                        key={accountIndex} 
                        className="flex justify-between items-center py-2 px-6 bg-gray-50 rounded-lg ml-4 hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
                        onClick={() => handleDrilldownClick(
                          `Income Statement → Revenue → ${formatEnumLabel(group.subcategoryName)} → ${account.name}`,
                          'income',
                          account.id,
                          undefined
                        )}
                        title="View details"
                      >
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{account.name}</p>
                            <p className="text-xs text-gray-500">Account</p>
                          </div>
                          <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(account.balance)}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex justify-between items-center py-4 px-4 bg-green-100 rounded-lg border-2 border-green-300">
                  <p className="font-semibold text-gray-900">Total Revenue</p>
                  <p className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                Expenses
              </h3>
              <div className="space-y-3">
                {incomeStatement.expenses.map((group, groupIndex) => (
                  <div key={groupIndex} className="space-y-2">
                    <div 
                      className="flex justify-between items-center py-3 px-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleDrilldownClick(
                        `Income Statement → Expenses → ${formatEnumLabel(group.subcategoryName)}`,
                        'expense',
                        undefined,
                        group.subcategoryName
                      )}
                      title="View details"
                    >
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatEnumLabel(group.subcategoryName)}</p>
                          <p className="text-xs text-gray-500">Expense Category</p>
                        </div>
                        <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-red-600">
                        {formatCurrency(group.subtotal)}
                      </p>
                    </div>
                    {group.accounts.map((account, accountIndex) => (
                      <div 
                        key={accountIndex} 
                        className="flex justify-between items-center py-2 px-6 bg-gray-50 rounded-lg ml-4 hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
                        onClick={() => handleDrilldownClick(
                          `Income Statement → Expenses → ${formatEnumLabel(group.subcategoryName)} → ${account.name}`,
                          'expense',
                          account.id,
                          undefined
                        )}
                        title="View details"
                      >
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{account.name}</p>
                            <p className="text-xs text-gray-500">Account</p>
                          </div>
                          <svg className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-red-600">
                          {formatCurrency(account.balance)}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex justify-between items-center py-4 px-4 bg-red-100 rounded-lg border-2 border-red-300">
                  <p className="font-semibold text-gray-900">Total Expenses</p>
                  <p className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
                </div>
              </div>
            </div>

            {/* Net Income */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-900">Net Income</p>
                <p className={`text-lg font-semibold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netIncome)}
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {netIncome >= 0 ? 'Profit' : 'Loss'} for the period
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const formatAmount = (amount: unknown): string => {
    if (typeof amount === 'number') {
      return formatCurrency(amount);
    }
    if (typeof amount === 'string') {
      const num = parseFloat(amount);
      return isNaN(num) ? formatCurrency(0) : formatCurrency(num);
    }
    return formatCurrency(0);
  };

  // Drill-down click handlers
  const handleDrilldownClick = (
    reportSection: string,
    type: string,
    accountId?: number,
    subcategory?: string
  ) => {
    console.log('🔍 Drill-down clicked:', { reportSection, type, accountId, subcategory });
    drilldown.openDrilldown(
      reportSection,
      type,
      accountId,
      subcategory,
      dateRange.start,
      dateRange.end
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            
            {/* Controls Skeleton */}
            <div className="h-12 bg-gray-200 rounded w-1/2 mb-8"></div>
            
            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            
            {/* Report Skeleton */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Financial Reports
              </h1>
              <p className="text-gray-600 text-lg">
                Comprehensive financial statements and analysis for better decision making
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setIsCloseBooksModalOpen(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Close Books</span>
              </button>
              <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Reports</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Report Type Selector */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Report Type:</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setReportType('balance-sheet')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      reportType === 'balance-sheet'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Balance Sheet
                  </button>
                  <button
                    onClick={() => setReportType('income-statement')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      reportType === 'income-statement'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Income Statement
                  </button>
                </div>
              </div>

              {/* Date Range Selector */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Date Range:</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Export Button */}
            {renderExportButton()}
          </div>
        </div>

        {/* Report Content */}
        {reportType === 'balance-sheet' ? renderBalanceSheet() : renderIncomeStatement()}

        {/* Drill-down Modal */}
        <DrilldownModal
          isOpen={drilldown.isOpen}
          onClose={drilldown.closeDrilldown}
          reportSection={drilldown.reportSection}
          type={drilldown.type}
          accountId={drilldown.accountId}
          subcategory={drilldown.subcategory}
          startDate={drilldown.startDate}
          endDate={drilldown.endDate}
        />

        {/* Close Books Modal */}
        <CloseBooksModal
          isOpen={isCloseBooksModalOpen}
          onClose={() => setIsCloseBooksModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Reports;
