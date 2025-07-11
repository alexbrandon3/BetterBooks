import React, { useEffect, useState, useCallback } from 'react';
import { formatCurrency } from '../utils/formatUtils';
import { formatEnumLabel } from '../utils/formatEnumLabel';
import { Transaction, TransactionType } from '../types/transaction';
import { Account } from '../types/account';
import * as TransactionService from '../services/TransactionService';
import * as AccountService from '../services/AccountService';
import { toast } from 'react-hot-toast';
import TransactionDetailsModal from '../components/TransactionDetailsModal';
import AdvancedTransactionFilters from '../components/AdvancedTransactionFilters';
import FilterSummary from '../components/FilterSummary';
import ExportModal from '../components/ExportModal';

interface TransactionFilters {
  search: string;
  type: string;
  category: string;
  startDate: string;
  endDate: string;
  accountId: string;
  minAmount: string;
  maxAmount: string;
}

interface TransactionSorting {
  sortBy: string;
  sortOrder: string;
}

interface TransactionHistoryResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
  filters: TransactionFilters;
  sorting: TransactionSorting;
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  
  // Filter state
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: '',
    category: '',
    startDate: '',
    endDate: '',
    accountId: '',
    minAmount: '',
    maxAmount: ''
  });
  
  // Sorting state
  const [sorting, setSorting] = useState<TransactionSorting>({
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Bulk operations state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Load accounts for filter dropdown
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsData = await AccountService.fetchAccountsWithConsistentBalances();
        setAccounts(accountsData);
      } catch (err) {
        console.error('Error loading accounts:', err);
      }
    };
    loadAccounts();
  }, []);

  // Load transactions with current filters and pagination
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      params.append('sortBy', sorting.sortBy);
      params.append('sortOrder', sorting.sortOrder);
      
      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') {
          params.append(key, value as string);
        }
      });

      const response = await TransactionService.fetchTransactionsWithFilters(params);
      setTransactions(response.transactions);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions. Please try again.');
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, sorting]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (sortBy: string) => {
    setSorting(prev => ({
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      startDate: '',
      endDate: '',
      accountId: '',
      minAmount: '',
      maxAmount: ''
    });
    setCurrentPage(1);
  };

  const removeFilter = (key: string) => {
    if (key === 'dateRange') {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    } else if (key === 'amountRange') {
      setFilters(prev => ({ ...prev, minAmount: '', maxAmount: '' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: '' }));
    }
    setCurrentPage(1);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    try {
      await TransactionService.deleteTransaction(transactionId);
      toast.success('Transaction deleted successfully');
      loadTransactions(); // Reload the list
    } catch (err) {
      console.error('Error deleting transaction:', err);
      toast.error('Failed to delete transaction');
    }
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleTransactionUpdate = async (id: string, data: any) => {
    try {
      await TransactionService.updateTransaction(id, data);
      toast.success('Transaction updated successfully');
      loadTransactions(); // Reload the list
    } catch (err) {
      console.error('Error updating transaction:', err);
      toast.error('Failed to update transaction');
    }
  };

  const handleTransactionDelete = async (id: string) => {
    try {
      await TransactionService.deleteTransaction(id);
      toast.success('Transaction deleted successfully');
      setIsModalOpen(false);
      setSelectedTransaction(null);
      loadTransactions(); // Reload the list
    } catch (err) {
      console.error('Error deleting transaction:', err);
      toast.error('Failed to delete transaction');
    }
  };

  // Bulk operations handlers
  const handleBulkModeToggle = () => {
    setIsBulkMode(!isBulkMode);
    if (isBulkMode) {
      setSelectedTransactions(new Set()); // Clear selections when exiting bulk mode
    }
  };

  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.size === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedTransactions.size} transaction(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedTransactions).map(id => 
        TransactionService.deleteTransaction(id)
      );
      await Promise.all(deletePromises);
      toast.success(`${selectedTransactions.size} transaction(s) deleted successfully`);
      setSelectedTransactions(new Set());
      setIsBulkMode(false);
      loadTransactions();
    } catch (err) {
      console.error('Error deleting transactions:', err);
      toast.error('Failed to delete some transactions');
    }
  };

  const handleBulkCategoryChange = async (newCategory: string) => {
    if (selectedTransactions.size === 0) return;
    
    try {
      const updatePromises = Array.from(selectedTransactions).map(id => 
        TransactionService.updateTransactionPartial(id, { category: newCategory })
      );
      await Promise.all(updatePromises);
      toast.success(`Category updated for ${selectedTransactions.size} transaction(s)`);
      setSelectedTransactions(new Set());
      setIsBulkMode(false);
      loadTransactions();
    } catch (err) {
      console.error('Error updating transactions:', err);
      toast.error('Failed to update some transactions');
    }
  };

  const handleBulkTypeChange = async (newType: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT' | 'LOAN_PAYMENT' | 'ASSET_PURCHASE' | 'LIABILITY_SETTLEMENT' | 'EQUITY_CONTRIBUTION' | 'EQUITY_WITHDRAWAL') => {
    if (selectedTransactions.size === 0) return;
    
    try {
      const updatePromises = Array.from(selectedTransactions).map(id => 
        TransactionService.updateTransactionPartial(id, { type: newType })
      );
      await Promise.all(updatePromises);
      toast.success(`Type updated for ${selectedTransactions.size} transaction(s)`);
      setSelectedTransactions(new Set());
      setIsBulkMode(false);
      loadTransactions();
    } catch (err) {
      console.error('Error updating transactions:', err);
      toast.error('Failed to update some transactions');
    }
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'INCOME':
        return 'text-green-600 bg-green-100';
      case 'EXPENSE':
        return 'text-red-600 bg-red-100';
      case 'TRANSFER':
        return 'text-blue-600 bg-blue-100';
      case 'CLOSING_ENTRY':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-gray-600 mt-2">View and manage all your transactions</p>
      </div>

      {/* Advanced Filters Section */}
      <AdvancedTransactionFilters
        filters={filters}
        accounts={accounts}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {/* Filter Summary */}
      <FilterSummary
        filters={filters}
        accounts={accounts}
        onRemoveFilter={removeFilter}
        onClearAll={clearFilters}
      />

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Transactions ({total} total)
            </h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Export
              </button>
              <button
                onClick={handleBulkModeToggle}
                className={`px-3 py-1 text-sm rounded-md ${
                  isBulkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isBulkMode ? 'Exit Bulk Mode' : 'Bulk Operations'}
              </button>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
          
          {/* Bulk Operations Bar */}
          {isBulkMode && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedTransactions.size === transactions.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedTransactions.size} of {transactions.length} selected
                  </span>
                </div>
                
                {selectedTransactions.size > 0 && (
                  <div className="flex items-center space-x-2">
                    <select
                      onChange={(e) => handleBulkCategoryChange(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                      defaultValue=""
                    >
                      <option value="" disabled>Change Category</option>
                      <option value="Sales">Sales</option>
                      <option value="Expenses">Expenses</option>
                      <option value="Payroll">Payroll</option>
                      <option value="Taxes">Taxes</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Travel">Travel</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Other">Other</option>
                    </select>
                    
                    <select
                      onChange={(e) => handleBulkTypeChange(e.target.value as any)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                      defaultValue=""
                    >
                      <option value="" disabled>Change Type</option>
                      <option value="INCOME">Income</option>
                      <option value="EXPENSE">Expense</option>
                      <option value="TRANSFER">Transfer</option>
                      <option value="ADJUSTMENT">Adjustment</option>
                    </select>
                    
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadTransactions}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Try Again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No transactions found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {isBulkMode && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSortChange('date')}
                    >
                      Date
                      {sorting.sortBy === 'date' && (
                        <span className="ml-1">
                          {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSortChange('type')}
                    >
                      Type
                      {sorting.sortBy === 'type' && (
                        <span className="ml-1">
                          {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSortChange('amount')}
                    >
                      Amount
                      {sorting.sortBy === 'amount' && (
                        <span className="ml-1">
                          {sorting.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className={`hover:bg-gray-50 ${isBulkMode ? '' : 'cursor-pointer'}`}
                      onClick={isBulkMode ? undefined : () => handleTransactionClick(transaction)}
                    >
                      {isBulkMode && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                          {formatEnumLabel(transaction.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTransaction(transaction.id);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete transaction"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        accounts={accounts}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleTransactionUpdate}
        onDelete={handleTransactionDelete}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        filters={filters}
        totalTransactions={total}
        totalAmount={transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)}
      />
    </div>
  );
};

export default TransactionHistory; 