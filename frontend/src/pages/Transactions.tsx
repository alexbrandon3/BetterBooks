import { useState, useEffect, useRef } from 'react';
import { 
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSuggestedAccount,
  getSuggestedCategory,
  getSuggestedTransactionType,
  saveSuggestionFeedback,
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
  // Recurring transaction fields
  isRecurring: boolean;
  recurrencePattern: "DAILY" | "WEEKLY" | "MONTHLY";
  nextRun: string;
  endDate?: string;
}

interface BackendTransactionForm {
  description: string;
  date: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER" | "ADJUSTMENT" | "LOAN_PAYMENT" | "ASSET_PURCHASE" | "LIABILITY_SETTLEMENT" | "EQUITY_CONTRIBUTION" | "EQUITY_WITHDRAWAL" | "CLOSING_ENTRY";
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
  const [suggestionToneMessage, setSuggestionToneMessage] = useState<string | null>(null);
  const [suggestionAccountType, setSuggestionAccountType] = useState<string | null>(null);
  const [suggestionCategory, setSuggestionCategory] = useState<string | null>(null);
  const [suggestionFinancialCategory, setSuggestionFinancialCategory] = useState<string | null>(null);
  const [suggestionEntryType, setSuggestionEntryType] = useState<'DEBIT' | 'CREDIT' | null>(null);
  const [suggestionAccepted, setSuggestionAccepted] = useState<boolean>(false);
  const [suggestionRejected, setSuggestionRejected] = useState<boolean>(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<any>(null);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<TransactionForm | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | null>(null);
  const [smartSuggestionsEnabled, setSmartSuggestionsEnabled] = useState(true);
  
  // Debounce timer for description changes to prevent interference with typing
  const descriptionChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        // Round to 2 decimal places to avoid floating-point precision issues
        debit = Math.round(debit * 100) / 100;
        credit = Math.round(credit * 100) / 100;
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

  const sendSuggestionFeedback = async (feedbackType: 'ACCEPTED' | 'REJECTED' | 'IGNORED', selectedAccountId?: number, selectedAccountName?: string, reason?: string) => {
    if (!currentSuggestion) return;

    try {
      await saveSuggestionFeedback({
        userId: 1, // TODO: Get actual user ID from auth context
        description: watch('description'),
        suggestedAccountId: currentSuggestion.suggestedAccountId,
        suggestedAccountName: currentSuggestion.suggestedAccountName,
        confidence: currentSuggestion.confidence,
        feedbackType,
        selectedAccountId,
        selectedAccountName,
        suggestionMetadata: {
          accountType: currentSuggestion.accountType,
          category: currentSuggestion.category,
          financialCategory: currentSuggestion.financialCategory,
          suggestedEntryType: currentSuggestion.suggestedEntryType,
          toneMessage: currentSuggestion.toneMessage,
          detailedReason: currentSuggestion.detailedReason,
          learningSource: currentSuggestion.learningSource,
          patternData: currentSuggestion.patternData
        },
        contextData: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          sessionId: Math.random().toString(36).substring(7)
        },
        rejectionReason: reason
      });
    } catch (error) {
      console.error('Error sending suggestion feedback:', error);
    }
  };

