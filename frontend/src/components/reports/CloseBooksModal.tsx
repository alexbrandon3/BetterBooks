import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';
import api from '../../utils/axios';

interface CloseBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PeriodType = 'monthly' | 'quarterly' | 'yearly';

interface ClosingEntryPreview {
  revenueAccounts: Array<{
    accountId: number;
    accountName: string;
    balance: number;
  }>;
  expenseAccounts: Array<{
    accountId: number;
    accountName: string;
    balance: number;
  }>;
  netIncome: number;
  totalEntries: number;
}

interface CloseBooksResponse {
  success: boolean;
  message: string;
  error?: string;
  transactionId?: string;
  netIncome?: number;
  entriesCreated?: number;
}

const CloseBooksModal: React.FC<CloseBooksModalProps> = ({ isOpen, onClose }) => {
  const [selectedPeriodType, setSelectedPeriodType] = useState<PeriodType>('monthly');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [preview, setPreview] = useState<ClosingEntryPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAlreadyClosed, setIsAlreadyClosed] = useState(false);

  // Set default period to current month
  useEffect(() => {
    if (isOpen && !selectedPeriod) {
      const now = new Date();
      if (selectedPeriodType === 'monthly') {
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setSelectedPeriod(format(lastDayOfMonth, 'yyyy-MM-dd'));
      } else if (selectedPeriodType === 'quarterly') {
        const quarter = Math.floor(now.getMonth() / 3);
        const lastMonthOfQuarter = (quarter + 1) * 3 - 1;
        const lastDayOfQuarter = new Date(now.getFullYear(), lastMonthOfQuarter + 1, 0);
        setSelectedPeriod(format(lastDayOfQuarter, 'yyyy-MM-dd'));
      } else if (selectedPeriodType === 'yearly') {
        const lastDayOfYear = new Date(now.getFullYear(), 11, 31);
        setSelectedPeriod(format(lastDayOfYear, 'yyyy-MM-dd'));
      }
    }
  }, [isOpen, selectedPeriod, selectedPeriodType]);

  const handlePreview = async () => {
    if (!selectedPeriod) {
      toast.error('Please select a period');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/books/preview', {
        periodEndDate: selectedPeriod,
        periodType: selectedPeriodType
      });

      const data = response.data;

      if (data.success) {
        setPreview(data.preview);
        setIsAlreadyClosed(false);
        toast.success('Preview generated successfully');
      } else {
        // Check if it's already closed
        if (data.error?.includes('already closed')) {
          setIsAlreadyClosed(true);
          setPreview(null);
          toast.error(data.error);
        } else {
          toast.error(data.error || 'Failed to generate preview');
        }
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseBooks = async () => {
    if (!selectedPeriod) {
      toast.error('Please select a period');
      return;
    }

    setIsClosing(true);
    try {
      const response = await api.post('/books/close', {
        periodEndDate: selectedPeriod,
        periodType: selectedPeriodType
      });

      const data: CloseBooksResponse = response.data;

      if (data.success) {
        toast.success(data.message);
        onClose();
        // Reset state
        setPreview(null);
        setIsAlreadyClosed(false);
      } else {
        toast.error(data.error || 'Failed to close books');
      }
    } catch (error) {
      console.error('Error closing books:', error);
      toast.error('Failed to close books');
    } finally {
      setIsClosing(false);
    }
  };

  const formatPeriodDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM yyyy');
  };

  const getPeriodOptions = () => {
    const options = [];
    const now = new Date();
    
    if (selectedPeriodType === 'monthly') {
      // Generate options for the last 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 0);
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        options.push({
          value: format(lastDayOfMonth, 'yyyy-MM-dd'),
          label: format(lastDayOfMonth, 'MMMM yyyy')
        });
      }
    } else if (selectedPeriodType === 'quarterly') {
      // Generate options for the last 8 quarters
      for (let i = 0; i < 8; i++) {
        const quarter = Math.floor(now.getMonth() / 3) - i;
        const year = now.getFullYear() + Math.floor(quarter / 4);
        const quarterInYear = ((quarter % 4) + 4) % 4;
        const lastMonthOfQuarter = (quarterInYear + 1) * 3 - 1;
        const lastDayOfQuarter = new Date(year, lastMonthOfQuarter + 1, 0);
        options.push({
          value: format(lastDayOfQuarter, 'yyyy-MM-dd'),
          label: `Q${quarterInYear + 1} ${year}`
        });
      }
    } else if (selectedPeriodType === 'yearly') {
      // Generate options for the last 5 years
      for (let i = 0; i < 5; i++) {
        const year = now.getFullYear() - i;
        const lastDayOfYear = new Date(year, 11, 31);
        options.push({
          value: format(lastDayOfYear, 'yyyy-MM-dd'),
          label: `${year}`
        });
      }
    }
    
    return options;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Close Books</h2>
              <p className="text-sm text-gray-600">Generate closing entries for the selected period</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Period Selection */}
          <div className="space-y-4">
            {/* Period Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Type
              </label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedPeriodType('monthly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    selectedPeriodType === 'monthly'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedPeriodType('quarterly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    selectedPeriodType === 'quarterly'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Quarterly
                </button>
                <button
                  onClick={() => setSelectedPeriodType('yearly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    selectedPeriodType === 'yearly'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            {/* Period Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select {selectedPeriodType.charAt(0).toUpperCase() + selectedPeriodType.slice(1)} Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getPeriodOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handlePreview}
                disabled={isLoading || !selectedPeriod}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating Preview...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Preview Entries</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Warning for already closed period */}
          {isAlreadyClosed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-800 font-medium">
                  Books already closed for {selectedPeriod && formatPeriodDisplay(selectedPeriod)}
                </span>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {preview && !isAlreadyClosed && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Closing Entry Preview</h3>
              
              {/* Revenue Accounts */}
              {preview.revenueAccounts.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-2">Revenue Accounts (Debit to Close)</h4>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Account</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Debit Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.revenueAccounts.map((account) => (
                          <tr key={account.accountId} className="border-b border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-900">{account.accountName}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                              {formatCurrency(account.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Expense Accounts */}
              {preview.expenseAccounts.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-2">Expense Accounts (Credit to Close)</h4>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Account</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Credit Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.expenseAccounts.map((account) => (
                          <tr key={account.accountId} className="border-b border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-900">{account.accountName}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                              {formatCurrency(account.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Net Income Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Net Income</span>
                  <span className={`text-lg font-bold ${preview.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(preview.netIncome)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {preview.netIncome >= 0 ? 'Profit' : 'Loss'} for {selectedPeriod && formatPeriodDisplay(selectedPeriod)}
                </p>
              </div>

              {/* Close Books Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseBooks}
                  disabled={isClosing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isClosing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Closing Books...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Close Books</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloseBooksModal; 