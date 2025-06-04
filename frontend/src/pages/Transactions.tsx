import React, { useEffect, useState } from "react";
import axios from "../utils/axios";

// TypeScript interfaces
interface Account {
  id: string;
  name: string;
  type: string;
  category: string;
  subcategory: string;
  financialCategory: string;
  financialSubcategory: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  accountId: string;
  account?: Account;
  date: string;
}

interface TransactionForm {
  amount: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  accountId: string;
  date: string;
}

const initialFormState: TransactionForm = {
  amount: "",
  type: "INCOME",
  description: "",
  accountId: "",
  date: new Date().toISOString().split("T")[0],
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<TransactionForm>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get("/transactions");
      // Sort transactions by date descending
      const sortedTransactions = res.data.sort((a: Transaction, b: Transaction) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(sortedTransactions);
    } catch (err) {
      setError("Failed to fetch transactions. Please try again later.");
      console.error("Error fetching transactions", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await axios.get("/accounts");
      setAccounts(res.data);
    } catch (err) {
      setError("Failed to fetch accounts. Please try again later.");
      console.error("Error fetching accounts", err);
    }
  };

  const validateForm = () => {
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number");
      return false;
    }

    if (!form.description.trim()) {
      setError("Description is required");
      return false;
    }

    if (!form.accountId) {
      setError("Please select an account");
      return false;
    }

    if (!form.date) {
      setError("Date is required");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);

    try {
      const amount = parseFloat(form.amount);
      const payload = { ...form, amount };

      if (editingTransactionId) {
        await axios.put(`/transactions/${editingTransactionId}`, payload);
        setSuccessMessage("Transaction updated successfully!");
      } else {
        await axios.post("/transactions", payload);
        setSuccessMessage("Transaction created successfully!");
      }

      setForm(initialFormState);
      setEditingTransactionId(null);
      setError(null);
      fetchTransactions();
    } catch (err) {
      setError(editingTransactionId 
        ? "Failed to update transaction. Please try again."
        : "Failed to create transaction. Please try again.");
      console.error("Error saving transaction", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id);
    setForm({
      amount: transaction.amount.toString(),
      type: transaction.type,
      description: transaction.description,
      accountId: transaction.accountId,
      date: transaction.date.split("T")[0],
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(`/transactions/${id}`);
      setSuccessMessage("Transaction deleted successfully!");
      fetchTransactions();
    } catch (err) {
      setError("Failed to delete transaction. Please try again.");
      console.error("Error deleting transaction", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(initialFormState);
    setEditingTransactionId(null);
    setError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>

      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingTransactionId ? "Edit Transaction" : "Add New Transaction"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm mb-4" role="alert">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                id="amount"
                type="number"
                name="amount"
                value={form.amount?.toString() || ""}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                id="date"
                type="date"
                name="date"
                value={form.date}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                id="description"
                type="text"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
                Account *
              </label>
              <select
                id="accountId"
                name="accountId"
                value={form.accountId}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            {editingTransactionId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingTransactionId ? "Update Transaction" : "Add Transaction"}
            </button>
          </div>
        </form>

        {/* Status Messages */}
        {successMessage && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="ml-2">Loading transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.description}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      tx.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tx.type === "INCOME"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.account?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;