  const handleDescriptionChange = (desc: string) => {
    
    // Clear any existing timeout
    if (descriptionChangeTimeoutRef.current) {
      clearTimeout(descriptionChangeTimeoutRef.current);
    }
    
    // Only trigger suggestions if we have at least 3 characters and smart suggestions are enabled
    if (desc && desc.trim().length >= 3 && smartSuggestionsEnabled) {
      // Debounce the suggestion API calls to prevent interference with typing
      descriptionChangeTimeoutRef.current = setTimeout(async () => {
        try {
          // Get account, category, and transaction type suggestions in parallel
          const [accountSuggestion, categorySuggestion, transactionTypeSuggestion] = await Promise.all([
            getSuggestedAccount ? getSuggestedAccount(desc) : Promise.resolve(null),
            getSuggestedCategory ? getSuggestedCategory(desc) : Promise.resolve(null),
            getSuggestedTransactionType ? getSuggestedTransactionType(desc) : Promise.resolve(null)
          ]);

          // Handle account suggestion
          if (accountSuggestion?.suggestedAccountId) {
            // Store current suggestion for feedback
            setCurrentSuggestion(accountSuggestion);
            
            // Get current form values using watch function
            const currentValues = watch();
            

            
            // Determine which entry to populate based on suggested entry type
            let targetEntryIndex = 0; // Default to first entry
            
            if (accountSuggestion.suggestedEntryType === 'CREDIT') {
              // For CREDIT suggestions, always use the second entry (index 1)
              targetEntryIndex = 1;
            } else if (accountSuggestion.suggestedEntryType === 'DEBIT') {
              // For DEBIT suggestions, always use the first entry (index 0)
              targetEntryIndex = 0;
            } else {
              // Fallback logic
              targetEntryIndex = 0;
            }
            
            // Don't suggest if the account is already in the target entry
            if (fields[targetEntryIndex].accountId === String(accountSuggestion.suggestedAccountId)) {
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
            }
            
            // Update form values without resetting to prevent interference with typing
            // Only update the specific fields that need to change
            setValue('entries', updatedEntries);
            
            // Add category suggestion if available
            if (categorySuggestion?.suggestedCategory) {
              setValue('category', categorySuggestion.suggestedCategory);
            }

            // Add transaction type suggestion if available
            if (transactionTypeSuggestion?.suggestedType) {
              setValue('type', transactionTypeSuggestion.suggestedType as any);
            }
            
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
            // Set tone message from account suggestion if available
            setSuggestionToneMessage(accountSuggestion.toneMessage || null);
            // Set new metadata fields
            setSuggestionAccountType(accountSuggestion.accountType || null);
            setSuggestionCategory(accountSuggestion.category || null);
            setSuggestionFinancialCategory(accountSuggestion.financialCategory || null);
            setSuggestionEntryType(accountSuggestion.suggestedEntryType || null);
          }
        } catch (error) {
          console.error('Failed to get suggestions:', error);
          // Silent failure for minor fetches like smart suggestions
        }
      }, 300); // 300ms debounce delay
    } else {
      // Clear suggestion when description is too short, empty, or smart suggestions disabled
      
      setSuggestionExplanation(null);
      setSuggestionConfidence(null);
      setSuggestionToneMessage(null);
      setSuggestionAccountType(null);
      setSuggestionCategory(null);
      setSuggestionFinancialCategory(null);
      setSuggestionEntryType(null);
      setSuggestionAccepted(false);
      setSuggestionRejected(false);
      
      // Also clear the form entries if description is completely empty
      if (!desc || desc.trim().length === 0) {

        const clearedEntries: { accountId: string; amount: string; type: "DEBIT" | "CREDIT" }[] = [
          { accountId: "", amount: "", type: "DEBIT" },
          { accountId: "", amount: "", type: "CREDIT" }
        ];
        setValue('entries', clearedEntries);
      }
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
    setSuggestionToneMessage(null);
    setSuggestionAccountType(null);
    setSuggestionCategory(null);
    setSuggestionFinancialCategory(null);
    setSuggestionEntryType(null);
    setSuggestionAccepted(false);
    setSuggestionRejected(false);
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
      // Learn from account selections when transaction is submitted
      const validEntries = data.entries.filter(entry => entry.accountId && entry.amount);
      
      if (currentSuggestion && !suggestionAccepted && !suggestionRejected) {
        // User had a suggestion but didn't explicitly accept/reject it
        const manuallySelectedAccounts = validEntries
          .filter(entry => entry.accountId && entry.accountId !== String(currentSuggestion.suggestedAccountId))
          .map(entry => ({
            accountId: parseInt(entry.accountId),
            accountName: accounts.find(acc => acc.id === parseInt(entry.accountId))?.name || 'Unknown'
          }));

        if (manuallySelectedAccounts.length > 0) {
          // User selected different accounts than suggested
          for (const selectedAccount of manuallySelectedAccounts) {
            await sendSuggestionFeedback('REJECTED', 
              selectedAccount.accountId, 
              selectedAccount.accountName
            );
          }
        }
      } else if (!currentSuggestion && validEntries.length > 0) {
        // No suggestion was made, but user manually selected accounts
        // Save these as accepted preferences
        for (const entry of validEntries) {
          const accountId = parseInt(entry.accountId);
          const accountName = accounts.find(acc => acc.id === accountId)?.name || 'Unknown';
          
          await sendSuggestionFeedback('ACCEPTED', 
            accountId, 
            accountName
          );
        }
      }

      // Calculate net amount (debits - credits)
      // For INCOME: positive amount (credits > debits)
      // For EXPENSE: positive amount (debits > credits)
      const debitTotal = data.entries
        .filter(entry => entry.type === "DEBIT")
        .reduce((sum, entry) => {
          const amount = parseFloat(entry.amount) || 0;
          // Round to 2 decimal places to avoid floating-point precision issues
          return Math.round((sum + amount) * 100) / 100;
        }, 0);
      
      const creditTotal = data.entries
        .filter(entry => entry.type === "CREDIT")
        .reduce((sum, entry) => {
          const amount = parseFloat(entry.amount) || 0;
          // Round to 2 decimal places to avoid floating-point precision issues
          return Math.round((sum + amount) * 100) / 100;
        }, 0);

      // For INCOME transactions, the amount should be the credit side
      // For EXPENSE transactions, the amount should be the debit side
      const totalAmount = data.type === "INCOME" ? creditTotal : debitTotal;



      // Create backend-compatible transaction data
      const backendTransactionData: BackendTransactionForm = {
        description: data.description,
        date: data.date,
        type: data.type,
        category: data.category || "Uncategorized", // Use form category or default
        amount: totalAmount,
        entries: data.entries.map(entry => ({
          accountId: parseInt(entry.accountId) || 0, // Convert string to number
          amount: Math.round((parseFloat(entry.amount) || 0) * 100) / 100, // Convert string to number and round to 2 decimal places
          type: entry.type,
          description: data.description // Use main transaction description for all entries
        }))
      };



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
          type: data.type, // Include the transaction type
          recurrencePattern: data.recurrencePattern,
          nextRun: data.nextRun,
          endDate: data.endDate || undefined,
          primaryAccountId: parseInt(data.entries[0]?.accountId) || 0,
          secondaryAccountId: parseInt(data.entries[1]?.accountId) || 0,
          primaryEntryType: data.entries[0]?.type || 'DEBIT',
          secondaryEntryType: data.entries[1]?.type || 'CREDIT'
        };
        

        await updateRecurringTransaction(editingRecurringId, recurringData);
        setSuccessMessage("Recurring transaction updated successfully!");
        toast.success("Recurring transaction updated successfully!");
        setError(null);
        
        // Don't clear suggestion explanation - let it persist until user dismissal
      } else {
        // Check if this is a recurring transaction
        if (data.isRecurring) {
          // Validate that only 2 entries are used for recurring transactions
          if (data.entries.length !== 2) {
            setError("Recurring transactions must have exactly 2 entries (one debit, one credit).");
            toast.error("Recurring transactions must have exactly 2 entries.");
            return;
          }
          
          // Validate account IDs
          const primaryAccountId = parseInt(data.entries[0]?.accountId);
          const secondaryAccountId = parseInt(data.entries[1]?.accountId);
          
          if (!primaryAccountId || !secondaryAccountId) {
            setError("Please select both accounts for the recurring transaction.");
            toast.error("Please select both accounts for the recurring transaction.");
            return;
          }
          
          // Create recurring transaction
          const recurringData = {
            description: data.description,
            amount: totalAmount,
            type: data.type, // Include the transaction type
            recurrencePattern: data.recurrencePattern,
            nextRun: data.nextRun,
            endDate: data.endDate || undefined,
            primaryAccountId: primaryAccountId,
            secondaryAccountId: secondaryAccountId,
            primaryEntryType: data.entries[0]?.type || 'DEBIT',
            secondaryEntryType: data.entries[1]?.type || 'CREDIT'
          };
          
          // Debug logging
          console.log('Creating recurring transaction with data:', recurringData);
          console.log('Original entries data:', data.entries);
          console.log('Account IDs:', {
            primary: data.entries[0]?.accountId,
            secondary: data.entries[1]?.accountId,
            parsedPrimary: primaryAccountId,
            parsedSecondary: secondaryAccountId
          });

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
    if (suggestionToneMessage && !smartSuggestionsEnabled) setSuggestionToneMessage(null);
    if (suggestionAccountType && !smartSuggestionsEnabled) setSuggestionAccountType(null);
    if (suggestionCategory && !smartSuggestionsEnabled) setSuggestionCategory(null);
    if (suggestionFinancialCategory && !smartSuggestionsEnabled) setSuggestionFinancialCategory(null);
    if (suggestionEntryType && !smartSuggestionsEnabled) setSuggestionEntryType(null);
    if (suggestionAccepted && !smartSuggestionsEnabled) setSuggestionAccepted(false);
    if (suggestionRejected && !smartSuggestionsEnabled) setSuggestionRejected(false);
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
    setSuggestionToneMessage(null);
    setSuggestionAccountType(null);
    setSuggestionCategory(null);
    setSuggestionFinancialCategory(null);
    setSuggestionEntryType(null);
    setSuggestionAccepted(false);
    setSuggestionRejected(false);
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
    setSuggestionToneMessage(null);
    setSuggestionAccountType(null);
    setSuggestionCategory(null);
    setSuggestionFinancialCategory(null);
    setSuggestionEntryType(null);
    setSuggestionAccepted(false);
    setSuggestionRejected(false);
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
      

      
      // Safety check for transactions data
      if (transactionsData && transactionsData.transactions) {
        setTransactions(transactionsData.transactions);
      } else {

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

  // Handle smart suggestions toggle
  useEffect(() => {
    if (!smartSuggestionsEnabled) {
      // Clear suggestions when disabled
      setSuggestionExplanation(null);
      setSuggestionConfidence(null);
      setSuggestionToneMessage(null);
      setSuggestionAccountType(null);
      setSuggestionCategory(null);
      setSuggestionFinancialCategory(null);
      setSuggestionEntryType(null);
      setSuggestionAccepted(false);
      setSuggestionRejected(false);
    } else {
      // Re-trigger suggestions when re-enabled if there's a description
      const currentDescription = watch('description');
      if (currentDescription && currentDescription.trim().length > 0) {

        handleDescriptionChange(currentDescription);
      }
    }
  }, [smartSuggestionsEnabled, watch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (descriptionChangeTimeoutRef.current) {
        clearTimeout(descriptionChangeTimeoutRef.current);
      }
    };
  }, []);

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
                    <TransactionTemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateSelect={handleTemplateSelect}
              onTemplateClear={handleTemplateClear}
              accounts={usableAccounts}
              onEntriesUpdate={(entries) => setValue('entries', entries)}
              onTransactionTypeUpdate={(type) => setValue('type', type as any)}
            />
        {/* Description - Most Important Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Description *</label>
          <input
            type="text"
            aria-label="Transaction Description *"
            value={watch("description") || ""}
            onChange={(e) => {
      
              // Update form value directly
              setValue("description", e.target.value);
              handleDescriptionChange(e.target.value);
            }}
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
        {suggestionExplanation && smartSuggestionsEnabled && !suggestionRejected && !suggestionAccepted && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm text-blue-800 font-medium mb-1">
                  Smart Suggestion Applied
                </div>
                <div className="text-sm text-blue-700 mb-1">
                  {suggestionExplanation}
                </div>
                {suggestionAccountType && suggestionCategory && suggestionFinancialCategory && (
                  <p className="text-xs text-blue-700 mt-1">
                    <strong>Type:</strong> {suggestionAccountType} | <strong>Category:</strong> {suggestionCategory} | <strong>Financial:</strong> {suggestionFinancialCategory}
                  </p>
                )}
                {suggestionEntryType && (
                  <p className="text-xs text-blue-700 mt-1">
                    <strong>Entry Type:</strong> {suggestionEntryType}
                  </p>
                )}
                {suggestionToneMessage && (
                  <div className="text-xs text-blue-600 mt-1 italic">
                    {suggestionToneMessage}
                  </div>
                )}
                {suggestionConfidence && (
                  <div className="text-xs text-blue-600">
                    Confidence: {suggestionConfidence}%
                  </div>
                )}
                
                {/* Enhanced Accept/Reject Buttons with Side-Specific Options */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={async () => {
                      setSuggestionAccepted(true);
                      setSuggestionRejected(false);
                      
                      // Send feedback for accepted suggestion
                      const currentValues = watch();
                      const selectedAccountId = currentValues.entries.find((entry: any) => 
                        entry.accountId === String(currentSuggestion?.suggestedAccountId)
                      )?.accountId;
                      
                      await sendSuggestionFeedback('ACCEPTED', 
                        selectedAccountId ? parseInt(selectedAccountId) : undefined,
                        currentSuggestion?.suggestedAccountName
                      );
                    }}
                    className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 transition-colors"
                  >
                    Accept both transaction items
                  </button>
                  
                  {/* Side-specific reject buttons */}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={async () => {
                        // Reject only the suggested side (DEBIT or CREDIT)
                        const currentValues = watch();
                        const suggestedEntryType = currentSuggestion?.suggestedEntryType;
                        
                        // Clear only the suggested entry
                        const updatedEntries = [...currentValues.entries];
                        if (suggestedEntryType === 'DEBIT') {
                          updatedEntries[0] = { accountId: "", amount: "", type: "DEBIT" };
                        } else if (suggestedEntryType === 'CREDIT') {
                          updatedEntries[1] = { accountId: "", amount: "", type: "CREDIT" };
                        }
                        
                        setValue('entries', updatedEntries);
                        
                        // Send feedback for partial rejection
                        await sendSuggestionFeedback('REJECTED', undefined, undefined, 
                          `Rejected ${suggestedEntryType} side only`
                        );
                      }}
                      className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 transition-colors"
                      title={`Reject only the ${currentSuggestion?.suggestedEntryType} side`}
                    >
                      Accept {currentSuggestion?.suggestedEntryType === 'CREDIT' ? 'credit' : 'debit'}, reject {currentSuggestion?.suggestedEntryType === 'CREDIT' ? 'debit' : 'credit'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={async () => {
                        // Reject only the auto-populated side
                        const currentValues = watch();
                        const suggestedEntryType = currentSuggestion?.suggestedEntryType;
                        const autoPopulatedEntryType = suggestedEntryType === 'DEBIT' ? 'CREDIT' : 'DEBIT';
                        
                        // Clear only the auto-populated entry
                        const updatedEntries = [...currentValues.entries];
                        if (autoPopulatedEntryType === 'DEBIT') {
                          updatedEntries[0] = { accountId: "", amount: "", type: "DEBIT" };
                        } else if (autoPopulatedEntryType === 'CREDIT') {
                          updatedEntries[1] = { accountId: "", amount: "", type: "CREDIT" };
                        }
                        
                        setValue('entries', updatedEntries);
                        
                        // Send feedback for partial rejection
                        await sendSuggestionFeedback('REJECTED', undefined, undefined, 
                          `Rejected ${autoPopulatedEntryType} side only`
                        );
                      }}
                      className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 transition-colors"
                      title={`Reject only the ${currentSuggestion?.suggestedEntryType === 'DEBIT' ? 'CREDIT' : 'DEBIT'} side`}
                    >
                      Accept {currentSuggestion?.suggestedEntryType === 'DEBIT' ? 'debit' : 'credit'}, reject {currentSuggestion?.suggestedEntryType === 'DEBIT' ? 'credit' : 'debit'}
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={async () => {
                      setSuggestionRejected(true);
                      setSuggestionAccepted(false);
                      
                      // Send feedback for rejected suggestion
                      await sendSuggestionFeedback('REJECTED');
                      
                      // Reset form entries when rejecting both
                      const currentValues = watch();
                      const resetEntries: { accountId: string; amount: string; type: "DEBIT" | "CREDIT" }[] = [
                        { accountId: "", amount: "", type: "DEBIT" },
                        { accountId: "", amount: "", type: "CREDIT" }
                      ];
                      reset({
                        ...currentValues,
                        entries: resetEntries
                      });
                    }}
                    className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
                  >
                    Reject both transaction items
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  // Send feedback for ignored suggestion
                  await sendSuggestionFeedback('IGNORED');
                  
                  setSuggestionExplanation(null);
                  setSuggestionConfidence(null);
                  setSuggestionToneMessage(null);
                  setSuggestionAccountType(null);
                  setSuggestionCategory(null);
                  setSuggestionFinancialCategory(null);
                  setSuggestionEntryType(null);
                  setSuggestionAccepted(false);
                  setSuggestionRejected(false);
                  setCurrentSuggestion(null);
                }}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Accepted Message */}
        {suggestionAccepted && smartSuggestionsEnabled && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <span className="text-green-700 text-sm">✅ Suggestion accepted. Thanks!</span>
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
            isRecurring={watch('isRecurring')}
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