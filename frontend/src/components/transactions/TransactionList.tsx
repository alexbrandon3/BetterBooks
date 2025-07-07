import React from 'react';
import { Transaction } from '../../types/transaction';
import { Account } from '../../types/account';
import { formatCurrency } from '../../utils/formatUtils';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

// Helper function to format transaction type with proper capitalization
const formatTransactionType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="transaction-list">
      {transactions.map((transaction) => (
        <div 
          key={transaction.id} 
          className="border rounded-md p-4 hover:shadow-md transition-shadow"
          data-testid={`transaction-row-${transaction.id}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{transaction.description}</div>
              <div className="text-sm text-gray-600">
                {new Date(transaction.date).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">{formatTransactionType(transaction.type)}</div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(transaction)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                data-testid={`edit-transaction-${transaction.id}`}
                aria-label="Edit transaction"
                title="Edit transaction"
              >
                <span className="text-blue-600 hover:text-blue-800">✏️</span>
              </button>
              <button
                onClick={() => onDelete(transaction.id)}
                className="text-gray-600 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                data-testid={`delete-transaction-${transaction.id}`}
                aria-label="Delete transaction"
                title="Delete transaction"
              >
                <span className="text-gray-600 hover:text-red-600">🗑️</span>
              </button>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm text-gray-600">
              <span className={transaction.type === "EXPENSE" ? "text-red-600" : "text-green-600"}>
                {formatCurrency(Math.abs(transaction.amount))}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 