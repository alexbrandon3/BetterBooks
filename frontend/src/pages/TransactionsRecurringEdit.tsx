import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface Account {
  id: string;
  name: string;
}

interface RecurringTransaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  accountId: string;
  date: string;
  isRecurring: boolean;
  recurrencePattern: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  endDate: string;
}

const TransactionsRecurringEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<Partial<RecurringTransaction>>({
    amount: 0,
    type: "EXPENSE",
    description: "",
    accountId: "",
    date: new Date().toISOString().split("T")[0],
    isRecurring: true,
    recurrencePattern: "MONTHLY",
    endDate: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch accounts
        const accountsRes = await axios.get("/accounts");
        setAccounts(accountsRes.data);

        // Fetch transaction data
        const transactionRes = await axios.get(`/recurring-transactions/${id}`);
        const transaction = transactionRes.data;
        setForm({
          ...transaction,
          date: transaction.startDate, // Map startDate to date for form
        });
      } catch (err) {
        setError("Failed to load data. Please try again later.");
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      const recurringTransaction = {
        ...form,
        startDate: form.date, // Map date back to startDate for API
      };

      await axios.put(`/recurring-transactions/${id}`, recurringTransaction);
      navigate("/transactions");
    } catch (err) {
      setError("Failed to update recurring transaction. Please try again.");
      console.error("Error updating transaction:", err);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Recurring Transaction</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="amount">
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                required
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="type">
                Type *
              </label>
              <select
                id="type"
                name="type"
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "INCOME" | "EXPENSE" })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">
                Start Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="accountId">
                Account *
              </label>
              <select
                id="accountId"
                name="accountId"
                required
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="recurrencePattern">
                Recurrence Pattern *
              </label>
              <select
                id="recurrencePattern"
                name="recurrencePattern"
                required
                value={form.recurrencePattern}
                onChange={(e) =>
                  setForm({ ...form, recurrencePattern: e.target.value as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="endDate">
                End Date *
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/transactions")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={isLoading}
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionsRecurringEdit; 