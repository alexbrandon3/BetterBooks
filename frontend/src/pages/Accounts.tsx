import React, { useEffect, useState, useRef } from "react";
import { formatEnumLabel } from "../utils/formatEnumLabel";
import { Account, AccountForm, AccountType, FinancialCategory } from "../types/account";
import * as AccountService from "../services/AccountService";
import { toast } from 'react-hot-toast';

const initialFormState: AccountForm = {
  name: "",
  type: AccountType.ASSET,
  category: "",
  subcategory: "",
  financialCategory: FinancialCategory.OPERATING_EXPENSE,
  financialSubcategory: "",
  balance: "0"
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const displayBalance = (account: Account) => {
  return formatCurrency(Math.abs(account.balance));
};

const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<AccountForm>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestedFields, setSuggestedFields] = useState<string[]>([]);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (editingAccountId && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [editingAccountId]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AccountService.fetchAccounts();
      setAccounts(data);
    } catch (err) {
      console.error("Error fetching accounts", err);
      setError("Failed to fetch accounts. Please try again later.");
      toast.error('Failed to load accounts. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError("Account name is required");
      return false;
    }

    const balance = parseFloat(form.balance);
    if (isNaN(balance) || balance < 0) {
      setError("Balance must be a positive number");
      return false;
    }

    if (!form.type) {
      setError("Account type is required");
      return false;
    }

    if (!form.financialCategory) {
      setError("Financial category is required");
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
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        category: form.category?.trim() || null,
        subcategory: form.subcategory?.trim() || null,
        financialCategory: form.financialCategory,
        financialSubcategory: form.financialSubcategory?.trim() || null,
        balance: parseFloat(form.balance)
      };

      if (editingAccountId) {
        await AccountService.updateAccount(editingAccountId, payload);
        setSuccessMessage("Account updated successfully!");
        toast.success("Account updated successfully!");
      } else {
        await AccountService.createAccount(payload);
        setSuccessMessage("Account created successfully!");
        toast.success("Account created successfully!");
      }

      setForm(initialFormState);
      setEditingAccountId(null);
      fetchAccounts();
    } catch (err: any) {
      console.error("Error saving account:", err);
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || "Server error occurred";
        setError(`Failed to ${editingAccountId ? 'update' : 'create'} account: ${errorMessage}`);
        toast.error(`Failed to ${editingAccountId ? 'update' : 'create'} account. Please try again.`);
        console.error("Server error:", err.response.data);
      } else if (err.request) {
        setError("No response from server. Please check your connection.");
        toast.error("Connection error. Please check your internet connection.");
        console.error("Network error:", err.request);
      } else {
        setError("An unexpected error occurred. Please try again.");
        toast.error("An unexpected error occurred. Please try again.");
        console.error("Error:", err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (account: Account) => {
    setForm({
      name: account.name,
      type: account.type,
      category: account.category,
      subcategory: account.subcategory,
      financialCategory: account.financialCategory,
      financialSubcategory: account.financialSubcategory,
      balance: account.balance.toString()
    });
    setEditingAccountId(Number(account.id));
    setShowAdvanced(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this account? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await AccountService.deleteAccount(id);
      setSuccessMessage("Account deleted successfully!");
      toast.success("Account deleted successfully!");
      fetchAccounts();
    } catch (err: any) {
      console.error("Error deleting account:", err);
      if (err.response) {
        const errorMessage = err.response.data?.message || err.response.data?.error || "Server error occurred";
        setError(`Failed to delete account: ${errorMessage}`);
        toast.error("Failed to delete account. Please try again.");
        console.error("Server error:", err.response.data);
      } else if (err.request) {
        setError("No response from server. Please check your connection.");
        toast.error("Connection error. Please check your internet connection.");
        console.error("Network error:", err.request);
      } else {
        setError("An unexpected error occurred. Please try again.");
        toast.error("An unexpected error occurred. Please try again.");
        console.error("Error:", err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(initialFormState);
    setEditingAccountId(null);
    setSuggestedFields([]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuggestedFields((prev) => prev.filter((field) => field !== name));
  };

  const handleNameBlur = async () => {
    if (!form.name.trim() || editingAccountId) return;

    try {
      const suggestions = await AccountService.suggestAccountMetadata(form.name.trim());
      
      if (suggestions) {
        const updates: Partial<AccountForm> = {};
        
        if (!form.type) updates.type = suggestions.type;
        if (!form.category) updates.category = suggestions.category;
        if (!form.subcategory) updates.subcategory = suggestions.subcategory;
        
        if (!form.financialCategory || form.financialCategory === FinancialCategory.OPERATING_EXPENSE) {
          updates.financialCategory = suggestions.financialCategory;
        }
        if (!form.financialSubcategory || form.financialSubcategory === "Uncategorized") {
          updates.financialSubcategory = suggestions.financialSubcategory;
        }

        if (Object.keys(updates).length > 0) {
          setForm(prev => ({
            ...prev,
            ...updates
          }));
          setSuggestedFields(Object.keys(updates));
        }
      }
    } catch (err) {
      console.error("Error getting account suggestions:", err);
      // Silent failure for minor fetches like smart suggestions
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Accounts</h1>

      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingAccountId ? "Edit Account" : "Add New Account"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                onBlur={handleNameBlur}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type *
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.values(AccountType).map((type) => (
                  <option key={type} value={type}>
                    {formatEnumLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Balance
            </label>
            <input
              type="number"
              name="balance"
              value={form.balance}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Advanced Classification Section */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
            </button>
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    General Category
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="category"
                      value={form.category}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {suggestedFields.includes("category") && (
                      <span className="absolute top-0 right-0 mt-1 mr-2 text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded">
                        Suggested
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Used for classification in financial reports. We'll suggest a value when possible.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Subcategory
                  </label>
                  <input
                    type="text"
                    name="subcategory"
                    value={form.subcategory}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Only needed if you want deeper categorization.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reporting Category (GAAP) *
                  </label>
                  <select
                    name="financialCategory"
                    value={form.financialCategory}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.values(FinancialCategory).map((category) => (
                      <option key={category} value={category}>
                        {formatEnumLabel(category)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Used for classification in financial reports. We'll suggest a value when possible.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reporting Subcategory
                  </label>
                  <input
                    type="text"
                    name="financialSubcategory"
                    value={form.financialSubcategory}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Only needed if you want deeper categorization.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            {editingAccountId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? (editingAccountId ? "Updating..." : "Creating...") 
                : (editingAccountId ? "Update Account" : "Add Account")}
            </button>
          </div>
        </form>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial Subcategory
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No accounts found
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr 
                    key={account.id} 
                    className={`hover:bg-gray-50 ${
                      editingAccountId === Number(account.id) 
                        ? 'bg-yellow-50 border-l-4 border-yellow-400' 
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatEnumLabel(account.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {account.category || "—"}
                        {suggestedFields.includes("category") && (
                          <span 
                            className="text-blue-500 cursor-help" 
                            title="Category suggested based on the account name"
                          >
                            💡
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {account.subcategory || "—"}
                        {suggestedFields.includes("subcategory") && (
                          <span 
                            className="text-blue-500 cursor-help" 
                            title="Subcategory suggested based on the account name"
                          >
                            💡
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {formatEnumLabel(account.financialCategory)}
                        {suggestedFields.includes("financialCategory") && (
                          <span 
                            className="text-blue-500 cursor-help" 
                            title="Financial category suggested based on the account name"
                          >
                            💡
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {formatEnumLabel(account.financialSubcategory)}
                        {suggestedFields.includes("financialSubcategory") && (
                          <span 
                            className="text-blue-500 cursor-help" 
                            title="Financial subcategory suggested based on the account name"
                          >
                            💡
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {displayBalance(account)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(account)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit account"
                        aria-label="Edit account"
                      >
                        <span className="text-blue-600 hover:text-blue-800">✏️</span>
                      </button>
                      <button
                        onClick={() => handleDelete(Number(account.id))}
                        className="text-gray-600 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete account"
                        aria-label="Delete account"
                      >
                        <span className="text-gray-600 hover:text-red-600">🗑️</span>
                      </button>
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

export default Accounts;