import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatters';
import { format } from 'date-fns';
import api from '../../utils/axios';
import { BetterBooksContext } from '../../context-engineering';

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
  // 🧠 Semantic Context Simulation
  const userContext = {
    role: 'OWNER' as 'OWNER' | 'ACCOUNTANT',
    previewSkippedCount: 4,
    lastClosedPeriod: '2025-05',
    preferredCloseType: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  };

  const [selectedPeriodType, setSelectedPeriodType] = useState<PeriodType>(userContext.preferredCloseType.toLowerCase() as PeriodType);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [preview, setPreview] = useState<ClosingEntryPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAlreadyClosed, setIsAlreadyClosed] = useState(false);
  const [showQuickClose, setShowQuickClose] = useState(userContext.previewSkippedCount >= BetterBooksContext.behaviorExamples.previewSkips.threshold);
  const [showSuccessSummary, setShowSuccessSummary] = useState(false);
  const [closedPeriodData, setClosedPeriodData] = useState<{ period: string; netIncome: number } | null>(null);

  // 🧠 Semantic Context: Set default period based on last closed period
  useEffect(() => {
    if (isOpen && !selectedPeriod) {
      // Parse last closed period and suggest next period
      const lastClosed = new Date(userContext.lastClosedPeriod + '-01');
      const nextPeriod = new Date(lastClosed.getFullYear(), lastClosed.getMonth() + 1, 1);
      
      if (selectedPeriodType === 'monthly') {
        const lastDayOfMonth = new Date(nextPeriod.getFullYear(), nextPeriod.getMonth() + 1, 0);
        setSelectedPeriod(format(lastDayOfMonth, 'yyyy-MM-dd'));
      } else if (selectedPeriodType === 'quarterly') {
        const quarter = Math.floor(nextPeriod.getMonth() / 3);
        const lastMonthOfQuarter = (quarter + 1) * 3 - 1;
        const lastDayOfQuarter = new Date(nextPeriod.getFullYear(), lastMonthOfQuarter + 1, 0);
        setSelectedPeriod(format(lastDayOfQuarter, 'yyyy-MM-dd'));
      } else if (selectedPeriodType === 'yearly') {
        const lastDayOfYear = new Date(nextPeriod.getFullYear(), 11, 31);
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

  // 🧠 Semantic Context: Get tone-appropriate messaging
  const getToneMessage = (type: 'description' | 'explanation' | 'success') => {
    const isOwner = userContext.role === 'OWNER';
    
    switch (type) {
      case 'description':
        return isOwner 
          ? "This will wrap up your income and expenses for the period and carry your profit forward."
          : "Closing this period will create entries to zero out revenue and expense accounts to retained earnings.";
      case 'explanation':
        return isOwner
          ? "This amount will be transferred to your Retained Earnings account"
          : "This amount will be transferred to your Retained Earnings account";
      case 'success':
        return isOwner
          ? "Great job! Your books are closed and ready for the next period."
          : "Period successfully closed. All entries have been created and the period is locked.";
      default:
        return "";
    }
  };

  // 🧠 Semantic Context: Quick close handler
  const handleQuickClose = async () => {
    if (!selectedPeriod) {
      toast.error('Please select a period');
      return;
    }

    setIsClosing(true);
    try {
      // Simulate quick close without preview
      const mockNetIncome = 4300; // Mock data
      const mockPeriod = formatPeriodDisplay(selectedPeriod);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setClosedPeriodData({ period: mockPeriod, netIncome: mockNetIncome });
      setShowSuccessSummary(true);
      
      toast.success(getToneMessage('success'));
    } catch (error) {
      console.error('Error in quick close:', error);
      toast.error('Failed to close books');
    } finally {
      setIsClosing(false);
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
        const mockNetIncome = data.netIncome || 0;
        const mockPeriod = formatPeriodDisplay(selectedPeriod);
        
        setClosedPeriodData({ period: mockPeriod, netIncome: mockNetIncome });
        setShowSuccessSummary(true);
        
        toast.success(getToneMessage('success'));
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
              <p className="text-sm text-gray-600">{getToneMessage('description')}</p>
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

            {/* 🧠 Semantic Context: Quick Close Mode */}
            {showQuickClose && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-blue-800">
                    You've skipped preview {userContext.previewSkippedCount} times — using Quick Close by default.
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              {!showQuickClose && (
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
              )}
              
              {showQuickClose && (
                <button
                  onClick={() => setShowQuickClose(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Show Preview</span>
                </button>
              )}
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
              <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Closing Entry Preview</h3>
                <p className="text-blue-800 text-sm">
                  These journal entries will close your income and expense accounts for this period and transfer the net income to Retained Earnings. Each entry shows the debit (Dr.) and credit (Cr.) sides of the transaction.
                </p>
              </div>
              
              {/* Revenue Accounts */}
              {preview.revenueAccounts.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-green-700 mb-2 flex items-center">
                    <span className="mr-2">📈</span>
                    Revenue Accounts (Debit to Close)
                  </h4>
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
                  <h4 className="text-md font-medium text-red-700 mb-2 flex items-center">
                    <span className="mr-2">📉</span>
                    Expense Accounts (Credit to Close)
                  </h4>
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

              {/* Journal Entries Preview */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">📝</span>
                  Journal Entries to be Created
                </h4>
                
                {/* Revenue Account Entries */}
                {preview.revenueAccounts.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Close Revenue Accounts:</h5>
                    {preview.revenueAccounts.map((account) => (
                      <div key={account.accountId} className="bg-white rounded-lg p-3 mb-2 border border-blue-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-left">
                            <span className="font-medium text-blue-900">Dr. {account.accountName}</span>
                            <span className="block text-blue-700">{formatCurrency(account.balance)}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-blue-900">Cr. Retained Earnings</span>
                            <span className="block text-blue-700">{formatCurrency(account.balance)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expense Account Entries */}
                {preview.expenseAccounts.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Close Expense Accounts:</h5>
                    {preview.expenseAccounts.map((account) => (
                      <div key={account.accountId} className="bg-white rounded-lg p-3 mb-2 border border-blue-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-left">
                            <span className="font-medium text-blue-900">Dr. Retained Earnings</span>
                            <span className="block text-blue-700">{formatCurrency(account.balance)}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-blue-900">Cr. {account.accountName}</span>
                            <span className="block text-blue-700">{formatCurrency(account.balance)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Net Income Summary */}
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-md font-semibold text-green-900">💰 Net Income Transfer</span>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-green-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Cumulative profit your business has retained after distributions.
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${preview.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(preview.netIncome)}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    {getToneMessage('explanation')}
                  </p>
                </div>
              </div>

              {/* Warning about period locking */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center text-yellow-800">
                  <span className="mr-2">⚠️</span>
                  <span className="text-sm font-medium">Important:</span>
                </div>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• This period will be locked after closing</li>
                  <li>• No new transactions can be added to this period</li>
                  <li>• Total journal entries to be created: {preview.totalEntries}</li>
                  <li>• Revenue accounts to close: {preview.revenueAccounts.length}</li>
                  <li>• Expense accounts to close: {preview.expenseAccounts.length}</li>
                  {preview.netIncome !== 0 && (
                    <li>• Net income transfer: {formatCurrency(preview.netIncome)}</li>
                  )}
                </ul>
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

          {/* 🧠 Semantic Context: Quick Close Mode */}
          {showQuickClose && !preview && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">🚀 Quick Close Mode</h3>
                <p className="text-blue-800 text-sm">
                  {getToneMessage('description')}
                </p>
              </div>

              {/* Quick Close Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickClose}
                  disabled={isClosing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isClosing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Quick Closing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Quick Close</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 🧠 Semantic Context: Success Summary */}
          {showSuccessSummary && closedPeriodData && (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">
                      {closedPeriodData.period} successfully closed
                    </h3>
                    <p className="text-sm text-green-700">
                      Net Profit: {formatCurrency(closedPeriodData.netIncome)}
                    </p>
                  </div>
                </div>
                
                {userContext.role === 'OWNER' && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-medium mb-2">🎉 Great job! Ready for the next period?</p>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors">
                        Share Results
                      </button>
                      <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                        View Reports
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSuccessSummary(false);
                    setClosedPeriodData(null);
                    onClose();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Done
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