import React, { useEffect, useState } from "react";
import {
  fetchRecurringTransactions,
  createRecurringTransaction,
  deleteRecurringTransaction,
} from "../services/RecurringTransactionService";
import axios from "../utils/axios";
import { FaTrash } from "react-icons/fa";
import { toast } from 'react-hot-toast';

interface RecurringTransaction {
  id: number;
  description: string;
  amount: number;
  recurrencePattern: string;
  account: {
    id: number;
    name: string;
  };
}

const RecurringTransactions = () => {
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [recurrencePattern, setRecurrencePattern] = useState("monthly");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await axios.get("/accounts");
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
    try {
      await createRecurringTransaction({
        amount,
        description,
        recurrencePattern,
        accountId,
      });
      toast.success('Recurring transaction created successfully!');
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Recurring Transactions</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Amount"
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full mb-2 p-2 border rounded"
        />
        <select
          value={recurrencePattern}
          onChange={(e) => setRecurrencePattern(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        >
          <option value="">Select Account</option>
          {accounts.map((account: any) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 w-full"
        >
          Create Recurring Transaction
        </button>
      </form>

      <table className="w-full border">
        <thead>
          <tr>
            <th role="columnheader" className="border px-4 py-2">Date</th>
            <th role="columnheader" className="border px-4 py-2">Description</th>
            <th role="columnheader" className="border px-4 py-2">Amount</th>
            <th role="columnheader" className="border px-4 py-2">Account</th>
            <th role="columnheader" className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {recurringTransactions.map((txn: any) => (
            <tr key={txn.id}>
              <td className="border px-4 py-2">-</td>
              <td className="border px-4 py-2">{txn.description}</td>
              <td className="border px-4 py-2">${Math.abs(txn.amount).toFixed(2)}</td>
              <td className="border px-4 py-2">{txn.account.name}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => handleDelete(txn.id)}
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Delete recurring transaction"
                  aria-label="Delete recurring transaction"
                >
                  {FaTrash({ size: 16 })}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecurringTransactions;
