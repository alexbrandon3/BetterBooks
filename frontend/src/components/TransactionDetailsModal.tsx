import React, { useState, useEffect, useRef } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { Transaction } from '../types/transaction';
import { Account } from '../types/account';
import * as TransactionService from '../services/TransactionService';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface TransactionFormData {
  date: string;
  type: string;
  description: string;
  category: string;
  amount: number;
  entries: {
    accountId: string;
    amount: string;
    type: 'DEBIT' | 'CREDIT';
  }[];
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  accounts,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Category dropdown state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Predefined categories for the dropdown
  const predefinedCategories = [
    'Sales Revenue', 'Service Revenue', 'Product Sales', 'Commission Income',
    'Rent Expense', 'Utilities Expense', 'Payroll Expense', 'Marketing Expense',
    'Travel Expense', 'Equipment Expense', 'Insurance Expense', 'Legal Expense',
    'Accounting Expense', 'Software Expense', 'Office Supplies', 'Maintenance Expense',
    'Cash & Bank', 'Accounts Receivable', 'Inventory', 'Equipment Assets',
    'Accounts Payable', 'Credit Cards', 'Loans Payable', 'Taxes Payable',
    'Owner Equity', 'Retained Earnings', 'Common Stock', 'Additional Paid-in Capital'
  ];

  // Load dynamic categories from backend
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categories = await TransactionService.getUniqueCategories();
        setDynamicCategories(categories);
      } catch (error) {
        console.error('Error loading categories:', error);
        setDynamicCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Load recent categories from existing transactions
  useEffect(() => {
    const loadRecentCategories = async () => {
      try {
        const response = await TransactionService.fetchTransactionsWithFilters(new URLSearchParams({ limit: '100' }));
        const categories = response.transactions
          .map(t => t.category)
          .filter(cat => cat && cat.trim() !== '')
          .reverse(); // Most recent first
        
        // Get unique categories, preserving order (most recent first)
        const uniqueCategories = categories.filter((cat, index, arr) => arr.indexOf(cat) === index);
        setRecentCategories(uniqueCategories.slice(0, 5)); // Top 5 most recent
      } catch (error) {
        console.error('Error loading recent categories:', error);
      }
    };

    if (isOpen) {
      loadRecentCategories();
    }
  }, [isOpen]);

  // Handle clicks outside of category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter categories based on search term
  const filteredCategories = predefinedCategories.filter(category =>
    category.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const handleCategorySelect = (category: string) => {
    setValue('category', category);
    setCategorySearchTerm('');
    setShowCategoryDropdown(false);
  };

  const handleCategoryInputChange = (value: string) => {
    setValue('category', value);
    setCategorySearchTerm(value);
    setShowCategoryDropdown(true);
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowCategoryDropdown(false);
    } else if (e.key === 'Enter' && filteredCategories.length > 0) {
      handleCategorySelect(filteredCategories[0]);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TransactionFormData>();

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      // Format date for HTML date input (YYYY-MM-DD)
      const formattedDate = new Date(transaction.date).toISOString().split('T')[0];
      
      reset({
        date: formattedDate,
        type: transaction.type,
        description: transaction.description,
        category: transaction.category || '',
        amount: Math.abs(transaction.amount),
        entries: transaction.entries.map(entry => ({
          accountId: entry.account.id.toString(),
          amount: Math.abs(entry.amount).toString(),
          type: entry.type
        }))
      });
      setIsEditing(false);
    }
  }, [transaction, reset]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    if (transaction) {
      // Format date for HTML date input (YYYY-MM-DD)
      const formattedDate = new Date(transaction.date).toISOString().split('T')[0];
      
      reset({
        date: formattedDate,
        type: transaction.type,
        description: transaction.description,
        category: transaction.category || '',
        amount: Math.abs(transaction.amount),
        entries: transaction.entries.map(entry => ({
          accountId: entry.account.id.toString(),
          amount: Math.abs(entry.amount).toString(),
          type: entry.type
        }))
      });
    }
  };

  const handleSave = async (data: TransactionFormData) => {
    if (!transaction) return;
    
    setIsLoading(true);
    try {
      // Convert form data to backend format
      const updateData = {
        description: data.description,
        date: data.date,
        type: data.type,
        category: data.category,
        amount: data.amount,
        entries: data.entries.map(entry => ({
          accountId: parseInt(entry.accountId),
          amount: parseFloat(entry.amount),
          type: entry.type,
          description: data.description
        }))
      };

      console.log('🔍 FRONTEND DEBUG - Sending update data:', JSON.stringify(updateData, null, 2));
      console.log('🔍 FRONTEND DEBUG - Original transaction amount:', transaction.amount);
      console.log('🔍 FRONTEND DEBUG - Form amount:', data.amount);
      console.log('🔍 FRONTEND DEBUG - Entry amounts:', data.entries.map(e => e.amount));

      await onUpdate(transaction.id, updateData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    
    if (!window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      onClose();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !transaction) return null;

  // Calculate total debits and credits separately
  const totalDebits = transaction.entries
    .filter(entry => entry.type === 'DEBIT')
    .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  
  const totalCredits = transaction.entries
    .filter(entry => entry.type === 'CREDIT')
    .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Transaction' : 'Transaction Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
              {/* Basic Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date *</label>
                  <input
                    type="date"
                    {...register("date", { required: "Date is required" })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type *</label>
                  <select
                    {...register("type", { required: "Type is required" })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                    <option value="TRANSFER">Transfer</option>
                    <option value="EQUITY_CONTRIBUTION">Equity Contribution</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                    <option value="LOAN_PAYMENT">Loan Payment</option>
                    <option value="ASSET_PURCHASE">Asset Purchase</option>
                    <option value="LIABILITY_SETTLEMENT">Liability Settlement</option>
                    <option value="EQUITY_WITHDRAWAL">Equity Withdrawal</option>
                    <option value="CLOSING_ENTRY">Closing Entry</option>
                  </select>
                  {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description *</label>
                  <input
                    type="text"
                    {...register("description", { required: "Description is required" })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <div className="relative" ref={categoryDropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        {...register("category")}
                        value={watch("category") || ""}
                        onChange={(e) => handleCategoryInputChange(e.target.value)}
                        onFocus={() => setShowCategoryDropdown(true)}
                        onKeyDown={handleCategoryKeyDown}
                        placeholder="Search or type a category..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                      />
                      {/* Dropdown indicator */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className={`w-4 h-4 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`}>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {showCategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b border-gray-100">
                          <input 
                            type="text" 
                            placeholder="Search categories..." 
                            value={categorySearchTerm} 
                            onChange={(e) => setCategorySearchTerm(e.target.value)} 
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                            autoFocus 
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {recentCategories.length > 0 && categorySearchTerm === '' && (
                            <div className="border-b border-gray-200">
                              <div className="px-3 py-1 bg-gray-50 text-xs font-medium text-gray-600 uppercase tracking-wide">Recent Categories</div>
                              {recentCategories.map((category, index) => (
                                <button 
                                  key={`recent-${index}`} 
                                  type="button" 
                                  onClick={() => handleCategorySelect(category)} 
                                  className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{category}</div>
                                  <div className="text-xs text-gray-500 mt-1">🕒 Recently used</div>
                                </button>
                              ))}
                            </div>
                          )}
                          {filteredCategories.length > 0 ? (
                            <>
                              {recentCategories.length > 0 && categorySearchTerm === '' && (
                                <div className="px-3 py-1 bg-gray-50 text-xs font-medium text-gray-600 uppercase tracking-wide border-b border-gray-200">All Categories</div>
                              )}
                              {filteredCategories.map((category, index) => (
                                <button 
                                  key={`predefined-${index}`} 
                                  type="button" 
                                  onClick={() => handleCategorySelect(category)} 
                                  className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{category}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {category.includes('Revenue') ? '💰 Revenue' : category.includes('Expense') ? '💸 Expense' : category.includes('Asset') ? '🏦 Asset' : category.includes('Liability') ? '📋 Liability' : category.includes('Equity') ? '📊 Equity' : '📁 Category'}
                                  </div>
                                </button>
                              ))}
                            </>
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500 text-center">
                              <div className="mb-2">No predefined categories found.</div>
                              {categorySearchTerm.trim() && (
                                <button 
                                  type="button" 
                                  onClick={() => handleCategorySelect(categorySearchTerm)} 
                                  className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                >
                                  Create "{categorySearchTerm}"
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="p-2 border-t border-gray-100 bg-gray-50">
                          <div className="text-xs text-gray-600">
                            💡 Choose from predefined categories or type to create custom ones.
                            {filteredCategories.length > 0 && (<span className="block mt-1">Showing {filteredCategories.length} of {predefinedCategories.length} categories</span>)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Journal Entries */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Journal Entries</h3>
                <div className="space-y-4">
                  {watch("entries")?.map((entry, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account</label>
                        <select
                          {...register(`entries.${index}.accountId` as const, { required: "Account is required" })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Select Account</option>
                          {accounts.map(account => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`entries.${index}.amount` as const, { 
                            required: "Amount is required",
                            min: { value: 0.01, message: "Amount must be greater than 0" }
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          {...register(`entries.${index}.type` as const, { required: "Type is required" })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="DEBIT">Debit</option>
                          <option value="CREDIT">Credit</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            const currentEntries = watch("entries");
                            if (currentEntries.length > 2) {
                              const newEntries = currentEntries.filter((_, i) => i !== index);
                              setValue("entries", newEntries);
                            }
                          }}
                          disabled={watch("entries")?.length <= 2}
                          className="px-3 py-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const currentEntries = watch("entries") || [];
                    setValue("entries", [
                      ...currentEntries,
                      { accountId: "", amount: "", type: "DEBIT" as const }
                    ]);
                  }}
                  className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  Add Entry
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Transaction Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="text-lg font-semibold">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="text-lg font-semibold">{transaction.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-lg font-semibold">{transaction.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Category</p>
                    <p className="text-lg font-semibold">{transaction.category || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Transaction Amount</p>
                    <p className="text-lg font-semibold">${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                    <p className="text-sm font-mono text-gray-600">{transaction.id}</p>
                  </div>
                </div>
              </div>

              {/* Journal Entries */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Journal Entries</h3>
                <div className="space-y-3">
                  {transaction.entries.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{entry.account.name}</p>
                        <p className="text-sm text-gray-500">{entry.account.type}</p>
                      </div>
                      <div className="text-right">
                        {(() => {
                          const accountType = entry.account.type;
                          let shouldShowPositive = false;
                          
                          // Assets and Expenses are increased by DEBITS
                          if ((accountType === 'ASSET' || accountType === 'EXPENSE') && entry.type === 'DEBIT') {
                            shouldShowPositive = true;
                          }
                          // Liabilities, Equity, and Income are increased by CREDITS  
                          else if ((accountType === 'LIABILITY' || accountType === 'EQUITY' || accountType === 'INCOME') && entry.type === 'CREDIT') {
                            shouldShowPositive = true;
                          }
                          
                          return (
                            <p className={`font-semibold ${shouldShowPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {shouldShowPositive ? '+' : '-'}${Math.abs(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          );
                        })()}
                        <p className="text-sm text-gray-500">{entry.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Transaction'}
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Edit Transaction
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal; 