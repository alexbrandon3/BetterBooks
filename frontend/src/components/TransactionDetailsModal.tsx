import React, { useState, useEffect } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { Transaction } from '../types/transaction';
import { Account } from '../types/account';

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
                    <option value="ADJUSTMENT">Adjustment</option>
                    <option value="LOAN_PAYMENT">Loan Payment</option>
                    <option value="ASSET_PURCHASE">Asset Purchase</option>
                    <option value="LIABILITY_SETTLEMENT">Liability Settlement</option>
                    <option value="EQUITY_CONTRIBUTION">Equity Contribution</option>
                    <option value="EQUITY_WITHDRAWAL">Equity Withdrawal</option>
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
                  <input
                    type="text"
                    {...register("category")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
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
                        <p className={`font-semibold ${entry.type === 'DEBIT' ? 'text-red-600' : 'text-green-600'}`}>
                          {entry.type === 'DEBIT' ? '-' : '+'}${Math.abs(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
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