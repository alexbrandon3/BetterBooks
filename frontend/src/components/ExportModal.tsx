import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  exportTransactions, 
  ExportOptions, 
  validateExportOptions,
  getExportOptionsFromFilters,
  formatCurrency 
} from '../services/ExportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  totalTransactions: number;
  totalAmount: number;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  filters,
  totalTransactions,
  totalAmount
}) => {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [groupBy, setGroupBy] = useState<'date' | 'category' | 'account' | 'type' | undefined>(undefined);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeAccountDetails, setIncludeAccountDetails] = useState(true);
  const [includeCategoryBreakdown, setIncludeCategoryBreakdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const exportOptions: ExportOptions = {
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
          minAmount: filters.minAmount || undefined,
          maxAmount: filters.maxAmount || undefined
        },
        includeHeaders,
        includeAccountDetails,
        includeCategoryBreakdown,
        groupBy
      };

      // Validate export options
      const errors = validateExportOptions(exportOptions);
      if (errors.length > 0) {
        toast.error(errors[0]);
        return;
      }

      await exportTransactions(exportOptions);
      toast.success(`Export completed! ${totalTransactions} transactions exported.`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type) count++;
    if (filters.category) count++;
    if (filters.accountId) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    return count;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Export Transactions</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Export Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Transactions:</span> {totalTransactions}
              </div>
              <div>
                <span className="text-blue-600 font-medium">Total Amount:</span> {formatCurrency(totalAmount)}
              </div>
              <div>
                <span className="text-blue-600 font-medium">Active Filters:</span> {getActiveFiltersCount()}
              </div>
              <div>
                <span className="text-blue-600 font-medium">Format:</span> {format.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value as 'csv' | 'pdf')}
                    className="mr-2"
                  />
                  <span className="text-sm">CSV (Spreadsheet)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={(e) => setFormat(e.target.value as 'csv' | 'pdf')}
                    className="mr-2"
                  />
                  <span className="text-sm">PDF (Report)</span>
                </label>
              </div>
            </div>

            {/* Grouping Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group By (PDF only)
              </label>
              <select
                value={groupBy || ''}
                onChange={(e) => setGroupBy(e.target.value as any || undefined)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={format === 'csv'}
              >
                <option value="">No grouping</option>
                <option value="date">Date</option>
                <option value="category">Category</option>
                <option value="account">Account</option>
                <option value="type">Transaction Type</option>
              </select>
              {format === 'csv' && (
                <p className="text-xs text-gray-500 mt-1">Grouping is only available for PDF exports</p>
              )}
            </div>

            {/* CSV Options */}
            {format === 'csv' && (
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeHeaders}
                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Include column headers</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeAccountDetails}
                    onChange={(e) => setIncludeAccountDetails(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Include account details</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeCategoryBreakdown}
                    onChange={(e) => setIncludeCategoryBreakdown(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Include category breakdown</span>
                </label>
              </div>
            )}

            {/* PDF Options */}
            {format === 'pdf' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  PDF exports include professional formatting with summaries, charts, and detailed transaction listings.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isExporting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </div>
              ) : (
                `Export ${format.toUpperCase()}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal; 