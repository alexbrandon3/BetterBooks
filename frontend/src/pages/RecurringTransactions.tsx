import React, { useEffect, useState } from "react";
import {
  fetchRecurringTransactions,
  createRecurringTransaction,
  deleteRecurringTransaction,
} from "../services/RecurringTransactionService";
import axios from "../utils/axios";

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
      const response = await axios.get("/accounts");
      setAccounts(response.data);
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
      loadRecurringTransactions();
    } catch (error) {
      console.error("Failed to create recurring transaction:", error);
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
    } catch (error) {
      console.error("Failed to delete recurring transaction:", error);
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
            <th className="border px-4 py-2">Description</th>
            <th className="border px-4 py-2">Amount</th>
            <th className="border px-4 py-2">Pattern</th>
            <th className="border px-4 py-2">Account ID</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {recurringTransactions.map((txn: any) => (
            <tr key={txn.id}>
              <td className="border px-4 py-2">{txn.description}</td>
              <td className="border px-4 py-2">${txn.amount.toFixed(2)}</td>
              <td className="border px-4 py-2">{txn.recurrencePattern}</td>
              <td className="border px-4 py-2">{txn.account.id}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => handleDelete(txn.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Delete
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
