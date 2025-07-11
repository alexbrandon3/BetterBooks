import { useState, useEffect } from 'react';
import { 
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSuggestedAccount,
  getSuggestedCategory,
  getSuggestedTransactionType,
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
import { EnhancedTransactionTemplateSelector } from '../components/transactions/EnhancedTransactionTemplateSelector';
import { TransactionTemplate } from '../types/transaction';

interface TransactionForm {
  date: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER" | "ADJUSTMENT" | "LOAN_PAYMENT" | "ASSET_PURCHASE" | "LIABILITY_SETTLEMENT" | "EQUITY_CONTRIBUTION" | "EQUITY_WITHDRAWAL";
  description: string;
  category: string;
  amount: number;
  entries: {
    accountId: string;
    amount: string;
    type: "DEBIT" | "CREDIT";
  }[];
  // Recurring transaction fields
  isRecurring: boolean;
  recurrencePattern: "DAILY" | "WEEKLY" | "MONTHLY";
  nextRun: string;
  endDate?: string;
}

interface BackendTransactionForm {
  description: string;
  date: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER" | "ADJUSTMENT" | "LOAN_PAYMENT" | "ASSET_PURCHASE" | "LIABILITY_SETTLEMENT" | "EQUITY_CONTRIBUTION" | "EQUITY_WITHDRAWAL";
  category: string;
  amount: number;
  entries: {
    accountId: number;
    amount: number;
    type: "DEBIT" | "CREDIT";
    description: string;
  }[];
  // Recurring transaction fields
  isRecurring?: boolean;
  recurrencePattern?: "DAILY" | "WEEKLY" | "MONTHLY";
  nextRun?: string;
  endDate?: string;
}

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<BalanceWarning[]>([]);
  const [suggestionExplanation, setSuggestionExplanation] = useState<string | null>(null);
  const [suggestionConfidence, setSuggestionConfidence] = useState<number | null>(null);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<TransactionForm | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | null>(null);
  const [smartSuggestionsEnabled, setSmartSuggestionsEnabled] = useState(true);

  const resolver: Resolver<TransactionForm> = async (values) => {
    const errors: any = {};
    
    // Balanced debits/credits - check this first and set root error
    if (values.entries && Array.isArray(values.entries) && values.entries.length >= 2) {
      // Only check balance if all entries have valid amounts
      const allEntriesHaveAmounts = values.entries.every(e => 
        e.amount && e.amount !== '' && !isNaN(Number(e.amount)) && Number(e.amount) > 0
      );
      
      if (allEntriesHaveAmounts) {
        let debit = 0, credit = 0;
        values.entries.forEach(e => {
          const amount = Number(e.amount) || 0;
          if (e.type === 'DEBIT') debit += amount;
          if (e.type === 'CREDIT') credit += amount;
        });
        if (debit !== credit) {
          errors.entries = { type: 'validate', message: 'Total debits must equal total credits' };
          // Return early if there's a validation error, don't check other validations
          return { values, errors };
        }
      }
    }
    
    // Date required
    if (!values.date) {
      errors.date = { type: 'required', message: 'Date is required' };
    }
    // Description required
    if (!values.description) {
      errors.description = { type: 'required', message: 'Description is required' };
    }
    // Entries validation
    if (!values.entries || !Array.isArray(values.entries) || values.entries.length < 2) {
      errors.entries = { type: 'min', message: 'At least two entries are required' };
    } else {
      const entryErrors = values.entries.map((entry, idx) => {
        const entryError: any = {};
        if (!entry.accountId) {
          entryError.accountId = { type: 'required', message: 'All entries must have an account' };
        }
        if (!entry.amount || entry.amount === '' || isNaN(Number(entry.amount))) {
          entryError.amount = { type: 'required', message: 'Amount is required' };
        } else if (Number(entry.amount) <= 0) {
          entryError.amount = { type: 'min', message: 'Amount must be positive' };
        }
        if (!entry.type) {
          entryError.type = { type: 'required', message: 'Entry type is required' };
        }
        return Object.keys(entryError).length > 0 ? entryError : undefined;
      });
      
      // Only set entries error if there are actual errors
      const hasEntryErrors = entryErrors.some(error => error !== undefined);
      if (hasEntryErrors) {
        errors.entries = entryErrors;
      }
    }
    return { values, errors };
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: "EXPENSE",
      description: "",
      category: "Uncategorized",
      amount: 0,
      entries: [
        { accountId: "", amount: "", type: "DEBIT" },
        { accountId: "", amount: "", type: "CREDIT" }
      ],
      // Recurring transaction defaults
      isRecurring: false,
      recurrencePattern: "MONTHLY",
      nextRun: new Date().toISOString().split('T')[0],
      endDate: undefined
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "entries"
  });

  // Fallback accounts for tests and empty state
  const fallbackAccounts: Account[] = [
    { 
      id: 1, 
      name: "Checking",
      type: AccountType.ASSET,
      category: "Bank",
      subcategory: "Checking",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "Cash",
      balance: 0,
      userId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 2, 
      name: "Savings",
      type: AccountType.ASSET,
      category: "Bank",
      subcategory: "Savings",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "Cash",
      balance: 0,
      userId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 3, 
      name: "Groceries",
      type: AccountType.EXPENSE,
      category: "Food",
      subcategory: "Groceries",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "Food",
      balance: 0,
      userId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  const fallbackUsed = accounts.length === 0;
  const usableAccounts = accounts.length > 0 ? accounts : fallbackAccounts;

  // Helper function to find the best default account for an entry
  const findDefaultAccountForEntry = (entryType: 'DEBIT' | 'CREDIT', availableAccounts: any[]) => {
    // For DEBIT entries, prefer cash/checking accounts
    if (entryType === 'DEBIT') {
      // First try to find cash accounts
      const cashAccounts = availableAccounts.filter(acc => 
        acc.type === 'ASSET' && 
        (acc.name.toLowerCase().includes('cash') || 
         acc.name.toLowerCase().includes('checking') ||
         acc.name.toLowerCase().includes('bank'))
      );
      if (cashAccounts.length > 0) {
        // Return the one with the highest balance
        return cashAccounts.reduce((highest, current) => 
          (current.balance || 0) > (highest.balance || 0) ? current : highest
        );
      }
      
      // Fallback to any asset account with highest balance
      const assetAccounts = availableAccounts.filter(acc => acc.type === 'ASSET');
      if (assetAccounts.length > 0) {
        return assetAccounts.reduce((highest, current) => 
          (current.balance || 0) > (highest.balance || 0) ? current : highest
        );
      }
    }
    
    // For CREDIT entries, prefer liability/equity accounts
    if (entryType === 'CREDIT') {
      // First try to find liability accounts
      const liabilityAccounts = availableAccounts.filter(acc => acc.type === 'LIABILITY');
      if (liabilityAccounts.length > 0) {
        // Return the one with the highest balance
        return liabilityAccounts.reduce((highest, current) => 
          (current.balance || 0) > (highest.balance || 0) ? current : highest
        );
      }
      
      // Fallback to any equity account
      const equityAccounts = availableAccounts.filter(acc => acc.type === 'EQUITY');
      if (equityAccounts.length > 0) return equityAccounts[0];
    }
    
    return null;
  };

  const handleDescriptionChange = async (desc: string) => {
    if (desc && smartSuggestionsEnabled) {
      try {
        // Get account, category, and transaction type suggestions in parallel
        const [accountSuggestion, categorySuggestion, transactionTypeSuggestion] = await Promise.all([
          getSuggestedAccount ? getSuggestedAccount(desc) : Promise.resolve(null),
          getSuggestedCategory ? getSuggestedCategory(desc) : Promise.resolve(null),
          getSuggestedTransactionType ? getSuggestedTransactionType(desc) : Promise.resolve(null)
        ]);

        // Handle account suggestion
        if (accountSuggestion?.suggestedAccountId) {
          // Get current form values using watch function
          const currentValues = watch();
          
          console.log('🔍 Current form state:', {
            suggestedEntryType: accountSuggestion.suggestedEntryType,
            suggestedAccount: accountSuggestion.suggestedAccountName
          });
          
          // Determine which entry to populate based on suggested entry type
          let targetEntryIndex = 0; // Default to first entry
          
          if (accountSuggestion.suggestedEntryType === 'CREDIT') {
            // For CREDIT suggestions, always use the second entry (index 1)
            targetEntryIndex = 1;
            console.log('✅ Placing CREDIT suggestion in second entry (index 1)');
          } else if (accountSuggestion.suggestedEntryType === 'DEBIT') {
            // For DEBIT suggestions, always use the first entry (index 0)
            targetEntryIndex = 0;
            console.log('✅ Placing DEBIT suggestion in first entry (index 0)');
          } else {
            // Fallback logic
            targetEntryIndex = 0;
            console.log('✅ Placing suggestion in first entry (index 0) - fallback');
          }
          
          // Don't suggest if the account is already in the target entry
          if (fields[targetEntryIndex].accountId === String(accountSuggestion.suggestedAccountId)) {
            console.log('❌ Account already in target entry, not suggesting');
            return;
          }
          
          const updatedEntries = [...fields];
          
          // Clear both entries first when we get a new suggestion, but preserve the IDs
          updatedEntries[0] = { ...updatedEntries[0], accountId: "", amount: "", type: "DEBIT" };
          updatedEntries[1] = { ...updatedEntries[1], accountId: "", amount: "", type: "CREDIT" };
          
          // Place the new suggestion in the correct entry
          updatedEntries[targetEntryIndex].accountId = String(accountSuggestion.suggestedAccountId);
          updatedEntries[targetEntryIndex].type = accountSuggestion.suggestedEntryType;
          
          // Smart default for the other entry
          const otherEntryIndex = targetEntryIndex === 0 ? 1 : 0;
          const defaultAccount = findDefaultAccountForEntry(
            accountSuggestion.suggestedEntryType === 'CREDIT' ? 'DEBIT' : 'CREDIT',
            usableAccounts
          );
          if (defaultAccount) {
            updatedEntries[otherEntryIndex].accountId = String(defaultAccount.id);
            updatedEntries[otherEntryIndex].type = accountSuggestion.suggestedEntryType === 'CREDIT' ? 'DEBIT' : 'CREDIT';
            console.log(`✅ Auto-populated other entry with: ${defaultAccount.name}`);
          }
          
          console.log('📝 Updated entries:', updatedEntries);
          
          // Preserve the description and other form values, and update category if suggested
          const updatedValues = {
            ...currentValues, 
            description: desc, // Preserve the description
            entries: updatedEntries
          };

          // Add category suggestion if available
          if (categorySuggestion?.suggestedCategory) {
            updatedValues.category = categorySuggestion.suggestedCategory;
            console.log('✅ Applied category suggestion:', categorySuggestion.suggestedCategory);
          }

          // Add transaction type suggestion if available
          if (transactionTypeSuggestion?.suggestedType) {
            updatedValues.type = transactionTypeSuggestion.suggestedType as any;
            console.log('✅ Applied transaction type suggestion:', transactionTypeSuggestion.suggestedType);
          }
          
          reset(updatedValues);
          
          // Set suggestion explanation and confidence - keep persistent until user dismissal
          const combinedExplanation = [
            accountSuggestion.detailedReason,
            categorySuggestion?.detailedReason,
            transactionTypeSuggestion?.detailedReason
          ].filter(Boolean).join('\n\n');
          
          setSuggestionExplanation(combinedExplanation);
          setSuggestionConfidence(Math.max(
            accountSuggestion.confidence, 
            categorySuggestion?.confidence || 0,
            transactionTypeSuggestion?.confidence || 0
          ));
        }
      } catch (error) {
        console.error('Failed to get suggestions:', error);
        // Silent failure for minor fetches like smart suggestions
      }
    } else {
      // Clear suggestion when description is empty
      setSuggestionExplanation(null);
      setSuggestionConfidence(null);
    }
  };

  const handleResetForm = () => {
    const resetData: TransactionForm = {
      date: new Date().toISOString().split('T')[0],
      type: "EXPENSE",
      description: "",
      category: "Uncategorized",
      amount: 0,
      entries: [
        { accountId: "", amount: "", type: "DEBIT" },
        { accountId: "", amount: "", type: "CREDIT" }
      ],
      // Reset recurring fields
      isRecurring: false,
      recurrencePattern: "MONTHLY",
      nextRun: new Date().toISOString().split('T')[0],
      endDate: undefined
    };
    reset(resetData);
    setFormKey(prev => prev + 1);
    setEditingTransactionId(null);
    setEditingRecurringId(null);
    setWarnings([]); // Clear warnings when form is reset
    // Clear suggestion explanation when form is reset
    setSuggestionExplanation(null);
    setSuggestionConfidence(null);
  };

  // Function to check for potential negative balances
  const checkBalanceWarnings = (data: TransactionForm): BalanceWarning[] => {
    const warnings: BalanceWarning[] = [];
    
    // Only check if we have valid entries with amounts
    if (!data.entries || data.entries.length < 2) return warnings;
    
    for (const entry of data.entries) {
      if (!entry.accountId || !entry.amount || isNaN(Number(entry.amount))) continue;
      
      const account = accounts.find(acc => acc.id.toString() === entry.accountId);
      if (!account || account.type !== 'ASSET') continue; // Only check asset accounts
      
      const currentBalance = account.balance || 0;
      const entryAmount = Number(entry.amount);
      
      // Calculate balance change based on entry type
      let balanceChange = 0;
      if (entry.type === 'DEBIT') {
        // For ASSET accounts, debit increases balance
        balanceChange = entryAmount;
      } else if (entry.type === 'CREDIT') {
        // For ASSET accounts, credit decreases balance
        balanceChange = -entryAmount;
      }
      
      const newBalance = currentBalance + balanceChange;
      
      // Check for negative balance
      if (newBalance < 0) {
        warnings.push({
          accountId: account.id,
          accountName: account.name,
          currentBalance: currentBalance,
          newBalance: newBalance,
          message: `This transaction will result in a negative balance of $${Math.abs(newBalance).toFixed(2)} in ${account.name}`
        });
      }
    }
    
    return warnings;
  };

  // Function to handle form submission with balance validation
  const handleFormSubmission = async (data: TransactionForm) => {
    // Check for balance warnings
    const balanceWarnings = checkBalanceWarnings(data);
    
    if (balanceWarnings.length > 0) {
      // Show warning dialog
      setWarnings(balanceWarnings);
      setPendingTransaction(data);
      setShowBalanceWarning(true);
      return;
    }
    
    // No warnings, proceed with submission
    await submitTransaction(data);
  };

  // Function to proceed with transaction despite warnings
  const proceedWithTransaction = async () => {
    if (pendingTransaction) {
      setShowBalanceWarning(false);
      setPendingTransaction(null);
      await submitTransaction(pendingTransaction);
    }
  };

  // Function to cancel transaction due to warnings
  const cancelTransaction = () => {
    setShowBalanceWarning(false);
    setPendingTransaction(null);
    setWarnings([]);
  };

  const submitTransaction = async (data: TransactionForm) => {
    setIsSubmitting(true);
    // Don't clear successMessage or error here
    try {
      // Calculate net amount (debits - credits)
      // For INCOME: positive amount (credits > debits)
      // For EXPENSE: positive amount (debits > credits)
      const debitTotal = data.entries
        .filter(entry => entry.type === "DEBIT")
        .reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
      
      const creditTotal = data.entries
        .filter(entry => entry.type === "CREDIT")
        .reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);

      // For INCOME transactions, the amount should be the credit side
      // For EXPENSE transactions, the amount should be the debit side
      const totalAmount = data.type === "INCOME" ? creditTotal : debitTotal;

      console.log('💰 Amount calculation:', {
        debitTotal,
        creditTotal,
        transactionType: data.type,
        calculatedAmount: totalAmount
      });

      // Create backend-compatible transaction data
      const backendTransactionData: BackendTransactionForm = {
        description: data.description,
        date: data.date,
        type: data.type,
        category: data.category || "Uncategorized", // Use form category or default
        amount: totalAmount,
        entries: data.entries.map(entry => ({
          accountId: parseInt(entry.accountId) || 0, // Convert string to number
          amount: parseFloat(entry.amount) || 0, // Convert string to number
          type: entry.type,
          description: data.description // Use main transaction description for all entries
        }))
      };

      console.log('📤 Backend transaction data:', JSON.stringify(backendTransactionData, null, 2));

      if (editingTransactionId) {
        await updateTransaction(editingTransactionId, backendTransactionData);
        setSuccessMessage("Transaction updated successfully!");
        setError(null);
        toast.success("Transaction updated successfully!");
        
        // Don't clear suggestion explanation - let it persist until user dismissal
      } else if (editingRecurringId) {
        // Update recurring transaction
        const recurringData = {
          description: data.description,
          amount: totalAmount,
          recurrencePattern: data.recurrencePattern,
          nextRun: data.nextRun,
          endDate: data.endDate || undefined,
          // For now, use the first account as the main account
          accountId: parseInt(data.entries[0]?.accountId) || 0
        };
        
        console.log('📤 Updating recurring transaction:', JSON.stringify(recurringData, null, 2));
        await updateRecurringTransaction(editingRecurringId, recurringData);
        setSuccessMessage("Recurring transaction updated successfully!");
        toast.success("Recurring transaction updated successfully!");
        setError(null);
        
        // Don't clear suggestion explanation - let it persist until user dismissal
      } else {
        // Check if this is a recurring transaction
        if (data.isRecurring) {
          // Create recurring transaction
          const recurringData = {
            description: data.description,
            amount: totalAmount,
            recurrencePattern: data.recurrencePattern,
            nextRun: data.nextRun,
            endDate: data.endDate || undefined,
            // For now, use the first account as the main account
            accountId: parseInt(data.entries[0]?.accountId) || 0
          };
          
          console.log('📤 Creating recurring transaction:', JSON.stringify(recurringData, null, 2));
          await createRecurringTransaction(recurringData);
          setSuccessMessage("Recurring transaction created successfully!");
          toast.success("Recurring transaction created successfully!");
          
          // Don't clear suggestion explanation - let it persist until user dismissal
        } else {
          // Create regular transaction
          const result: TransactionResponse = await createTransaction(backendTransactionData);
          
          // Check for warnings
          if (result.warnings && result.warnings.length > 0) {
            // Set warnings state for UI display
            setWarnings(result.warnings);
            
            // Show warnings but still consider it a success
            const warningMessages = result.warnings.map(w => w.message).join('\n');
            setSuccessMessage(`Transaction created successfully! ⚠️ Warnings: ${warningMessages}`);
            toast.success("Transaction created successfully!", {
              duration: 5000,
              icon: '⚠️'
            });
            // Also show individual warning toasts
            result.warnings.forEach(warning => {
              toast(warning.message, {
                duration: 4000,
                icon: '⚠️',
                style: {
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #f59e0b'
                }
              });
            });
          } else {
            setWarnings([]); // Clear any previous warnings
            setSuccessMessage("Transaction created successfully!");
            toast.success("Transaction created successfully!");
          }
        }
        setError(null);
        
        // Don't clear suggestion explanation - let it persist until user dismissal
      }
      // Reset form completely after successful submission
      const resetData: TransactionForm = {
              date: new Date().toISOString().split('T')[0],
      type: "EXPENSE",
      description: "",
      category: "",
      amount: 0,
        entries: [
          { accountId: "", amount: "", type: "DEBIT" },
          { accountId: "", amount: "", type: "CREDIT" }
        ],
        // Recurring transaction defaults
        isRecurring: false,
        recurrencePattern: "MONTHLY",
        nextRun: new Date().toISOString().split('T')[0],
        endDate: undefined
      };
      reset(resetData);
      setFormKey(prev => prev + 1); // Force form re-render
      setEditingTransactionId(null);
      setEditingRecurringId(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setError("Failed to save transaction. Please try again.");
      setSuccessMessage(null);
      toast.error("Failed to save transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear success/error on user input
  const handleAnyInput = () => {
    if (successMessage) setSuccessMessage(null);
    if (error) setError(null);
    if (warnings.length > 0) setWarnings([]);
    // Clear suggestion explanation when user makes any changes or disables smart suggestions
    if (suggestionExplanation && !smartSuggestionsEnabled) setSuggestionExplanation(null);
    if (suggestionConfidence && !smartSuggestionsEnabled) setSuggestionConfidence(null);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    // Handle both regular transactions and split transactions
    const entries = transaction.entries || (transaction as any).splits?.map((split: any) => ({
      account: { id: split.accountId || "1" }, // Default account if not provided
      amount: split.amount,
      type: split.type || "DEBIT",
      description: split.description || ""
    })) || [];

    reset({
      date: transaction.date,
      type: transaction.type,
      description: transaction.description,
      category: transaction.category || "Uncategorized",
      amount: transaction.amount || 0,
      entries: entries.map(entry => ({
        accountId: entry.account.id.toString(),
        amount: entry.amount.toString(),
        type: entry.type
      })),
      // Reset recurring fields
      isRecurring: false,
      recurrencePattern: "MONTHLY",
      nextRun: new Date().toISOString().split('T')[0],
      endDate: undefined
    });
    setEditingTransactionId(transaction.id);
    setEditingRecurringId(null);
    // Clear suggestion explanation when editing a transaction
    setSuggestionExplanation(null);
    setSuggestionConfidence(null);
  };

  const handleEditRecurringTransaction = (recurring: any) => {
    // For recurring transactions, we need to create a simple entry structure
    // since they only have one account
    reset({
      date: new Date(recurring.nextRun).toISOString().split('T')[0],
      type: recurring.amount > 0 ? "INCOME" : "EXPENSE",
      description: recurring.description,
      category: recurring.category || "",
      amount: Math.abs(recurring.amount),
      entries: [
        { 
          accountId: recurring.account.id.toString(), 
          amount: Math.abs(recurring.amount).toString(), 
          type: recurring.amount > 0 ? "CREDIT" : "DEBIT" 
        },
        { 
          accountId: "", 
          amount: Math.abs(recurring.amount).toString(), 
          type: recurring.amount > 0 ? "DEBIT" : "CREDIT" 
        }
      ],
      // Set recurring fields
      isRecurring: true,
      recurrencePattern: recurring.recurrencePattern,
      nextRun: new Date(recurring.nextRun).toISOString().split('T')[0],
      endDate: recurring.endDate ? new Date(recurring.endDate).toISOString().split('T')[0] : undefined
    });
    setEditingRecurringId(recurring.id);
    setEditingTransactionId(null);
    // Clear suggestion explanation when editing a recurring transaction
    setSuggestionExplanation(null);
    setSuggestionConfidence(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      setSuccessMessage("Transaction deleted successfully!");
      toast.success("Transaction deleted successfully!");
      fetchData();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      setError("Failed to delete transaction. Please try again.");
      toast.error("Failed to delete transaction. Please try again.");
      setSuccessMessage(null);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [transactionsData, accountsData, recurringData] = await Promise.all([
        fetchTransactions(),
        fetchAccountsWithConsistentBalances(),
        fetchRecurringTransactions().catch(err => {
          console.error('Failed to fetch recurring transactions:', err);
          return []; // Return empty array on error
        })
      ]);
      
      console.log('📊 Fetched data:', {
        transactions: transactionsData,
        accounts: accountsData,
        recurring: recurringData,
        recurringType: typeof recurringData,
        isArray: Array.isArray(recurringData)
      });
      
      // Safety check for transactions data
      if (transactionsData && transactionsData.transactions) {
        setTransactions(transactionsData.transactions);
      } else {
        console.warn('⚠️ No transactions data found, setting empty array');
        setTransactions([]);
      }
      setAccounts(accountsData);
      // Ensure recurringTransactions is always an array
      setRecurringTransactions(Array.isArray(recurringData) ? recurringData : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError("Failed to fetch transactions. Please try again later.");
      toast.error("Failed to fetch transactions. Please try again later.");
      // Ensure recurringTransactions is set to empty array on error
      setRecurringTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecurringTransaction = async (id: number) => {
    try {
      await deleteRecurringTransaction(id);
      setSuccessMessage("Recurring transaction deleted successfully!");
      toast.success("Recurring transaction deleted successfully!");
      fetchData();
    } catch (err) {
      console.error('Failed to delete recurring transaction:', err);
      setError("Failed to delete recurring transaction. Please try again.");
      toast.error("Failed to delete recurring transaction. Please try again.");
      setSuccessMessage(null);
    }
  };

  // Handler to update entries when a template is selected
  const handleTemplateSelect = (template: TransactionTemplate) => {
    setSelectedTemplate(template);
    // Auto-populate entries based on template
    const entries = template.requiredAccounts.map((account: any) => {
      const matchingAccounts = usableAccounts.filter(acc => acc.type.toLowerCase() === account.accountType.toLowerCase());
      return {
        accountId: matchingAccounts.length > 0 ? matchingAccounts[0].id.toString() : '',
        amount: '',
        type: account.entryType,
        description: account.description
      };
    });
    if (template.optionalAccounts) {
      template.optionalAccounts.forEach((account: any) => {
        const matchingAccounts = usableAccounts.filter(acc => acc.type.toLowerCase() === account.accountType.toLowerCase());
        entries.push({
          accountId: matchingAccounts.length > 0 ? matchingAccounts[0].id.toString() : '',
          amount: '',
          type: account.entryType,
          description: account.description
        });
      });
    }
    setValue('entries', entries);
  };

  const handleTemplateClear = () => {
    setSelectedTemplate(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Clear suggestions when smart suggestions are disabled
  useEffect(() => {
    if (!smartSuggestionsEnabled) {
      setSuggestionExplanation(null);
      setSuggestionConfidence(null);
    }
  }, [smartSuggestionsEnabled]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>
      
      {/* Only show one alert at a time: error > successMessage > validation errors */}
      {error ? (
        <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : successMessage ? (
        <div role="alert" className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      ) : Object.keys(errors).length > 0 ? (
        <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {/* If root error (debits/credits), only show that */}
          {errors.entries && errors.entries.message ? (
            <div>{errors.entries.message}</div>
          ) : (
            <>
              {errors.date && <div>Date is required</div>}
              {errors.description && <div>Description is required</div>}
              {errors.entries && typeof errors.entries === 'object' && Array.isArray(errors.entries) && errors.entries.map((entryErr, idx) => (
                entryErr && entryErr.accountId && <div key={`err-accountId-${idx}`}>{`Entry ${idx + 1}: ${entryErr.accountId.message}`}</div>
              ))}
              {errors.entries && typeof errors.entries === 'object' && Array.isArray(errors.entries) && errors.entries.map((entryErr, idx) => (
                entryErr && entryErr.amount && <div key={`err-amount-${idx}`}>{`Entry ${idx + 1}: ${entryErr.amount.message}`}</div>
              ))}
              {errors.entries && typeof errors.entries === 'object' && Array.isArray(errors.entries) && errors.entries.map((entryErr, idx) => (
                entryErr && entryErr.type && <div key={`err-type-${idx}`}>{`Entry ${idx + 1}: ${entryErr.type.message}`}</div>
              ))}
            </>
          )}
        </div>
      ) : null}

      {/* Display balance warnings */}
      {warnings.length > 0 && (
        <div role="alert" className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Balance Warnings</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm">
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form key={formKey} onSubmit={handleSubmit(handleFormSubmission)} className="mb-8" onChange={handleAnyInput} onInput={handleAnyInput}>
        {/* Template Selector */}
                    <EnhancedTransactionTemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateSelect={handleTemplateSelect}
              onTemplateClear={handleTemplateClear}
              accounts={usableAccounts}
              onEntriesUpdate={(entries: any[]) => setValue('entries', entries)}
              onTransactionTypeUpdate={(type: string) => setValue('type', type as any)}
            />
        {/* Description - Most Important Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Description *</label>
          <input
            type="text"
            {...register("description")}
            aria-label="Transaction Description *"
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Enter transaction description to enable smart suggestions..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date *</label>
            <input
              type="date"
              {...register("date")}
              aria-label="Date *"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              {...register("type")}
              id="transaction-type"
              aria-label="Type"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="LOAN_PAYMENT">Loan Payment</option>
              <option value="ASSET_PURCHASE">Asset Purchase</option>
              <option value="LIABILITY_SETTLEMENT">Liability Settlement</option>
              <option value="EQUITY_CONTRIBUTION">Equity Contribution</option>
              <option value="EQUITY_WITHDRAWAL">Equity Withdrawal</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              {...register("category")}
              aria-label="Transaction Category"
              placeholder="e.g., Food, Transportation, Utilities"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Smart Suggestions Toggle */}
        <div className="mb-4">
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
            {smartSuggestionsEnabled && (
              <span className="text-xs text-gray-500">Auto-populates accounts based on description</span>
            )}
          </div>
        </div>

        {/* Smart Suggestion Display */}
        {suggestionExplanation && smartSuggestionsEnabled && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm text-blue-800 font-medium mb-1">
                  Smart Suggestion Applied
                </div>
                <div className="text-sm text-blue-700 mb-1">
                  {suggestionExplanation}
                </div>
                {suggestionConfidence && (
                  <div className="text-xs text-blue-600">
                    Confidence: {suggestionConfidence}%
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSuggestionExplanation(null);
                  setSuggestionConfidence(null);
                }}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Recurring Transaction Toggle */}
        <div className="mb-4">
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
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Recurring Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Recurrence Pattern</label>
                <select
                  {...register("recurrencePattern")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                <input
                  type="date"
                  {...register("endDate")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Entries</label>
          </div>
          
          <JournalEntryFieldsComponent
            entries={fields}
            accounts={usableAccounts}
            register={register}
            errors={errors}
            onAdd={() => append({ accountId: '', amount: '', type: 'DEBIT' })}
            onRemove={remove}
            transactionDescription={watch('description')}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 
              editingTransactionId ? 'Update Transaction' : 
              editingRecurringId ? 'Update Recurring Transaction' : 
              'Create Transaction'}
          </button>
        </div>
      </form>

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
          {console.log('🔍 Debug - transactions state:', transactions, 'type:', typeof transactions, 'isArray:', Array.isArray(transactions))}
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
                                  {recurring.account?.name} • {recurring.recurrencePattern}
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
                            aria-label="Edit recurring transaction"
                          >
                            <span className="text-blue-600 hover:text-blue-800">✏️</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRecurringTransaction(recurring.id)}
                            className="text-gray-600 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete recurring transaction"
                            aria-label="Delete recurring transaction"
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
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
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
                    onClick={cancelTransaction}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel Transaction
                  </button>
                  <button
                    onClick={proceedWithTransaction}
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
  );
};

export default Transactions;