import React, { useEffect, useState, useRef } from "react";
import { formatEnumLabel } from "../utils/formatEnumLabel";
import { Account, AccountForm, AccountType, FinancialCategory, AccountTemplate } from "../types/account";
import * as AccountService from "../services/AccountService";
import { toast } from 'react-hot-toast';
import { fetchAccountBalances } from "../services/AccountService";
import { debounce } from "../utils/debounce";

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



const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountBalances, setAccountBalances] = useState<Map<number, number>>(new Map());
  const [form, setForm] = useState<AccountForm>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestedFields, setSuggestedFields] = useState<string[]>([]);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [suggestionExplanation, setSuggestionExplanation] = useState<string | null>(null);
  const [suggestionConfidence, setSuggestionConfidence] = useState<number | string | null>(null);
  const [templates, setTemplates] = useState<AccountTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [balanceWarning, setBalanceWarning] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // New state for real-time suggestions
  const [liveSuggestion, setLiveSuggestion] = useState<any>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchTemplates();
    fetchBalances();
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

  const fetchBalances = async () => {
    try {
      const balances = await fetchAccountBalances();
      setAccountBalances(balances);
    } catch (err) {
      console.error("Error fetching account balances", err);
    }
  };

  const isNegativeBalance = (account: Account) => {
    const balance = accountBalances.get(account.id) ?? Number(account.balance);
    return !isNaN(balance) && balance < 0;
  };

  const getBalanceDisplay = (account: Account) => {
    const balance = accountBalances.get(account.id) ?? Number(account.balance);
    // Safety check for NaN or invalid values
    if (isNaN(balance) || !isFinite(balance)) {
      console.warn('Invalid balance for account:', account.name, 'balance:', balance);
      return '$0.00';
    }
    if (balance < 0) {
      return `-${formatCurrency(Math.abs(balance))}`;
    }
    return formatCurrency(balance);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError("Account name is required");
      return false;
    }

    // Check for duplicate name
    if (duplicateError) {
      setError(duplicateError);
      return false;
    }

    const balance = parseFloat(form.balance);
    if (isNaN(balance)) {
      setError("Balance must be a valid number");
      return false;
    }

    // Starting balances should be positive values
    if (balance < 0) {
      setError("Starting balances should be positive values. Please enter a positive amount.");
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
      setBalanceWarning(null);
      // Clear live suggestion state
      setLiveSuggestion(null);
      setDuplicateError(null);
      setIsLoadingSuggestion(false);
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
    setBalanceWarning(null);
  };

  const checkBalanceWarning = (balance: string, accountType: AccountType) => {
    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum) || balanceNum === 0) {
      setBalanceWarning(null);
      return;
    }

    const absBalance = Math.abs(balanceNum);
    const formattedBalance = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(absBalance);

    if (balanceNum !== 0) {
      setBalanceWarning(`⚠️ Starting balance of ${formattedBalance} will create unbalanced books. You'll need to create offsetting entries to balance your accounts.`);
    } else {
      setBalanceWarning(null);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // If account type is changing, keep balance at 0
    if (name === 'type') {
      setForm(prev => ({ 
        ...prev, 
        [name]: value as AccountType
      }));
      
      // Check for balance warning with new type
      checkBalanceWarning(form.balance, value as AccountType);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
      
      // Check for balance warning when balance or type changes
      if (name === 'balance' || name === 'type') {
        const newBalance = name === 'balance' ? value : form.balance;
        const newType = name === 'type' ? value as AccountType : form.type;
        checkBalanceWarning(newBalance, newType);
      }
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
        
        // Always apply the suggested financial category if we have a valid suggestion
        if (suggestion.financialCategory) {
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

  // Real-time suggestion and duplicate checking
  const debouncedCheckName = useRef(
    debounce(async (name: string) => {
      if (!name.trim() || name.length < 2) {
        setLiveSuggestion(null);
        setDuplicateError(null);
        return;
      }

      setIsLoadingSuggestion(true);
      setDuplicateError(null);

      try {
        // Check for duplicates first
        const duplicateCheck = await AccountService.checkDuplicateAccountName(name.trim());
        
        if (duplicateCheck.isDuplicate) {
          setDuplicateError(duplicateCheck.message || 'Account name already exists');
          setLiveSuggestion(null);
          return;
        }

        // Get suggestions if no duplicate
        const suggestion = await AccountService.suggestAccountMetadata(name.trim());
        setLiveSuggestion(suggestion);
        
        // Auto-apply high-confidence suggestions (80%+ confidence)
        if (suggestion && (suggestion.confidenceScore || 0) >= 80) {
          const updates: Partial<AccountForm> = {};
          
          // Always update account type for high-confidence suggestions
          if (suggestion.type) {
            updates.type = suggestion.type as AccountType;
          }
          
          // Update other fields if they're empty
          if (!form.category && suggestion.category) {
            updates.category = suggestion.category;
          }
          if (!form.subcategory && suggestion.subcategory) {
            updates.subcategory = suggestion.subcategory;
          }
          if (suggestion.financialCategory) {
            updates.financialCategory = suggestion.financialCategory as FinancialCategory;
          }
          if (!form.financialSubcategory && suggestion.financialSubcategory) {
            updates.financialSubcategory = suggestion.financialSubcategory;
          }

          if (Object.keys(updates).length > 0) {
            setForm(prev => ({
              ...prev,
              ...updates
            }));
            setSuggestedFields(Object.keys(updates));
            toast.success('High-confidence suggestion applied automatically!');
          }
        }
        
      } catch (error) {
        console.error('Error checking name:', error);
      } finally {
        setIsLoadingSuggestion(false);
      }
    }, 300)
  ).current;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear previous errors
    setDuplicateError(null);
    setLiveSuggestion(null);
    
    // Trigger real-time checking
    debouncedCheckName(value);
  };

  const handleTemplateSelect = (template: AccountTemplate) => {
    setForm({
      name: form.name, // Keep the name the user typed
      type: template.type as AccountType,
      category: template.category,
      subcategory: template.subcategory,
      financialCategory: template.financialCategory as FinancialCategory,
      financialSubcategory: template.financialSubcategory,
      balance: form.balance // Keep existing balance, don't auto-populate
    });
    setSuggestedFields(['type', 'category', 'subcategory', 'financialCategory', 'financialSubcategory']);
    setSuggestionExplanation(`Applied template: ${template.description}`);
    setSuggestionConfidence(0.9);
    setShowTemplates(false);
  };

  const getConfidencePercentage = (confidence: number | string) => {
    if (typeof confidence === 'number') {
      return Math.round(confidence);
    }
    switch (confidence) {
      case 'high': return 90;
      case 'medium': return 60;
      case 'low': return 30;
      default: return 0;
    }
  };

  // New helper functions for enhanced suggestions
  const getConfidenceColor = (confidence: number | string) => {
    const percentage = getConfidencePercentage(confidence);
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceText = (confidence: number | string) => {
    const percentage = getConfidencePercentage(confidence);
    if (percentage >= 80) return 'High Confidence';
    if (percentage >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const getReportingPreviewText = (preview: any) => {
    if (!preview) return null;
    
    const sections = [];
    if (preview.balanceSheet) {
      sections.push(`${preview.balanceSheet.section} → ${preview.balanceSheet.subsection}`);
    }
    if (preview.incomeStatement) {
      sections.push(`${preview.incomeStatement.section} → ${preview.incomeStatement.subsection}`);
    }
    if (preview.cashFlow) {
      sections.push(`${preview.cashFlow.section} → ${preview.cashFlow.category}`);
    }
    
    return sections.join(', ');
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
              <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    duplicateError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {isLoadingSuggestion && (
                  <div className="absolute right-3 top-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              
              {/* Duplicate Error */}
              {duplicateError && (
                <div className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded">
                  ⚠️ {duplicateError}
                </div>
              )}
              
              {/* Live Suggestion */}
              {liveSuggestion && !duplicateError && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-900">Smart Suggestion</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(liveSuggestion.confidenceScore || liveSuggestion.confidence)}`}>
                          {getConfidenceText(liveSuggestion.confidenceScore || liveSuggestion.confidence)} 
                          {liveSuggestion.confidenceScore && ` (${liveSuggestion.confidenceScore}%)`}
                        </span>
                        {(liveSuggestion.confidenceScore || 0) >= 80 && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Auto-applied
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-blue-800 mb-2">
                        <div><strong>Type:</strong> {formatEnumLabel(liveSuggestion.type)}</div>
                        <div><strong>Category:</strong> {liveSuggestion.category}</div>
                        <div><strong>Financial Category:</strong> {formatEnumLabel(liveSuggestion.financialCategory)}</div>
                      </div>
                      
                      {liveSuggestion.explanation && (
                        <div className="text-xs text-blue-700 mb-2">
                          💡 {liveSuggestion.explanation}
                        </div>
                      )}
                      
                      {liveSuggestion.reportingPreview && (
                        <div className="text-xs text-blue-700">
                          📊 <strong>Reports:</strong> {getReportingPreviewText(liveSuggestion.reportingPreview)}
                        </div>
                      )}
                    </div>
                    
                    {(liveSuggestion.confidenceScore || 0) < 80 && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            type: liveSuggestion.type,
                            category: liveSuggestion.category,
                            subcategory: liveSuggestion.subcategory,
                            financialCategory: liveSuggestion.financialCategory,
                            financialSubcategory: liveSuggestion.financialSubcategory
                          }));
                          setLiveSuggestion(null);
                          toast.success('Suggestion applied!');
                        }}
                        className="ml-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type *
                <span className="ml-1 text-gray-500" title="ASSET: Things you own (cash, equipment, receivables) | LIABILITY: Things you owe (loans, payables) | EQUITY: Owner's stake in the business | INCOME: Revenue from business activities | EXPENSE: Costs of doing business">
                  ⓘ
                </span>
              </label>
              <div className="relative">
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
                {suggestedFields.includes("type") && (
                  <span className="absolute top-0 right-0 mt-1 mr-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    Auto-applied
                  </span>
                )}
              </div>
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
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the starting balance for this account. This represents existing funds, obligations, or accumulated amounts.
            </p>
            
            {/* Balance Warning */}
            {balanceWarning && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">{balanceWarning}</p>
                  </div>
                </div>
              </div>
            )}
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
                      {getConfidenceText(suggestionConfidence)} ({getConfidencePercentage(suggestionConfidence)}%)
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
                    Financial Category *
                    <span className="ml-1 text-gray-500" title="CURRENT_ASSET: Cash and items that will be converted to cash within a year | FIXED_ASSET: Long-term assets like equipment and buildings | CURRENT_LIABILITY: Debts due within a year | LONG_TERM_LIABILITY: Debts due beyond a year | OPERATING_REVENUE: Income from main business activities | OPERATING_EXPENSE: Costs of running the business">
                      ⓘ
                    </span>
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
                      <span className="absolute top-0 right-0 mt-1 mr-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                        Auto-applied
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Determines how this account appears in financial reports.</p>
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