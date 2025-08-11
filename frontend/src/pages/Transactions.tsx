// Modernized Transactions Page with improved UX and SmartSuggestions
import { useState, useEffect, useRef } from 'react';
import { 
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSuggestedAccount,
  getSuggestedCategory,
  getSuggestedTransactionType,
  getDualSideSuggestion,
  saveSuggestionFeedback,
  clearSuggestionCache,
  JournalEntryFields,
  BalanceWarning,
  TransactionResponse,
} from '../services/TransactionService';
import { fetchAccountsWithConsistentBalances } from '../services/AccountService';
import { Account, AccountType, FinancialCategory } from '../types/account';
import { Transaction } from '../types/transaction';
import { TransactionList } from '../components/transactions/TransactionList';
import { JournalEntryFields as JournalEntryFieldsComponent } from '../components/transactions/JournalEntryFields';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Resolver } from 'react-hook-form';
import {
  fetchRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from "../services/RecurringTransactionService";
import { TransactionTemplateSelector } from '../components/transactions/TransactionTemplateSelector';
import { TransactionTemplate } from '../types/transaction';
import { formatRecurrencePattern } from '../utils/formatUtils';
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Calendar,
  Repeat,
  FileText,
  Building2,
  Users,
  Car,
  ShoppingCart,
  Home,
  Briefcase,
  Heart,
  GraduationCap,
  Plane,
  Utensils,
  Wifi,
  Zap
} from 'lucide-react';

interface TransactionForm {
  date: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER" | "ADJUSTMENT" | "LOAN_PAYMENT" | "ASSET_PURCHASE" | "LIABILITY_SETTLEMENT" | "EQUITY_CONTRIBUTION" | "EQUITY_WITHDRAWAL" | "CLOSING_ENTRY";
  description: string;
  category: string;
  amount: number;
  entries: {
    accountId: string;
    amount: string;
    type: "DEBIT" | "CREDIT";
  }[];
  isRecurring: boolean;
  recurrencePattern: "DAILY" | "WEEKLY" | "MONTHLY";
  nextRun: string;
  endDate?: string;
}

