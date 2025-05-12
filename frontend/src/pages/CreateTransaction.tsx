import React, { useState, useEffect } from "react";
import { createTransaction } from "../services/TransactionService";
import axios from "../utils/axios";

const CreateTransaction = ({ onTransactionCreated }: { onTransactionCreated: () => void }) => {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get("/accounts");
        setAccounts(response.data);
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      }
    };
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTransaction({ amount, description, type, accountId });
      onTransactionCreated();
    } catch (error) {
      console.error("Failed to create transaction:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded">
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
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
      >
        <option value="EXPENSE">Expense</option>
        <option value="INCOME">Income</option>
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
      <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 w-full">
        Create Transaction
      </button>
    </form>
  );
};

export default CreateTransaction;
