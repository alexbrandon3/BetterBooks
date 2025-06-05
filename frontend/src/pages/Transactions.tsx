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
  date: string;  // This is the transaction date
}

interface RecurringTransaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  accountId: string;
  account?: Account;
  startDate: string;  // This is the start date for recurring transactions
  recurrencePattern: "DAILY" | "WEEKLY" | "MONTHLY";
  endDate?: string;
}

interface TransactionForm {
  amount: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  accountId: string;
  date: string;
  isRecurring: boolean;
  recurrencePattern?: "DAILY" | "WEEKLY" | "MONTHLY";
  endDate?: string;
}

const initialFormState: TransactionForm = {
  amount: "",
  type: "INCOME",
  description: "",
  accountId: "",
  date: new Date().toISOString().split("T")[0],
  isRecurring: false,
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<(Transaction | RecurringTransaction)[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<TransactionForm>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [isEditingRecurring, setIsEditingRecurring] = useState(false);

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
    setIsLoading(true);
    try {
      const res = await axios.get("/accounts");
      setAccounts(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch accounts. Please try again later.");
      console.error("Error fetching accounts", err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const selectedAccount = accounts.find(acc => acc.id === form.accountId);
    console.log('VALIDATING', form, selectedAccount);

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

    if (form.isRecurring && !form.recurrencePattern) {
      setError("Recurrence pattern is required for recurring transactions");
      return false;
    }

    if (form.isRecurring && form.endDate && new Date(form.endDate) < new Date(form.date)) {
      setError("End date must be after start date");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      if (form.isRecurring) {
        const recurringTransaction = {
          amount: parseFloat(form.amount),
          type: form.type,
          description: form.description,
          accountId: form.accountId,
          startDate: form.date,
          recurrencePattern: form.recurrencePattern,
          endDate: form.endDate || undefined,
        };

        if (isEditingRecurring && editingTransactionId) {
          await axios.put(`/recurring-transactions/${editingTransactionId}`, recurringTransaction);
          setSuccessMessage("Recurring transaction updated successfully!");
        } else {
          await axios.post("/recurring-transactions", recurringTransaction);
          setSuccessMessage("Recurring transaction created successfully!");
        }
      } else {
        const transaction = {
          amount: parseFloat(form.amount),
          type: form.type,
          description: form.description,
          accountId: form.accountId,
          date: form.date,
        };

        if (editingTransactionId) {
          await axios.put(`/transactions/${editingTransactionId}`, transaction);
          setSuccessMessage("Transaction updated successfully!");
        } else {
          await axios.post("/transactions", transaction);
          setSuccessMessage("Transaction created successfully!");
        }
      }

      // Reset form and states
      setForm({
        ...initialFormState,
        date: new Date().toISOString().split("T")[0],
      });
      setEditingTransactionId(null);
      setIsEditingRecurring(false);
      fetchTransactions();
    } catch (err) {
      setError("Failed to save transaction. Please try again.");
      console.error("Error saving transaction", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction | RecurringTransaction) => {
    const isRecurring = 'recurrencePattern' in transaction;
    
    setIsEditingRecurring(isRecurring);
    setEditingTransactionId(transaction.id);
    
    if (isRecurring) {
      const recurringTx = transaction as RecurringTransaction;
      setForm({
        amount: recurringTx.amount.toString(),
        type: recurringTx.type,
        description: recurringTx.description,
        accountId: recurringTx.accountId,
        date: recurringTx.startDate.split("T")[0],
        isRecurring: true,
        recurrencePattern: recurringTx.recurrencePattern,
        endDate: recurringTx.endDate?.split("T")[0] || undefined
      });
    } else {
      const regularTx = transaction as Transaction;
      setForm({
        amount: regularTx.amount.toString(),
        type: regularTx.type,
        description: regularTx.description,
        accountId: regularTx.accountId,
        date: regularTx.date.split("T")[0],
        isRecurring: false,
      });
    }
  };

  // Helper function to check if a transaction is recurring
  const isRecurringTransaction = (transaction: Transaction | RecurringTransaction): transaction is RecurringTransaction => {
    return 'recurrencePattern' in transaction;
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
    setForm({
      ...initialFormState,
      date: new Date().toISOString().split("T")[0],
    });
    setEditingTransactionId(null);
    setIsEditingRecurring(false);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (target as HTMLInputElement).checked : value,
    }));
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
          {editingTransactionId 
            ? (isEditingRecurring ? "Edit Recurring Transaction" : "Edit Transaction")
            : "Add New Transaction"}
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                id="amount"
                type="number"
                name="amount"
                value={form.amount !== undefined && form.amount !== null ? form.amount : ""}
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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

            <div className="flex items-center">
              <input
                id="isRecurring"
                type="checkbox"
                name="isRecurring"
                checked={form.isRecurring}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700">
                Make Recurring
              </label>
            </div>

            {form.isRecurring && (
              <>
                <div>
                  <label htmlFor="recurrencePattern" className="block text-sm font-medium text-gray-700 mb-1">
                    Recurrence Pattern *
                  </label>
                  <select
                    id="recurrencePattern"
                    name="recurrencePattern"
                    value={form.recurrencePattern}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Pattern</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            {editingTransactionId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : editingTransactionId ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => {
              const isRecurring = isRecurringTransaction(transaction);
              const date = isRecurring ? transaction.startDate : transaction.date;
              return (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.description}</div>
                    {isRecurring && (
                      <div className="text-xs text-gray-500">
                        Recurring: {transaction.recurrencePattern.toLowerCase()}
                        {transaction.endDate && ` until ${new Date(transaction.endDate).toLocaleDateString()}`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={transaction.type === "INCOME" ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.account?.name || "Unknown Account"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;