import React, { useEffect, useState } from "react";
import {
  fetchSplitTransactions,
  createSplitTransaction,
  deleteSplitTransaction,
} from "../services/SplitTransactionService";
import { FaTrash } from "react-icons/fa";

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
    }
  };

  useEffect(() => {
    loadSplitTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSplitTransaction({ amount, description, transactionId });
      loadSplitTransactions();
    } catch (error) {
      console.error("Failed to create split transaction:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSplitTransaction(id);
      setSplitTransactions(
        splitTransactions.filter((txn: SplitTransaction) => txn.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete split transaction:", error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Split Transactions</h1>

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
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
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

export default SplitTransactions;
