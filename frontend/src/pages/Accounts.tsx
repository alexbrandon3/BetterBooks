import React, { useEffect, useState, useRef } from "react";
import { formatEnumLabel } from "../utils/formatEnumLabel";
import { Account, AccountForm, AccountType, FinancialCategory, AccountTemplate } from "../types/account";
import * as AccountService from "../services/AccountService";
import { toast } from 'react-hot-toast';

const initialFormState: AccountForm = {
  name: "",
  type: AccountType.ASSET,
  category: "",
  subcategory: "",
  financialCategory: FinancialCategory.CURRENT_ASSET,
  financialSubcategory: "",
  balance: "0"
};

const formatCurrency = (amount: number) => {
  // Safety check for NaN or invalid values
  if (isNaN(amount) || !isFinite(amount)) {
    console.warn('Invalid amount for currency formatting:', amount);
    return '$0.00';
  }
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

const isNegativeBalance = (account: Account) => {
  const balance = Number(account.balance);
  return !isNaN(balance) && balance < 0;
};

const getBalanceDisplay = (account: Account) => {
  const balance = Number(account.balance);
  
  // Safety check for NaN or invalid values
  if (isNaN(balance) || !isFinite(balance)) {
    console.warn('Invalid balance for account:', account.name, 'balance:', account.balance);
    return '$0.00';
  }
  
  if (balance < 0) {
    return `-${formatCurrency(Math.abs(balance))}`;
  }
  return formatCurrency(balance);
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
  const [suggestionExplanation, setSuggestionExplanation] = useState<string | null>(null);
  const [suggestionConfidence, setSuggestionConfidence] = useState<number | null>(null);
  const [templates, setTemplates] = useState<AccountTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAccounts();
    fetchTemplates();
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
      const data = await AccountService.fetchAccountsWithConsistentBalances();
      console.log('📊 Received accounts data:', data);
      
      // Check for any invalid balance values
      data.forEach(account => {
        if (isNaN(Number(account.balance)) || !isFinite(Number(account.balance))) {
          console.warn('⚠️ Invalid balance detected for account:', account.name, 'balance:', account.balance, 'type:', typeof account.balance);
        }
      });
      
      // Sort accounts by type first, then by category
      const sortedData = data.sort((a, b) => {
        // First sort by account type
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        // Then sort by category
        return (a.category || '').localeCompare(b.category || '');
      });
      
      setAccounts(sortedData);
    } catch (err) {
      console.error("Error fetching accounts", err);
      setError("Failed to fetch accounts. Please try again later.");
      toast.error('Failed to load accounts. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await AccountService.getAccountTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Error fetching templates", err);
      // Don't show error toast for templates as it's not critical
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError("Account name is required");
      return false;
    }

    const balance = parseFloat(form.balance);
    if (isNaN(balance)) {
      setError("Balance must be a valid number");
      return false;
    }

    // For expense accounts, starting balance should typically be negative (representing accumulated expenses)
    // For income accounts, starting balance should typically be positive (representing accumulated income)
    // For asset accounts, starting balance should typically be positive (representing cash/investments)
    // For liability accounts, starting balance should typically be negative (representing debt)
    if (form.type === AccountType.EXPENSE && balance > 0) {
      setError("Expense accounts typically have negative starting balances (representing accumulated expenses). Consider entering a negative value.");
      return false;
    }

    if (form.type === AccountType.INCOME && balance < 0) {
      setError("Income accounts typically have positive starting balances (representing accumulated income). Consider entering a positive value.");
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

    // Validate logical consistency
    if (form.type === AccountType.ASSET && form.financialCategory === FinancialCategory.OPERATING_EXPENSE) {
      setError("Assets cannot be classified as operating expenses. Please check your account type and financial category.");
      return false;
    }

    if (form.type === AccountType.LIABILITY && form.financialCategory === FinancialCategory.CURRENT_ASSET) {
      setError("Liabilities cannot be classified as current assets. Please check your account type and financial category.");
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
      const balance = parseFloat(form.balance);
      console.log(`📤 Sending account payload:`, {
        name: form.name.trim(),
        type: form.type,
        balance,
        balanceType: typeof balance,
        formBalance: form.balance
      });
      
      const payload = {
        name: form.name.trim(),
        type: form.type,
        category: form.category?.trim() || undefined,
        subcategory: form.subcategory?.trim() || undefined,
        financialCategory: form.financialCategory,
        financialSubcategory: form.financialSubcategory?.trim() || undefined,
        balance
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
      // Don't clear suggestion explanation immediately - let user read it
      setTimeout(() => {
        setSuggestionExplanation(null);
        setSuggestionConfidence(null);
      }, 5000); // Keep message visible for 5 seconds
      setSuggestedFields([]);
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
      category: account.category || "",
      subcategory: account.subcategory || "",
      financialCategory: account.financialCategory,
      financialSubcategory: account.financialSubcategory || "",
      balance: account.balance.toString()
    });
    setEditingAccountId(Number(account.id));
    setShowAdvanced(true);
    setSuggestionExplanation(null);
    setSuggestionConfidence(null);
    setSuggestedFields([]);
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
    setSuggestionExplanation(null);
    setSuggestionConfidence(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // If account type is changing, suggest appropriate starting balance
    if (name === 'type' && (!form.balance || form.balance === '0')) {
      const newType = value as AccountType;
      let suggestedBalance = '0';
      
      if (newType === AccountType.EXPENSE) {
        suggestedBalance = '-100.00';
      } else if (newType === AccountType.INCOME) {
        suggestedBalance = '100.00';
      } else if (newType === AccountType.ASSET) {
        suggestedBalance = '1000.00';
      } else if (newType === AccountType.LIABILITY) {
        suggestedBalance = '-1000.00';
      }
      
      setForm(prev => ({ 
        ...prev, 
        [name]: value as AccountType,
        balance: suggestedBalance
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    
    setSuggestedFields((prev) => prev.filter((field) => field !== name));
    
    // Clear suggestion explanation when user manually changes fields
    if (name !== 'name') {
      setSuggestionExplanation(null);
      setSuggestionConfidence(null);
    }
  };

  const handleNameBlur = async () => {
    if (!form.name.trim() || editingAccountId) return;

    try {
      const suggestion = await AccountService.suggestAccountMetadata(form.name.trim());
      
      if (suggestion) {
        const updates: Partial<AccountForm> = {};
        
        if (!form.type) updates.type = suggestion.type as AccountType;
        if (!form.category) updates.category = suggestion.category;
        if (!form.subcategory) updates.subcategory = suggestion.subcategory;
        
        if (!form.financialCategory || form.financialCategory === FinancialCategory.OPERATING_EXPENSE) {
          updates.financialCategory = suggestion.financialCategory as FinancialCategory;
        }
        if (!form.financialSubcategory || form.financialSubcategory === "Uncategorized") {
          updates.financialSubcategory = suggestion.financialSubcategory;
        }

        if (Object.keys(updates).length > 0) {
          setForm(prev => ({
            ...prev,
            ...updates
          }));
          setSuggestedFields(Object.keys(updates));
          setSuggestionExplanation(suggestion.explanation || null);
          setSuggestionConfidence(suggestion.confidence || null);
        }
      }
    } catch (err) {
      console.error("Error getting account suggestions:", err);
      // Silent failure for minor fetches like smart suggestions
    }
  };

  const handleTemplateSelect = (template: AccountTemplate) => {
    // Suggest appropriate starting balance based on template type
    let suggestedBalance = form.balance;
    if (!form.balance || form.balance === '0') {
      if (template.type === AccountType.EXPENSE) {
        suggestedBalance = '-100.00';
      } else if (template.type === AccountType.INCOME) {
        suggestedBalance = '100.00';
      } else if (template.type === AccountType.ASSET) {
        suggestedBalance = '1000.00';
      } else if (template.type === AccountType.LIABILITY) {
        suggestedBalance = '-1000.00';
      }
    }
    
    setForm({
      name: form.name, // Keep the name the user typed
      type: template.type as AccountType,
      category: template.category,
      subcategory: template.subcategory,
      financialCategory: template.financialCategory as FinancialCategory,
      financialSubcategory: template.financialSubcategory,
      balance: suggestedBalance
    });
    setSuggestedFields(['type', 'category', 'subcategory', 'financialCategory', 'financialSubcategory']);
    setSuggestionExplanation(`Applied template: ${template.description}`);
    setSuggestionConfidence(0.9);
    setShowTemplates(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "High Confidence";
    if (confidence >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  };

  // Helper function to get color-coded styling for account types
  const getAccountTypeStyle = (type: AccountType) => {
    switch (type) {
      case AccountType.ASSET:
        return "bg-green-50 text-green-800 border border-green-200";
      case AccountType.LIABILITY:
        return "bg-red-50 text-red-800 border border-red-200";
      case AccountType.EQUITY:
        return "bg-blue-50 text-blue-800 border border-blue-200";
      case AccountType.INCOME:
        return "bg-green-50 text-green-800 border border-green-200";
      case AccountType.EXPENSE:
        return "bg-red-50 text-red-800 border border-red-200";
      default:
        return "bg-gray-50 text-gray-800 border border-gray-200";
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
              Starting Balance
            </label>
            <input
              type="number"
              name="balance"
              value={form.balance}
              onChange={handleInputChange}
              step="0.01"
              placeholder={form.type === AccountType.EXPENSE ? "-100.00" : "100.00"}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {form.type === AccountType.EXPENSE && "Expense accounts typically have negative starting balances (representing accumulated expenses)"}
              {form.type === AccountType.INCOME && "Income accounts typically have positive starting balances (representing accumulated income)"}
              {form.type === AccountType.ASSET && "Asset accounts typically have positive starting balances (representing cash/investments)"}
              {form.type === AccountType.LIABILITY && "Liability accounts typically have negative starting balances (representing debt)"}
              {form.type === AccountType.EQUITY && "Equity accounts can have positive or negative starting balances depending on the situation"}
            </p>
          </div>

          {/* Quick Templates Section */}
          {!editingAccountId && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-blue-600 hover:text-blue-800 focus:outline-none flex items-center gap-2"
              >
                {showTemplates ? "Hide Quick Templates" : "Show Quick Templates"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showTemplates && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Popular Account Types</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {templates.filter(t => t.isPopular).map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateSelect(template)}
                        className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
                      >
                        <span className="text-lg mb-1">{template.icon}</span>
                        <span className="font-medium text-gray-900">{template.name}</span>
                        <span className="text-xs text-gray-500 text-center">{template.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Suggestion Explanation */}
          {suggestionExplanation && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-blue-800">{suggestionExplanation}</p>
                  {suggestionConfidence !== null && (
                    <p className={`text-xs mt-1 ${getConfidenceColor(suggestionConfidence)}`}>
                      {getConfidenceText(suggestionConfidence)} ({Math.round(suggestionConfidence * 100)}%)
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSuggestionExplanation(null);
                    setSuggestionConfidence(null);
                  }}
                  className="text-blue-400 hover:text-blue-600 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

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
                  <div className="relative">
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
                    {suggestedFields.includes("financialCategory") && (
                      <span className="absolute top-0 right-0 mt-1 mr-2 text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded">
                        Suggested
                      </span>
                    )}
                  </div>
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

      {/* Accounts List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Your Accounts</h2>
        </div>
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No accounts found. Create your first account above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{account.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeStyle(account.type)}`}>
                        {formatEnumLabel(account.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{account.category}</div>
                      {account.subcategory && (
                        <div className="text-xs text-gray-500">{account.subcategory}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isNegativeBalance(account) ? 'text-red-600' : 'text-gray-900'}`}>
                        {getBalanceDisplay(account)}
                        {isNegativeBalance(account) && (
                          <svg className="inline w-4 h-4 ml-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(account)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Edit account"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(Number(account.id))}
                        className="text-red-600 hover:text-red-900"
                        title="Delete account"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;