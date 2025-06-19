import { useState, useEffect } from 'react';
import { 
  TransactionForm, 
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSuggestedAccount,
  JournalEntryFields,
  BackendTransactionForm
} from '../services/TransactionService';
import { fetchAccounts } from '../services/AccountService';
import { Account, AccountType, FinancialCategory } from '../types/account';
import { Transaction } from '../types/transaction';
import { TransactionList } from '../components/transactions/TransactionList';
import { JournalEntryFields as JournalEntryFieldsComponent } from '../components/transactions/JournalEntryFields';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Resolver } from 'react-hook-form';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

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
        // Description required for split mode
        if (values.entries.length > 2 && !entry.description) {
          entryError.description = { type: 'required', message: 'Description is required' };
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

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<TransactionForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: "EXPENSE",
      description: "",
      entries: [
        { accountId: "", amount: "", type: "DEBIT", description: "" },
        { accountId: "", amount: "", type: "CREDIT", description: "" }
      ]
    },
    resolver
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "entries"
  });

  // Fallback accounts for tests and empty state
  const fallbackAccounts: Account[] = [
    { 
      id: "1", 
      name: "Checking",
      type: AccountType.ASSET,
      category: "Bank",
      subcategory: "Checking",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "Cash",
      balance: 0
    },
    { 
      id: "2", 
      name: "Savings",
      type: AccountType.ASSET,
      category: "Bank",
      subcategory: "Savings",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "Cash",
      balance: 0
    },
    { 
      id: "3", 
      name: "Groceries",
      type: AccountType.EXPENSE,
      category: "Food",
      subcategory: "Groceries",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "Food",
      balance: 0
    }
  ];
  const fallbackUsed = accounts.length === 0;
  const usableAccounts = accounts.length > 0 ? accounts : fallbackAccounts;

  const handleDescriptionChange = async (desc: string) => {
    if (desc && getSuggestedAccount) {
      try {
        const suggestion = await getSuggestedAccount(desc);
        if (suggestion?.suggestedAccountId) {
          // Get current form values to check if account is already selected
          const currentValues = control._formValues;
          const firstEntryAccountId = currentValues?.entries?.[0]?.accountId;
          
          // Only suggest if no account is manually selected for the first entry
          if (!firstEntryAccountId) {
            const updatedEntries = [...fields];
            updatedEntries[0].accountId = String(suggestion.suggestedAccountId);
            // Preserve the description and other form values
            reset({ 
              ...currentValues, 
              description: desc, // Preserve the description
              entries: updatedEntries 
            });
          }
        }
      } catch (error) {
        console.error('Failed to get account suggestion:', error);
        // Silent failure for minor fetches like smart suggestions
      }
    }
  };

  const handleEntryDescriptionChange = (index: number, value: string) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], description: value };
    reset({ ...fields, entries: updatedFields });
  };

  const isEditingSplitTransaction = Boolean(editingTransactionId && fields.length > 1);

  const handleResetForm = () => {
    reset({
      date: new Date().toISOString().split('T')[0],
      type: "EXPENSE",
      description: "",
      category: "Uncategorized",
      amount: 0,
      entries: [
        { accountId: "", amount: "", type: "DEBIT", description: "" },
        { accountId: "", amount: "", type: "CREDIT", description: "" }
      ]
    });
    setEditingTransactionId(null);
    setError(null);
    setSuccessMessage(null);
  };

  const onSubmit = async (data: TransactionForm) => {
    setIsSubmitting(true);
    // Don't clear successMessage or error here
    try {
      // Calculate total amount from entries
      const totalAmount = data.entries.reduce((sum, entry) => {
        const amount = parseFloat(entry.amount) || 0;
        return sum + amount;
      }, 0);

      // Create backend-compatible transaction data
      const backendTransactionData: BackendTransactionForm = {
        description: data.description,
        date: data.date,
        type: data.type,
        category: "Uncategorized", // Default category
        amount: totalAmount,
        entries: data.entries.map(entry => ({
          accountId: parseInt(entry.accountId) || 0, // Convert string to number
          amount: parseFloat(entry.amount) || 0, // Convert string to number
          type: entry.type,
          description: entry.description || ""
        }))
      };

      console.log('📤 Backend transaction data:', JSON.stringify(backendTransactionData, null, 2));

      if (editingTransactionId) {
        await updateTransaction(editingTransactionId, backendTransactionData);
        setSuccessMessage("Transaction updated successfully!");
        setError(null);
        toast.success("Transaction updated successfully!");
      } else {
        await createTransaction(backendTransactionData);
        setSuccessMessage("Transaction created successfully!");
        setError(null);
        toast.success("Transaction created successfully!");
      }
      // Reset form completely after successful submission
      const resetData: TransactionForm = {
        date: new Date().toISOString().split('T')[0],
        type: "EXPENSE",
        description: "",
        category: "Uncategorized",
        amount: 0,
        entries: [
          { accountId: "", amount: "", type: "DEBIT", description: "" },
          { accountId: "", amount: "", type: "CREDIT", description: "" }
        ]
      };
      reset(resetData);
      setFormKey(prev => prev + 1); // Force form re-render
      setEditingTransactionId(null);
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
        accountId: entry.account.id,
        amount: entry.amount.toString(),
        type: entry.type,
        description: entry.description || ""
      }))
    });
    setEditingTransactionId(transaction.id);
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
      const [transactionsData, accountsData] = await Promise.all([
        fetchTransactions(),
        fetchAccounts()
      ]);
      setTransactions(transactionsData);
      setAccounts(accountsData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError("Failed to fetch transactions. Please try again later.");
      toast.error("Failed to fetch transactions. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
              {errors.entries && typeof errors.entries === 'object' && Array.isArray(errors.entries) && errors.entries.map((entryErr, idx) => (
                entryErr && entryErr.description && <div key={`err-description-${idx}`}>{`Entry ${idx + 1}: ${entryErr.description.message}`}</div>
              ))}
            </>
          )}
        </div>
      ) : null}

      <form key={formKey} onSubmit={handleSubmit(onSubmit)} className="mb-8" onChange={handleAnyInput} onInput={handleAnyInput}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Description *</label>
          <input
            type="text"
            {...register("description")}
            aria-label="Transaction Description *"
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Entries</label>
          </div>
          
          <JournalEntryFieldsComponent
            entries={fields}
            accounts={usableAccounts}
            register={register}
            errors={errors}
            onAdd={() => append({ accountId: '', amount: '', type: 'DEBIT', description: '' })}
            onRemove={remove}
            onDescriptionChange={handleEntryDescriptionChange}
            showDescriptionFields={isEditingSplitTransaction}
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
            {isSubmitting ? 'Saving...' : editingTransactionId ? 'Update Transaction' : 'Create Transaction'}
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
        <TransactionList
          transactions={transactions}
          accounts={accounts}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
        />
      )}
    </div>
  );
};

export default Transactions;