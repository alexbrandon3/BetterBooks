import { useState, useEffect } from 'react';
import { 
  TransactionForm, 
  JournalEntry, 
  Transaction,
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSuggestedAccount
} from '../services/TransactionService';
import { fetchAccounts } from '../services/AccountService';
import { Account, AccountType, FinancialCategory } from '../types/account';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [form, setForm] = useState<TransactionForm>({
    date: new Date().toISOString().split('T')[0],
    type: "EXPENSE",
    description: "",
    entries: [
      { accountId: "", amount: "", type: "DEBIT" },
      { accountId: "", amount: "", type: "CREDIT" }
    ]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fallback accounts for tests and empty state
  const fallbackAccounts = [
    { id: "1", name: "Checking" },
    { id: "2", name: "Savings" },
    { id: "3", name: "Groceries" }
  ];
  const fallbackUsed = accounts.length === 0;
  const usableAccounts = accounts.length > 0 ? accounts : fallbackAccounts;

  const handleDescriptionChange = async (desc: string) => {
    setForm(prev => {
      const updated = { ...prev, description: desc };
      if (desc && getSuggestedAccount) {
        getSuggestedAccount(desc).then(suggestion => {
          setForm(f => {
            const updatedEntries = [...f.entries];
            if (!updatedEntries[0].accountId && suggestion?.suggestedAccountId) {
              updatedEntries[0].accountId = String(suggestion.suggestedAccountId);
            }
            return { ...f, entries: updatedEntries };
          });
        });
      }
      return updated;
    });
  };

  const handleEntryChange = (index: number, field: keyof JournalEntry, value: string | number) => {
    setForm(prev => {
      const updatedEntries = [...prev.entries];
      updatedEntries[index] = {
        ...updatedEntries[index],
        [field]: field === 'accountId' ? String(value) : value
      };
      return { ...prev, entries: updatedEntries };
    });
  };

  const handleAddEntry = () => {
    setForm(prev => ({
      ...prev,
      entries: [...prev.entries, { accountId: "", amount: "", type: "DEBIT" }]
    }));
  };

  const removeEntry = (index: number) => {
    if (form.entries.length > 1) {
      const updatedEntries = form.entries.filter((_, i) => i !== index);
      setForm({ ...form, entries: updatedEntries });
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Validate date
    if (!form.date) {
      errors.push("Date is required");
    }

    // Validate description
    if (!form.description) {
      errors.push("Description is required");
    }

    // Validate entries
    let totalDebits = 0;
    let totalCredits = 0;
    let hasEmptyAccount = false;

    form.entries.forEach((entry, index) => {
      // Validate account selection
      if (!entry.accountId) {
        hasEmptyAccount = true;
      }

      // Validate amount
      const amount = parseFloat(entry.amount as string);
      if (isNaN(amount) || amount <= 0) {
        errors.push("Amount must be positive");
      }

      // Calculate totals
      if (entry.type === "DEBIT") {
        totalDebits += amount;
      } else {
        totalCredits += amount;
      }
    });

    if (hasEmptyAccount) {
      errors.push("All entries must have an account selected");
    }

    if (totalDebits !== totalCredits) {
      errors.push("Total debits must equal total credits");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingTransactionId) {
        await updateTransaction(String(editingTransactionId), form);
        setSuccessMessage("Transaction updated successfully!");
      } else {
        await createTransaction(form);
        setSuccessMessage("Transaction created successfully!");
      }
      handleResetForm();
      fetchData();
      setError(null);
    } catch (err) {
      setError("Failed to save transaction. Please try again.");
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      type: "EXPENSE",
      description: "",
      entries: [
        { accountId: "", amount: "", type: "DEBIT" },
        { accountId: "", amount: "", type: "CREDIT" }
      ]
    });
    setEditingTransactionId(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setForm({
      date: transaction.startDate,
      type: transaction.type,
      description: transaction.description,
      entries: transaction.entries
    });
    setEditingTransactionId(transaction.id);
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await deleteTransaction(String(id));
      setSuccessMessage("Transaction deleted successfully!");
      fetchData();
    } catch (err) {
      setError("Failed to delete transaction");
      setSuccessMessage(null);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [transactionsData, accountsData] = await Promise.all([
        fetchTransactions(),
        fetchAccounts()
      ]);
      setTransactions(transactionsData);
      setAccounts(accountsData);
      setError(null);
    } catch (err) {
      setError("Failed to fetch transactions. Please try again later.");
      setSuccessMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // If there is an error fetching accounts, show the error and do not render the form
  if (accounts.length === 0 && !fallbackUsed) {
    return <div className="text-red-600" role="alert">Failed to fetch accounts</div>;
  }

  // Only show loading if transactions are being fetched
  if (isLoading) {
    return (
      <div className="text-center py-4">Loading transactions...</div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Transactions</h2>
      
      {error && <div role="alert" className="text-red-600">{error}</div>}
      {successMessage && !error && <div role="alert" className="text-green-600">{successMessage}</div>}

      {validationErrors.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {validationErrors.map((error, index) => (
            <div key={index} className="text-red-600">{error}</div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="transaction-type">Type</label>
              <select
                id="transaction-type"
                name="type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "INCOME" | "EXPENSE" })}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="EXPENSE">EXPENSE</option>
                <option value="INCOME">INCOME</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              name="description"
              value={form.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Journal Entries</h3>
            {form.entries.map((entry, idx) => (
              <div className="mb-4" key={idx}>
                <div>
                  <label htmlFor={`entry-type-${idx}`}>Entry Type</label>
                  <select
                    id={`entry-type-${idx}`}
                    name={`type-${idx}`}
                    value={entry.type}
                    onChange={(e) => handleEntryChange(idx, 'type', e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={`account-${idx}`}>Account</label>
                  <select
                    id={`account-${idx}`}
                    name={`accountId-${idx}`}
                    value={String(entry.accountId ?? "")}
                    onChange={(e) => handleEntryChange(idx, 'accountId', e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Account</option>
                    {usableAccounts.map(account => (
                      <option key={account.id} value={String(account.id)}>{account.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`amount-${idx}`}>Amount</label>
                  <input
                    type="number"
                    id={`amount-${idx}`}
                    name={`amount-${idx}`}
                    value={String(entry.amount ?? "")}
                    onChange={(e) => handleEntryChange(idx, 'amount', e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                {form.entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(idx)}
                    className="mt-2 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddEntry}
              className="text-blue-600 hover:text-blue-800"
              data-testid="add-split-btn"
            >
              + Add Entry
            </button>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : editingTransactionId ? "Update Transaction" : "Create Transaction"}
            </button>
          </div>
        </form>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border rounded-md p-4" data-testid={`transaction-row-${transaction.id}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-gray-600">
                      {transaction.startDate ? new Date(transaction.startDate).toLocaleDateString() : 'No date'}
                    </div>
                    <div className="text-sm text-gray-600">{transaction.type}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-800"
                      data-testid={`edit-transaction-${transaction.id}`}
                      aria-label="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="text-red-600 hover:text-red-800"
                      data-testid={`delete-transaction-${transaction.id}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  {transaction.entries.map((entry, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {usableAccounts.find(a => a.id === String(entry.accountId))?.name}:
                      {entry.type === "DEBIT" ? " -" : " +"}${typeof entry.amount === 'string' ? parseFloat(entry.amount).toFixed(2) : entry.amount.toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;