// Transaction Type Cards Component
const TransactionTypeCards: React.FC<{
  selectedType: string;
  onTypeSelect: (type: string) => void;
}> = ({ selectedType, onTypeSelect }) => {
  const [showAdvancedTypes, setShowAdvancedTypes] = useState(false);
  
  const mainTransactionTypes = [
    {
      value: 'EXPENSE',
      label: 'Expense',
      icon: TrendingDown,
      color: 'bg-red-500',
      description: 'Money going out'
    },
    {
      value: 'INCOME',
      label: 'Income',
      icon: TrendingUp,
      color: 'bg-green-500',
      description: 'Money coming in'
    },
    {
      value: 'TRANSFER',
      label: 'Transfer',
      icon: ArrowRightLeft,
      color: 'bg-blue-500',
      description: 'Move between accounts'
    },
    {
      value: 'EQUITY_CONTRIBUTION',
      label: 'Contribution',
      icon: Building2,
      color: 'bg-purple-500',
      description: 'Owner investment'
    }
  ];

  const advancedTransactionTypes = [
    {
      value: 'ADJUSTMENT',
      label: 'Adjustment',
      icon: Settings,
      color: 'bg-gray-500',
      description: 'Balance adjustments'
    },
    {
      value: 'LOAN_PAYMENT',
      label: 'Loan Payment',
      icon: FileText,
      color: 'bg-orange-500',
      description: 'Loan principal/interest'
    },
    {
      value: 'ASSET_PURCHASE',
      label: 'Asset Purchase',
      icon: Car,
      color: 'bg-indigo-500',
      description: 'Buy equipment/assets'
    },
    {
      value: 'LIABILITY_SETTLEMENT',
      label: 'Liability Settlement',
      icon: AlertCircle,
      color: 'bg-yellow-500',
      description: 'Settle debts'
    },
    {
      value: 'EQUITY_WITHDRAWAL',
      label: 'Equity Withdrawal',
      icon: Users,
      color: 'bg-pink-500',
      description: 'Owner withdrawals'
    },
    {
      value: 'CLOSING_ENTRY',
      label: 'Closing Entry',
      icon: RefreshCw,
      color: 'bg-teal-500',
      description: 'Period-end entries'
    }
  ];

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">Transaction Type</label>
      
      {/* Main Transaction Types */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {mainTransactionTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onTypeSelect(type.value)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? `${type.color} border-transparent text-white shadow-lg` 
                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <Icon className="w-6 h-6 mb-2" />
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs opacity-75 mt-1">{type.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* More Options Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowAdvancedTypes(!showAdvancedTypes)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {showAdvancedTypes ? 'Hide Advanced Types' : 'Show More Options'}
          <Settings className={`w-4 h-4 ml-2 transition-transform ${showAdvancedTypes ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Advanced Transaction Types */}
      {showAdvancedTypes && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Transaction Types</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {advancedTransactionTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onTypeSelect(type.value)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                    isSelected 
                      ? `${type.color} border-transparent text-white shadow-lg` 
                      : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <Icon className="w-5 h-5 mb-1" />
                    <div className="font-medium text-xs">{type.label}</div>
                    <div className="text-xs opacity-75">{type.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-gray-500 text-center">
            Advanced types are typically used for specialized accounting entries and period-end adjustments.
          </div>
        </div>
      )}
    </div>
  );
};

// Smart Suggestion Card Component
const SmartSuggestionCard: React.FC<{
  suggestion: any;
  onAccept: () => void;
  onReject: () => void;
  onIgnore: () => void;
}> = ({ suggestion, onAccept, onReject, onIgnore }) => {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-900">Smart Suggestion</span>
        </div>
        <button
          type="button"
          onClick={onIgnore}
          className="text-blue-500 hover:text-blue-700 transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="text-sm text-blue-800">
          <span className="font-medium">Account:</span> {suggestion.suggestedAccountName}
        </div>
        <div className="text-sm text-blue-700">
          <span className="font-medium">Reason:</span> {suggestion.reason}
        </div>
        {suggestion.confidence && (
          <div className="text-sm text-blue-600">
            <span className="font-medium">Confidence:</span> {suggestion.confidence}%
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onAccept}
          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Accept
        </button>
        <button
          type="button"
          onClick={onReject}
          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
        >
          <XCircle className="w-4 h-4 mr-1" />
          Reject
        </button>
      </div>
    </div>
  );
};

const DualSideSuggestionCard: React.FC<{
  suggestion: {
    debitSide: {
      suggestedAccountId: number;
      suggestedAccountName: string;
      reason: string;
      accountType: string;
      confidence: number;
    } | null;
    creditSide: {
      suggestedAccountId: number;
      suggestedAccountName: string;
      reason: string;
      accountType: string;
      confidence: number;
    } | null;
    overallConfidence: number;
    transactionType: string;
    rationale: string;
  };
  onAccept: () => void;
  onReject: () => void;
  onIgnore: () => void;
}> = ({ suggestion, onAccept, onReject, onIgnore }) => {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-900">Complete Transaction Suggestion</span>
        </div>
        <button
          type="button"
          onClick={onIgnore}
          className="text-green-500 hover:text-green-700 transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
      
      <div className="mb-3">
        <div className="text-sm text-green-800 font-medium mb-2">
          {suggestion.rationale}
        </div>
        <div className="text-xs text-green-600">
          Overall Confidence: {suggestion.overallConfidence}%
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Debit Side */}
        <div className="bg-white p-3 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-700">Debit</span>
          </div>
          {suggestion.debitSide ? (
            <>
              <div className="text-sm font-medium text-gray-900 mb-1">
                {suggestion.debitSide.suggestedAccountName}
              </div>
              <div className="text-xs text-gray-600 mb-1">
                {suggestion.debitSide.reason}
              </div>
              <div className="text-xs text-gray-500">
                Confidence: {suggestion.debitSide.confidence}%
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 italic">No debit suggestion</div>
          )}
        </div>
        
        {/* Credit Side */}
        <div className="bg-white p-3 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-700">Credit</span>
          </div>
          {suggestion.creditSide ? (
            <>
              <div className="text-sm font-medium text-gray-900 mb-1">
                {suggestion.creditSide.suggestedAccountName}
              </div>
              <div className="text-xs text-gray-600 mb-1">
                {suggestion.creditSide.reason}
              </div>
              <div className="text-xs text-gray-500">
                Confidence: {suggestion.creditSide.confidence}%
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 italic">No credit suggestion</div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAccept}
          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Accept Both
        </button>
        <button
          type="button"
          onClick={onReject}
          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
        >
          <XCircle className="w-4 h-4 mr-1" />
          Reject
        </button>
      </div>
    </div>
  );
};

// Enhanced Form Field Component
const FormField: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, error, children }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editingRecurringId, setEditingRecurringId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [warnings, setWarnings] = useState<BalanceWarning[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState<any>(null);
  const [currentDualSuggestion, setCurrentDualSuggestion] = useState<any>(null);
  const [currentCategorySuggestion, setCurrentCategorySuggestion] = useState<any>(null);
  const [suggestionAccepted, setSuggestionAccepted] = useState<boolean>(false);
  const [suggestionRejected, setSuggestionRejected] = useState<boolean>(false);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<TransactionForm | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | null>(null);
  const [smartSuggestionsEnabled, setSmartSuggestionsEnabled] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  
  const descriptionChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Comprehensive list of predefined categories based on seed data
  const predefinedCategories = [
    // Operating Revenue
    'Sales Revenue', 'Service Income', 'Consulting Income', 'Product Sales',
    
    // Non-Operating Revenue  
    'Interest Income', 'Affiliate Income', 'Miscellaneous Income', 'Refund Income',
    
    // Operating Expenses
    'Cost of Goods Sold', 'Supplies Expense', 'Software Subscriptions', 'Rent Expense',
    'Utilities Expense', 'Payroll Expense', 'Payroll Taxes', 'Marketing Expense',
    'Insurance Expense', 'Professional Services', 'Technology Expense', 'Travel Expense',
    'Meals & Entertainment', 'Postage & Delivery', 'Bank Fees', 'Depreciation Expense',
    
    // Non-Operating Expenses
    'Interest Expense', 'Income Taxes', 'Charitable Contributions', 'Other Operating Expenses',
    
    // Asset Categories
    'Cash & Bank', 'Accounts Receivable', 'Inventory', 'Prepaid Expenses',
    'Equipment', 'Fixed Assets', 'Security Deposits',
    
    // Liability Categories
    'Accounts Payable', 'Loans & Credit', 'Credit Cards', 'Mortgages',
    
    // Equity Categories
    'Owner Investment', 'Owner Withdrawals', 'Retained Earnings',
    
    // Common Business Categories
    'Office Supplies', 'Advertising', 'Legal & Accounting', 'Maintenance',
    'Transportation', 'Food & Dining', 'Groceries', 'Restaurants',
    'Coffee & Snacks', 'Healthcare', 'Education', 'Entertainment',
    'Gifts', 'Donations', 'Taxes', 'Fees', 'Commissions',
    
    // Industry-Specific Categories
    'Manufacturing', 'Retail', 'Services', 'Technology', 'Healthcare',
    'Construction', 'Real Estate', 'Finance', 'Education', 'Hospitality'
  ];

  // Filter categories based on search term
  const filteredCategories = predefinedCategories.filter(category =>
    category.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setValue("category", category);
    setCategorySearchTerm(category);
    setShowCategoryDropdown(false);
    
    // Add to recent categories
    setRecentCategories(prev => {
      const filtered = prev.filter(c => c !== category);
      return [category, ...filtered].slice(0, 5); // Keep only 5 most recent
    });
  };

  // Handle category input change
  const handleCategoryInputChange = (value: string) => {
    setValue("category", value);
    setCategorySearchTerm(value);
    setShowCategoryDropdown(true);
  };

  // Handle keyboard navigation for category dropdown
  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowCategoryDropdown(false);
    } else if (e.key === 'Enter' && filteredCategories.length > 0) {
      handleCategorySelect(filteredCategories[0]);
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    trigger,
    formState: { errors },
  } = useForm<TransactionForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: "TRANSFER",
      description: "",
      category: "",
      amount: 0,
      entries: [
        { accountId: "", amount: "", type: "DEBIT" },
        { accountId: "", amount: "", type: "CREDIT" }
      ],
      isRecurring: false,
      recurrencePattern: "MONTHLY",
      nextRun: new Date().toISOString().split('T')[0]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "entries"
  });

  // Simplified resolver for form validation
  const resolver: Resolver<TransactionForm> = async (values) => {
    const errors: any = {};

    if (!values.date) {
      errors.date = { type: 'required', message: 'Date is required' };
    }

    if (!values.description || values.description.trim() === '') {
      errors.description = { type: 'required', message: 'Description is required' };
    }

    // Validate entries
    if (!values.entries || values.entries.length < 2) {
      errors.entries = { type: 'required', message: 'At least two entries are required' };
    } else {
      const entryErrors: any[] = [];
      let totalDebits = 0;
      let totalCredits = 0;

      values.entries.forEach((entry, index) => {
        const entryError: any = {};

        if (!entry.accountId) {
          entryError.accountId = { type: 'required', message: 'Account is required' };
        }

        if (!entry.amount || parseFloat(entry.amount) <= 0) {
          entryError.amount = { type: 'required', message: 'Amount must be greater than 0' };
        } else {
          const amount = parseFloat(entry.amount);
          if (entry.type === 'DEBIT') {
            totalDebits += amount;
          } else {
            totalCredits += amount;
          }
        }

        if (Object.keys(entryError).length > 0) {
          entryErrors[index] = entryError;
        }
      });

      if (entryErrors.length > 0) {
        errors.entries = entryErrors;
      } else if (Math.abs(totalDebits - totalCredits) > 0.01) {
        errors.entries = { type: 'custom', message: 'Total debits must equal total credits' };
      }
    }

    return {
      values,
      errors: Object.keys(errors).length > 0 ? errors : {}
    };
  };

  // Simplified suggestion feedback for keyword/rule-based system
  const sendSuggestionFeedback = async (feedbackType: 'ACCEPTED' | 'REJECTED' | 'IGNORED', selectedAccountId?: number, selectedAccountName?: string, rejectionReason?: string) => {
    try {
      await saveSuggestionFeedback({
        userId: 1, // TODO: Get from auth context
        description: watch('description'),
        suggestedAccountId: currentSuggestion?.suggestedAccountId || 0,
        suggestedAccountName: currentSuggestion?.suggestedAccountName || '',
        confidence: currentSuggestion?.confidence || 0,
        feedbackType,
        selectedAccountId,
        selectedAccountName,
        rejectionReason,
        suggestionMetadata: { accountType: currentSuggestion?.accountType, confidence: currentSuggestion?.confidence },
        contextData: { timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Failed to send suggestion feedback:', error);
    }
  };

  // Simplified description change handler
  const handleDescriptionChange = async (desc: string) => {
    console.log('🔍 handleDescriptionChange called with:', desc);
    
    if (descriptionChangeTimeoutRef.current) {
      clearTimeout(descriptionChangeTimeoutRef.current);
    }

    // Set new timeout for debounced API call
    descriptionChangeTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('🔄 Starting suggestion process for:', desc);
        
        // Try dual-side suggestion first
        console.log('🔍 Calling getDualSideSuggestion...');
        const dualSuggestion = await getDualSideSuggestion(desc);
        console.log('📊 Dual-side suggestion result:', dualSuggestion);
        
        if (dualSuggestion && dualSuggestion.overallConfidence >= 60) {
          console.log('✅ Using dual-side suggestion with confidence:', dualSuggestion.overallConfidence);
          setCurrentDualSuggestion(dualSuggestion);
          setCurrentSuggestion(null); // Clear single suggestion
          
          // Apply dual-side suggestion to form
          const currentEntries = watch('entries');
          const updatedEntries = [...currentEntries];
          
          if (dualSuggestion.debitSide) {
            updatedEntries[0] = {
              ...updatedEntries[0],
              accountId: String(dualSuggestion.debitSide.suggestedAccountId),
              amount: currentEntries[1]?.amount || "0"
            };
          }
          
          if (dualSuggestion.creditSide) {
            updatedEntries[1] = {
              ...updatedEntries[1],
              accountId: String(dualSuggestion.creditSide.suggestedAccountId),
              amount: currentEntries[0]?.amount || "0"
            };
          }
          
          setValue('entries', updatedEntries);
          setValue('type', dualSuggestion.transactionType as any);
          
          console.log('✅ Applied dual-side suggestion:', dualSuggestion);
          return;
        } else {
          console.log('❌ Dual-side suggestion failed or low confidence:', dualSuggestion);
        }

        // Fall back to single-side suggestions if dual-side confidence is too low
        console.log('🔄 Falling back to single-side suggestions...');
        const accountSuggestion = await getSuggestedAccount(desc);
        const transactionTypeSuggestion = await getSuggestedTransactionType(desc);
        const categorySuggestion = await getSuggestedCategory(desc);

        console.log('📊 Single-side suggestions:', {
          account: accountSuggestion,
          transactionType: transactionTypeSuggestion,
          category: categorySuggestion
        });

        if (accountSuggestion) {
          setCurrentSuggestion(accountSuggestion);
          setCurrentDualSuggestion(null); // Clear dual suggestion
          
          // Apply suggestion to form
          const currentEntries = watch('entries');
          const updatedEntries = [...currentEntries];
          
          if (accountSuggestion.suggestedEntryType === 'DEBIT') {
            updatedEntries[0] = {
              ...updatedEntries[0],
              accountId: String(accountSuggestion.suggestedAccountId),
              amount: currentEntries[1]?.amount || "0"
            };
          } else {
            updatedEntries[1] = {
              ...updatedEntries[1],
              accountId: String(accountSuggestion.suggestedAccountId),
              amount: currentEntries[0]?.amount || "0"
            };
          }
          
          setValue('entries', updatedEntries);
        }

        if (transactionTypeSuggestion) {
          setValue('type', transactionTypeSuggestion.suggestedType as any);
        }

        if (categorySuggestion) {
          console.log('✅ Applying category suggestion:', categorySuggestion);
          console.log('📝 Current category field value before update:', watch('category'));
          setValue('category', categorySuggestion.suggestedCategory);
          setCurrentCategorySuggestion(categorySuggestion);
          console.log('✅ Category field updated to:', categorySuggestion.suggestedCategory);
          console.log('📝 Current category field value after update:', watch('category'));
          
          // Force a re-render by triggering form validation
          trigger('category');
        } else {
          console.log('❌ No category suggestion found');
          setCurrentCategorySuggestion(null);
        }
      } catch (error) {
        console.error('❌ Error getting suggestions:', error);
      }
    }, 500);
  };

  // Simplified form reset
  const handleResetForm = () => {
    reset({
      date: new Date().toISOString().split('T')[0],
      type: "TRANSFER",
      description: "",
      category: "",
      amount: 0,
      entries: [
        { accountId: "", amount: "", type: "DEBIT" },
        { accountId: "", amount: "", type: "CREDIT" }
      ],
      isRecurring: false,
      recurrencePattern: "MONTHLY",
      nextRun: new Date().toISOString().split('T')[0]
    });
    setFormKey(prev => prev + 1);
    setEditingTransactionId(null);
    setEditingRecurringId(null);
    setError(null);
    setSuccessMessage(null);
    setWarnings([]);
    setCurrentSuggestion(null);
    setCurrentDualSuggestion(null);
    setCurrentCategorySuggestion(null);
    setSuggestionAccepted(false);
    setSuggestionRejected(false);
    setCategorySearchTerm('');
    setShowCategoryDropdown(false);
    // Note: We preserve recentCategories to maintain user experience
  };

  // Simplified form submission
  const handleFormSubmission = async (data: TransactionForm) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Check for balance warnings
      const warnings = checkBalanceWarnings(data);
      if (warnings.length > 0) {
        setWarnings(warnings);
        setPendingTransaction(data);
        setShowBalanceWarning(true);
        setIsSubmitting(false);
        return;
      }

      await submitTransaction(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simplified balance warning check
  const checkBalanceWarnings = (data: TransactionForm): BalanceWarning[] => {
    const warnings: BalanceWarning[] = [];
    // Simplified warning logic - you can expand this
    return warnings;
  };

  // Simplified transaction submission
  const submitTransaction = async (data: TransactionForm) => {
    // Convert form data to backend format
    const backendData = {
      description: data.description,
      date: data.date,
      type: data.type,
      category: data.category,
      amount: data.amount,
      entries: data.entries.map(entry => ({
        accountId: parseInt(entry.accountId),
        amount: parseFloat(entry.amount),
        type: entry.type,
        description: data.description
      }))
    };

    if (editingTransactionId) {
      await updateTransaction(editingTransactionId, backendData);
      setSuccessMessage('Transaction updated successfully');
    } else {
      await createTransaction(backendData);
      setSuccessMessage('Transaction created successfully');
    }

    handleResetForm();
    fetchData();
  };

  // Simplified data fetching
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [transactionsData, accountsData, recurringData] = await Promise.all([
        fetchTransactions(),
        fetchAccountsWithConsistentBalances(),
        fetchRecurringTransactions()
      ]);
      
      setTransactions(transactionsData.transactions || transactionsData);
      setAccounts(accountsData);
      setRecurringTransactions(recurringData);
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Template handlers
  const handleTemplateSelect = (template: TransactionTemplate) => {
    setSelectedTemplate(template);
    // Apply template data to form
    setValue('description', template.description);
    setValue('type', template.type as any);
    // Note: category and entries may not exist on TransactionTemplate
  };

  const handleTemplateClear = () => {
    setSelectedTemplate(null);
  };

  // Edit transaction handler
  const handleEditTransaction = (transaction: Transaction) => {
    reset({
      date: transaction.date,
      type: transaction.type,
      description: transaction.description,
      category: transaction.category || "",
      amount: transaction.amount || 0,
      entries: transaction.entries?.map(entry => ({
        accountId: entry.account.id.toString(),
        amount: entry.amount.toString(),
        type: entry.type
      })) || [
        { accountId: "", amount: "", type: "DEBIT" },
        { accountId: "", amount: "", type: "CREDIT" }
      ],
      isRecurring: false,
      recurrencePattern: "MONTHLY",
      nextRun: new Date().toISOString().split('T')[0]
    });
    setEditingTransactionId(transaction.id);
    setEditingRecurringId(null);
  };

  // Delete transaction handler
  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      setSuccessMessage("Transaction deleted successfully!");
      fetchData();
    } catch (error) {
      setError("Failed to delete transaction");
    }
  };

  // Edit recurring transaction handler
  const handleEditRecurringTransaction = (recurring: any) => {
    reset({
      date: new Date(recurring.nextRun).toISOString().split('T')[0],
      type: recurring.amount > 0 ? "INCOME" : "EXPENSE",
      description: recurring.description,
      category: recurring.category || "",
      amount: Math.abs(recurring.amount),
      entries: [
        { 
          accountId: recurring.primaryAccount?.id?.toString() || "", 
          amount: Math.abs(recurring.amount).toString(), 
          type: recurring.primaryEntryType || "DEBIT"
        },
        { 
          accountId: recurring.secondaryAccount?.id?.toString() || "", 
          amount: Math.abs(recurring.amount).toString(), 
          type: recurring.secondaryEntryType || "CREDIT"
        }
      ],
      isRecurring: true,
      recurrencePattern: recurring.recurrencePattern,
      nextRun: new Date(recurring.nextRun).toISOString().split('T')[0],
      endDate: recurring.endDate ? new Date(recurring.endDate).toISOString().split('T')[0] : undefined
    });
    setEditingRecurringId(recurring.id);
    setEditingTransactionId(null);
  };

  // Delete recurring transaction handler
  const handleDeleteRecurringTransaction = async (id: number) => {
    try {
      await deleteRecurringTransaction(id);
      setSuccessMessage("Recurring transaction deleted successfully!");
      fetchData();
    } catch (error) {
      setError("Failed to delete recurring transaction");
    }
  };

  // Effect to fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Effect to handle smart suggestions toggle
  useEffect(() => {
    if (!smartSuggestionsEnabled) {
      setCurrentSuggestion(null);
      setSuggestionAccepted(false);
      setSuggestionRejected(false);
    }
  }, [smartSuggestionsEnabled]);

  // Effect to handle clicking outside category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  // Effect to load recent categories from existing transactions
  useEffect(() => {
    if (transactions.length > 0) {
      const categories = transactions
        .map(t => t.category)
        .filter(Boolean)
        .filter((category, index, arr) => arr.indexOf(category) === index) // Remove duplicates
        .slice(0, 5);
      
      setRecentCategories(categories);
    }
  }, [transactions]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (descriptionChangeTimeoutRef.current) {
        clearTimeout(descriptionChangeTimeoutRef.current);
      }
    };
  }, []);

  const usableAccounts = accounts.filter(account => account.type !== 'CLOSING_ENTRY' as any);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
          <p className="text-gray-600">Record your business transactions with smart suggestions</p>
        </div>

        {/* Alerts */}
        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div role="alert" className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Balance Warnings */}
        {warnings.length > 0 && (
          <div role="alert" className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-medium text-yellow-800">Balance Warnings</span>
            </div>
            <ul className="space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="text-sm text-yellow-700">
                  • {warning.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Form */}
        <form key={formKey} onSubmit={handleSubmit(handleFormSubmission)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          
          {/* Template Selector */}
          <TransactionTemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            onTemplateClear={handleTemplateClear}
            accounts={usableAccounts}
            onEntriesUpdate={(entries) => setValue('entries', entries)}
            onTransactionTypeUpdate={(type) => setValue('type', type as any)}
          />

          {/* Description Field */}
          <FormField label="Description" required error={errors.description?.message}>
            <input
              type="text"
              value={watch("description") || ""}
              onChange={(e) => {
                setValue("description", e.target.value);
                handleDescriptionChange(e.target.value);
              }}
              placeholder="Enter transaction description to enable smart suggestions..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg"
            />
          </FormField>

          {/* Transaction Type Cards */}
          <TransactionTypeCards
            selectedType={watch("type") || "TRANSFER"}
            onTypeSelect={(type) => setValue('type', type as any)}
          />

          {/* Dual-Side Smart Suggestions */}
          {smartSuggestionsEnabled && currentDualSuggestion && !suggestionAccepted && !suggestionRejected && (
            <DualSideSuggestionCard
              suggestion={currentDualSuggestion}
              onAccept={async () => {
                setSuggestionAccepted(true);
                setSuggestionRejected(false);
                // Simple feedback for keyword/rule-based system
                await sendSuggestionFeedback('ACCEPTED');
              }}
              onReject={async () => {
                setSuggestionRejected(true);
                setSuggestionAccepted(false);
                await sendSuggestionFeedback('REJECTED');
                reset({
                  ...watch(),
                  entries: [
                    { accountId: "", amount: "", type: "DEBIT" },
                    { accountId: "", amount: "", type: "CREDIT" }
                  ]
                });
              }}
              onIgnore={async () => {
                await sendSuggestionFeedback('IGNORED');
                setCurrentDualSuggestion(null);
                setSuggestionAccepted(false);
                setSuggestionRejected(false);
              }}
            />
          )}

          {/* Single-Side Smart Suggestions */}
          {smartSuggestionsEnabled && currentSuggestion && !currentDualSuggestion && !suggestionAccepted && !suggestionRejected && (
            <SmartSuggestionCard
              suggestion={currentSuggestion}
              onAccept={async () => {
                setSuggestionAccepted(true);
                setSuggestionRejected(false);
                await sendSuggestionFeedback('ACCEPTED', 
                  currentSuggestion?.suggestedAccountId,
                  currentSuggestion?.suggestedAccountName
                );
              }}
              onReject={async () => {
                setSuggestionRejected(true);
                setSuggestionAccepted(false);
                await sendSuggestionFeedback('REJECTED');
                reset({
                  ...watch(),
                  entries: [
                    { accountId: "", amount: "", type: "DEBIT" },
                    { accountId: "", amount: "", type: "CREDIT" }
                  ]
                });
              }}
              onIgnore={async () => {
                await sendSuggestionFeedback('IGNORED');
                setCurrentSuggestion(null);
                setSuggestionAccepted(false);
                setSuggestionRejected(false);
              }}
            />
          )}

          {/* Category Suggestion */}
          {smartSuggestionsEnabled && currentCategorySuggestion && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">📂</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Category Suggestion</h3>
                    <p className="text-sm text-blue-700">
                      Suggested: <span className="font-semibold">{currentCategorySuggestion.suggestedCategory}</span>
                      <span className="ml-2 text-xs">({currentCategorySuggestion.confidence}% confidence)</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">{currentCategorySuggestion.reason}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setCurrentCategorySuggestion(null)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('category', '');
                      setCurrentCategorySuggestion(null);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Accepted Message */}
          {suggestionAccepted && smartSuggestionsEnabled && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Suggestion accepted. Thanks!</span>
              </div>
            </div>
          )}

          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormField label="Date" required error={errors.date?.message}>
              <input
                type="date"
                {...register("date")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </FormField>
            
            <FormField label="Category" error={errors.category?.message}>
              <div className="relative">
                <div className="category-dropdown-container relative">
                  <div className="relative">
                    <input
                      type="text"
                      {...register("category")}
                      value={watch("category") || ""}
                      onChange={(e) => {
                        handleCategoryInputChange(e.target.value);
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      onKeyDown={handleCategoryKeyDown}
                      placeholder="Search or type a category..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all pr-10"
                    />
                    
                    {/* Dropdown indicator */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className={`w-5 h-5 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                                      {/* Visual indicator when category is suggested */}
                    {watch("category") && currentCategorySuggestion && (
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">Suggested</span>
                        </div>
                      </div>
                    )}
                </div>

                {/* Category Dropdown */}
                {showCategoryDropdown && (
                  <div className="category-dropdown-container absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-3 border-b border-gray-100">
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearchTerm}
                        onChange={(e) => setCategorySearchTerm(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        autoFocus
                      />
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto">
                      {/* Recent Categories */}
                      {recentCategories.length > 0 && categorySearchTerm === '' && (
                        <div className="border-b border-gray-200">
                          <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Recent Categories
                          </div>
                          {recentCategories.map((category, index) => (
                            <button
                              key={`recent-${index}`}
                              type="button"
                              onClick={() => handleCategorySelect(category)}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{category}</div>
                              <div className="text-xs text-gray-500 mt-1">🕒 Recently used</div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Predefined Categories */}
                      {filteredCategories.length > 0 ? (
                        <>
                          {recentCategories.length > 0 && categorySearchTerm === '' && (
                            <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-600 uppercase tracking-wide border-b border-gray-200">
                              All Categories
                            </div>
                          )}
                          {filteredCategories.map((category, index) => (
                            <button
                              key={`predefined-${index}`}
                              type="button"
                              onClick={() => handleCategorySelect(category)}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{category}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {category.includes('Revenue') ? '💰 Revenue' : 
                                 category.includes('Expense') ? '💸 Expense' :
                                 category.includes('Asset') ? '🏦 Asset' :
                                 category.includes('Liability') ? '📋 Liability' :
                                 category.includes('Equity') ? '📊 Equity' : '📁 Category'}
                              </div>
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          <div className="mb-2">No predefined categories found.</div>
                          {categorySearchTerm.trim() && (
                            <button
                              type="button"
                              onClick={() => handleCategorySelect(categorySearchTerm)}
                              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Create "{categorySearchTerm}"
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <div className="text-xs text-gray-600">
                        💡 Smart suggestions will auto-fill based on your description.
                        {filteredCategories.length > 0 && (
                          <span className="block mt-1">
                            Showing {filteredCategories.length} of {predefinedCategories.length} categories
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Help text */}
                <div className="mt-1 text-xs text-gray-500">
                  Categories help organize transactions for reporting and analysis. 
                  Choose from predefined categories or type to create custom ones.
                </div>
              </div>
            </FormField>
          </div>

          {/* Smart Suggestions Toggle */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smart-suggestions-toggle"
                  checked={smartSuggestionsEnabled}
                  onChange={(e) => setSmartSuggestionsEnabled(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="smart-suggestions-toggle" className="ml-2 block text-sm text-gray-900">
                  Enable Smart Suggestions
                </label>
              </div>
              <div className="flex items-center gap-2">
                {smartSuggestionsEnabled && (
                  <span className="text-xs text-gray-500">Auto-populates accounts based on description</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    clearSuggestionCache();
                    toast.success('Suggestion cache cleared!');
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  title="Clear suggestion cache"
                >
                  🧹 Clear Cache
                </button>
              </div>
            </div>
          </div>

          {/* Recurring Transaction Toggle */}
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="recurring-toggle"
                {...register("isRecurring")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="recurring-toggle" className="ml-2 block text-sm text-gray-900">
                Recurring Transaction
              </label>
            </div>
          </div>

          {/* Recurring Transaction Fields */}
          {watch("isRecurring") && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Recurring Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recurrence Pattern</label>
                  <select
                    {...register("recurrencePattern")}
                    className="mt-1 block w-full rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Next Run Date</label>
                  <input
                    type="date"
                    {...register("nextRun")}
                    className="mt-1 block w-full rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                  <input
                    type="date"
                    {...register("endDate")}
                    className="mt-1 block w-full rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Journal Entries */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-lg font-medium text-gray-700">Journal Entries</label>
            </div>
            
            <JournalEntryFieldsComponent
              entries={fields}
              accounts={usableAccounts}
              register={register}
              errors={errors}
              onAdd={() => append({ accountId: '', amount: '', type: 'DEBIT' })}
              onRemove={remove}
              transactionDescription={watch('description')}
              isRecurring={watch('isRecurring')}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {editingTransactionId ? 'Update Transaction' : 
                   editingRecurringId ? 'Update Recurring Transaction' : 
                   'Create Transaction'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Transaction List */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="text-gray-500">Loading transactions...</div>
            </div>
            <div className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded" />
            </div>
            <div className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded" />
            </div>
            <div className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        ) : (
          <>
            <TransactionList
              transactions={transactions}
              accounts={accounts}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
            
            {/* Recurring Transactions Section */}
            {Array.isArray(recurringTransactions) && recurringTransactions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-blue-900">Recurring Transactions</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {recurringTransactions.map((recurring) => (
                      <li key={recurring.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-bold text-sm">📅</span>
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">
                                    {recurring.description}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    ${Math.abs(recurring.amount).toFixed(2)}
                                  </p>
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                  <p className="text-sm text-gray-500">
                                    {recurring.primaryAccount?.name} → {recurring.secondaryAccount?.name} • {formatRecurrencePattern(recurring.recurrencePattern)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Next: {new Date(recurring.nextRun).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <button
                              onClick={() => handleEditRecurringTransaction(recurring)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors mr-2"
                              title="Edit recurring transaction"
                            >
                              <span className="text-blue-600 hover:text-blue-800">✏️</span>
                            </button>
                            <button
                              onClick={() => handleDeleteRecurringTransaction(recurring.id)}
                              className="text-gray-600 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete recurring transaction"
                            >
                              <span className="text-gray-600 hover:text-red-600">🗑️</span>
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {/* Balance Warning Confirmation Dialog */}
        {showBalanceWarning && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Negative Balance Warning
                  </h3>
                  <div className="text-sm text-gray-600 mb-4">
                    <p className="mb-2">This transaction will result in negative balances in the following accounts:</p>
                    <ul className="text-left space-y-1">
                      {warnings.map((warning, index) => (
                        <li key={index} className="text-red-600 font-medium">
                          • {warning.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => {
                        setShowBalanceWarning(false);
                        setWarnings([]);
                        setPendingTransaction(null);
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel Transaction
                    </button>
                    <button
                      onClick={async () => {
                        setShowBalanceWarning(false);
                        if (pendingTransaction) {
                          await submitTransaction(pendingTransaction);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Proceed Anyway
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;