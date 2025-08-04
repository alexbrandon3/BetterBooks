import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import api from "../utils/axios";
import {
  fetchRecurringTransactions,
  createRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransaction,
  RecurringTransactionData,
} from "../services/RecurringTransactionService";

interface RecurringTransaction {
  id: number;
  description: string;
  amount: number;
  recurrencePattern: string;
  nextRun: string;
  isActive: boolean;
  primaryAccount: {
    id: number;
    name: string;
  };
  secondaryAccount: {
    id: number;
    name: string;
  };
  primaryEntryType: string;
  secondaryEntryType: string;
}

interface Account {
  id: number;
  name: string;
  type: string;
}

const RecurringTransactions = () => {
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [recurrencePattern, setRecurrencePattern] = useState("monthly");
  const [primaryAccountId, setPrimaryAccountId] = useState("");
  const [secondaryAccountId, setSecondaryAccountId] = useState("");
  const [primaryEntryType, setPrimaryEntryType] = useState<'DEBIT' | 'CREDIT'>('CREDIT');
  const [secondaryEntryType, setSecondaryEntryType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await api.get("/accounts");
        setAccounts(response.data);
      } catch (error) {
        console.error('Failed to load accounts:', error);
        toast.error('Failed to load accounts. Please refresh the page.');
      }
    };
    loadAccounts();
  }, []);

  const loadRecurringTransactions = async () => {
    try {
      setLoading(true);
      const data = await fetchRecurringTransactions();
      setRecurringTransactions(data);
    } catch (error) {
      console.error("Failed to fetch recurring transactions:", error);
      toast.error('Failed to load recurring transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecurringTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!primaryAccountId || !secondaryAccountId) {
      toast.error('Please select both accounts');
      return;
    }

    if (primaryAccountId === secondaryAccountId) {
      toast.error('Please select different accounts for the transaction');
      return;
    }

    try {
      const transactionData: RecurringTransactionData = {
        amount,
        description,
        recurrencePattern,
        nextRun: new Date().toISOString(), // Start immediately
        primaryAccountId: parseInt(primaryAccountId),
        secondaryAccountId: parseInt(secondaryAccountId),
        primaryEntryType,
        secondaryEntryType,
      };

      await createRecurringTransaction(transactionData);
      toast.success('Recurring transaction created successfully!');
      
      // Reset form
      setAmount(0);
      setDescription("");
      setPrimaryAccountId("");
      setSecondaryAccountId("");
      setPrimaryEntryType('CREDIT');
      setSecondaryEntryType('DEBIT');
      
      loadRecurringTransactions();
    } catch (error) {
      console.error("Failed to create recurring transaction:", error);
      toast.error('Failed to create recurring transaction. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRecurringTransaction(id);
      setRecurringTransactions(
        recurringTransactions.filter(
          (txn: RecurringTransaction) => txn.id !== id
        )
      );
      toast.success('Recurring transaction deleted successfully!');
    } catch (error) {
      console.error("Failed to delete recurring transaction:", error);
      toast.error('Failed to delete recurring transaction. Please try again.');
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await toggleRecurringTransaction(id);
      setRecurringTransactions(prev =>
        prev.map(txn =>
          txn.id === id ? { ...txn, isActive: !currentStatus } : txn
        )
      );
      toast.success(`Recurring transaction ${currentStatus ? 'paused' : 'resumed'} successfully!`);
    } catch (error) {
      console.error("Failed to toggle recurring transaction status:", error);
      toast.error('Failed to update recurring transaction status. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Recurring Transactions</h1>

      <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Create New Recurring Transaction</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Transaction description"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0.00"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence Pattern</label>
            <select
              value={recurrencePattern}
              onChange={(e) => setRecurrencePattern(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Account</label>
            <select
              value={primaryAccountId}
              onChange={(e) => setPrimaryAccountId(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Primary Account</option>
              {accounts.map((account: Account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Account</label>
            <select
              value={secondaryAccountId}
              onChange={(e) => setSecondaryAccountId(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Secondary Account</option>
              {accounts.map((account: Account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Entry Type</label>
            <select
              value={primaryEntryType}
              onChange={(e) => setPrimaryEntryType(e.target.value as 'DEBIT' | 'CREDIT')}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Entry Type</label>
            <select
              value={secondaryEntryType}
              onChange={(e) => setSecondaryEntryType(e.target.value as 'DEBIT' | 'CREDIT')}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="DEBIT">Debit</option>
              <option value="CREDIT">Credit</option>
            </select>
          </div>
        </div>
        
        <button
          type="submit"
          className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 w-full"
        >
          Create Recurring Transaction
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-4 py-2 text-left">Next Run</th>
              <th className="border px-4 py-2 text-left">Description</th>
              <th className="border px-4 py-2 text-left">Amount</th>
              <th className="border px-4 py-2 text-left">Primary Account</th>
              <th className="border px-4 py-2 text-left">Secondary Account</th>
              <th className="border px-4 py-2 text-left">Status</th>
              <th className="border px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recurringTransactions.map((txn: RecurringTransaction) => (
              <tr key={txn.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">
                  {txn.nextRun ? format(new Date(txn.nextRun), 'MMM dd, yyyy') : 'Not scheduled'}
                </td>
                <td className="border px-4 py-2">{txn.description}</td>
                <td className="border px-4 py-2">${Math.abs(txn.amount).toFixed(2)}</td>
                <td className="border px-4 py-2">
                  {txn.primaryAccount.name} ({txn.primaryEntryType})
                </td>
                <td className="border px-4 py-2">
                  {txn.secondaryAccount.name} ({txn.secondaryEntryType})
                </td>
                <td className="border px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    txn.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {txn.isActive ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td className="border px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(txn.id, txn.isActive)}
                      className={`px-2 py-1 rounded text-xs ${
                        txn.isActive 
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      title={txn.isActive ? 'Pause recurring transaction' : 'Resume recurring transaction'}
                    >
                      {txn.isActive ? '⏸️ Pause' : '▶️ Resume'}
                    </button>
                    <button
                      onClick={() => handleDelete(txn.id)}
                      className="text-gray-600 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Delete recurring transaction"
                      aria-label="Delete recurring transaction"
                    >
                      <span className="text-gray-600 hover:text-red-600">🗑️</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecurringTransactions;
