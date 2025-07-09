import React, { useState, useEffect } from 'react';
import { DrillDownTransaction, fetchDrillDown } from '../services/ReportService';
import { formatCurrency } from '../utils/formatters';

interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportSection: string;
  type: string;
  accountId?: number;
  subcategory?: string;
  startDate?: string;
  endDate?: string;
}

interface FilterState {
  searchTerm: string;
  minAmount: string;
  maxAmount: string;
  accountFilter: string;
}

const DrilldownModal: React.FC<DrilldownModalProps> = ({
  isOpen,
  onClose,
  reportSection,
  type,
  accountId,
  subcategory,
  startDate,
  endDate
}) => {
  const [transactions, setTransactions] = useState<DrillDownTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    minAmount: '',
    maxAmount: '',
    accountFilter: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen, type, accountId, subcategory, startDate, endDate]);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchDrillDown(type, accountId, subcategory, startDate, endDate);
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return 'All Time';
    
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      return `From ${formatDate(startDate)}`;
    } else if (endDate) {
      return `Until ${formatDate(endDate)}`;
    }
    
    return 'All Time';
  };

  const filteredTransactions = transactions.filter(transaction => {
    // Search term filter
    if (filters.searchTerm && !transaction.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }

    // Amount range filters
    if (filters.minAmount && transaction.netAmount < parseFloat(filters.minAmount)) {
      return false;
    }
    if (filters.maxAmount && transaction.netAmount > parseFloat(filters.maxAmount)) {
      return false;
    }

    // Account filter - check if any entry matches
    if (filters.accountFilter) {
      const hasMatchingAccount = transaction.entries.some(entry => 
        entry.accountName.toLowerCase().includes(filters.accountFilter.toLowerCase())
      );
      if (!hasMatchingAccount) {
        return false;
      }
    }

    return true;
  });

  const totalAmount = filteredTransactions.reduce((sum, transaction) => {
    return sum + transaction.netAmount;
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{reportSection}</h2>
            <p className="text-sm text-gray-600 mt-1">{formatDateRange()}</p>
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

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Description</label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="Search transactions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Filter</label>
              <input
                type="text"
                value={filters.accountFilter}
                onChange={(e) => setFilters(prev => ({ ...prev, accountFilter: e.target.value }))}
                placeholder="Filter by account..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading transactions...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-lg font-semibold">Error Loading Data</p>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
              <button
                onClick={loadTransactions}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="p-6">
              {/* Summary */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Amount</p>
                    <p className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entries
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          {transactions.length === 0 ? 'No transactions found' : 'No transactions match the current filters'}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {transaction.description}
                          </td>
                          <td className={`px-6 py-4 text-sm text-right font-medium ${
                            transaction.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.netAmount >= 0 ? '+' : ''}{formatCurrency(transaction.netAmount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="space-y-1">
                              {transaction.entries.map((entry, index) => (
                                <div key={index} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600">{entry.accountName}</span>
                                  <span className={`font-medium ${
                                    entry.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {entry.type === 'CREDIT' ? '+' : '-'}{formatCurrency(entry.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrilldownModal; 