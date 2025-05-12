import React, { useEffect, useState } from "react";
import {
  fetchTransactions,
  deleteTransaction,
} from "../services/TransactionService";
import CreateTransaction from "./CreateTransaction";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter((txn: Transaction) => txn.id !== id));
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const handleTransactionCreated = () => {
    loadTransactions();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>
      <CreateTransaction onTransactionCreated={handleTransactionCreated} />
      <table className="w-full border mt-4">
        <thead>
          <tr>
            <th className="border px-4 py-2">Description</th>
            <th className="border px-4 py-2">Amount</th>
            <th className="border px-4 py-2">Type</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction: any) => (
            <tr key={transaction.id}>
              <td className="border px-4 py-2">{transaction.description}</td>

              <td className="border px-4 py-2">
                ${transaction.amount.toFixed(2)}
              </td>

              <td className="border px-4 py-2">{transaction.type}</td>

              <td className="border px-4 py-2">
                <button
                  onClick={() => handleDelete(transaction.id)}
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

export default Transactions;
