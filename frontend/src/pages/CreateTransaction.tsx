import React, { useState } from 'react';
import { createTransaction } from '../services/TransactionService';
import { Account } from '../types/account';
import { TransactionForm } from '../services/TransactionService';

interface CreateTransactionProps {
  accounts: Account[];
  onTransactionCreated: () => void;
}

const CreateTransaction: React.FC<CreateTransactionProps> = ({ accounts, onTransactionCreated }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [accountId, setAccountId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTransaction({
        type,
        description,
        date: new Date().toISOString().split('T')[0],
        entries: [
          {
            accountId,
            amount,
            type: type === 'INCOME' ? 'CREDIT' : 'DEBIT'
          }
        ]
      });
      onTransactionCreated();
    } catch (error) {
      console.error("Failed to create transaction:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'INCOME' | 'EXPENSE')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Account</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Select an account</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Create Transaction
      </button>
    </form>
  );
};

export default CreateTransaction;
