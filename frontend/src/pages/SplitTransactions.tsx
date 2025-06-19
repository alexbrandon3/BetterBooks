import React, { useEffect, useState, useCallback } from "react";
import {
  fetchSplitTransactions,
  createSplitTransaction,
  deleteSplitTransaction,
} from "../services/SplitTransactionService";
import { toast } from 'react-hot-toast';

interface SplitTransaction {
  id: number;
  description: string;
  amount: number;
  transaction: {
    id: number;
    description: string;
  };
}

const SplitTransactions = () => {
  const [splitTransactions, setSplitTransactions] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [transactionId, setTransactionId] = useState("");

  const loadSplitTransactions = async () => {
    try {
      const data = await fetchSplitTransactions();
      setSplitTransactions(data);
    } catch (error) {
      console.error("Failed to fetch split transactions:", error);
      toast.error('Failed to load split transactions. Please try again.');
    }
  };

  useEffect(() => {
    loadSplitTransactions();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSplitTransaction({ amount, description, transactionId });
      toast.success('Split transaction created successfully!');
      loadSplitTransactions();
    } catch (error) {
      console.error("Failed to create split transaction:", error);
      toast.error('Failed to create split transaction. Please try again.');
    }
  }, [amount, description, transactionId]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteSplitTransaction(id);
      setSplitTransactions(
        splitTransactions.filter((txn: SplitTransaction) => txn.id !== id)
      );
      toast.success('Split transaction deleted successfully!');
    } catch (error) {
      console.error("Failed to delete split transaction:", error);
      toast.error('Failed to delete split transaction. Please try again.');
    }
  }, [splitTransactions]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(e.target.value));
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  }, []);

  const handleTransactionIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTransactionId(e.target.value);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Split Transactions</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="number"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Amount"
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Description"
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          value={transactionId}
          onChange={handleTransactionIdChange}
          placeholder="Parent Transaction ID"
          className="w-full mb-2 p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 w-full"
        >
          Create Split Transaction
        </button>
      </form>

      <table className="w-full border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Description</th>
            <th className="border px-4 py-2">Amount</th>
            <th className="border px-4 py-2">Parent Transaction ID</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {splitTransactions.map((split: any) => (
            <tr key={split.id}>
              <td className="border px-4 py-2">{split.description}</td>
              <td className="border px-4 py-2">${Math.abs(split.amount).toFixed(2)}</td>
              <td className="border px-4 py-2">{split.transaction.id}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => handleDelete(split.id)}
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Delete split transaction"
                  aria-label="Delete split transaction"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SplitTransactions;
