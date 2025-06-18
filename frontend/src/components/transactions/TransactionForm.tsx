import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TransactionForm as TransactionFormType, JournalEntryFields as JournalEntryFieldsType } from '../../services/TransactionService';
import { Transaction } from '../../types/transaction';
import { Account } from '../../types/account';
import { JournalEntryFields } from './JournalEntryFields';
import { RecurringToggle } from './RecurringToggle';
import { useSmartSuggestion } from '../../hooks/useSmartSuggestion';
import { toast } from 'react-hot-toast';

type TransactionWithRecurring = Transaction & {
  isRecurring?: boolean;
  startDate?: string;
  recurrencePattern?: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  terminationDate?: string;
};

const journalEntrySchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val: string) => !isNaN(Number(val)), 'Amount must be a valid number')
    .refine((val: string) => Number(val) > 0, 'Amount must be greater than 0'),
  type: z.enum(['DEBIT', 'CREDIT']),
  description: z.string().optional()
});

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['EXPENSE', 'INCOME']),
  date: z.string().min(1, 'Date is required').refine(
    (val: string) => !isNaN(Date.parse(val)),
    'Invalid date format'
  ),
  entries: z.array(journalEntrySchema).min(1, 'At least one journal entry is required'),
  isRecurring: z.boolean().default(false),
  startDate: z.string().optional(),
  recurrencePattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  terminationDate: z.string().optional()
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  initialValues?: TransactionWithRecurring;
  accounts: Account[];
  onSubmit: (data: TransactionFormType) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialValues,
  accounts,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [isRecurring, setIsRecurring] = React.useState(initialValues?.isRecurring || false);
  const [startDate, setStartDate] = React.useState(initialValues?.startDate || '');
  const [recurrencePattern, setRecurrencePattern] = React.useState<"DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY">(initialValues?.recurrencePattern || 'MONTHLY');
  const [terminationDate, setTerminationDate] = React.useState(initialValues?.terminationDate || '');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: initialValues?.description || '',
      type: initialValues?.type || 'EXPENSE',
      date: initialValues?.date || '',
      entries: initialValues?.entries?.map(e => ({
        accountId: String(e.account.id),
        amount: String(e.amount),
        type: e.type,
        description: e.description || ''
      })) || [{ accountId: '', amount: '', type: 'DEBIT', description: '' }],
      isRecurring: initialValues?.isRecurring || false,
      startDate: initialValues?.startDate || '',
      recurrencePattern: initialValues?.recurrencePattern || 'MONTHLY',
      terminationDate: initialValues?.terminationDate || ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'entries'
  });

  // Smart suggestion hook for main transaction
  const { 
    suggestion: mainSuggestion, 
    isLoading: isMainSuggestionLoading, 
    fetchSuggestion: fetchMainSuggestion, 
    clearSuggestion: clearMainSuggestion, 
    isMobile 
  } = useSmartSuggestion();

  // Smart suggestion hooks for each entry (for split transactions)
  const entrySuggestions = fields.map((_, index) => useSmartSuggestion());

  // Watch description for main transaction suggestions
  const description = watch('description');
  const firstEntryAccountId = watch('entries.0.accountId');

  // Watch descriptions for individual entries
  const entryDescriptions = watch('entries')?.map(entry => entry.description) || [];
  const entryAccountIds = watch('entries')?.map(entry => entry.accountId) || [];

  // Fetch main suggestion when description changes
  React.useEffect(() => {
    if (description && description.trim().length > 0) {
      fetchMainSuggestion(description);
    } else {
      clearMainSuggestion();
    }
  }, [description, fetchMainSuggestion, clearMainSuggestion]);

  // Fetch suggestions for entries
  React.useEffect(() => {
    entryDescriptions.forEach((entryDesc, index) => {
      if (entrySuggestions[index] && entryDesc && !entryAccountIds[index]) {
        entrySuggestions[index].fetchSuggestion(entryDesc);
      } else if (entrySuggestions[index]) {
        entrySuggestions[index].clearSuggestion();
      }
    });
  }, [entryDescriptions, entrySuggestions, entryAccountIds]);

  // Apply main suggestion when clicked
  const handleApplyMainSuggestion = () => {
    if (mainSuggestion && fields.length > 0) {
      setValue('entries.0.accountId', String(mainSuggestion.suggestedAccountId));
      toast.success(`Applied suggestion: ${mainSuggestion.suggestedAccountName}`);
    }
  };

  // Apply entry suggestion when clicked
  const handleApplyEntrySuggestion = (index: number) => {
    const entrySuggestion = entrySuggestions[index].suggestion;
    if (entrySuggestion) {
      setValue(`entries.${index}.accountId`, String(entrySuggestion.suggestedAccountId));
      toast.success(`Applied suggestion: ${entrySuggestion.suggestedAccountName}`);
    }
  };

  // Check if main suggestion should be shown
  const shouldShowMainSuggestion = mainSuggestion && 
    !firstEntryAccountId && 
    description && 
    description.trim().length > 0 &&
    fields.length === 1; // Only show for single transactions

  // Check if entry suggestions should be shown
  const shouldShowEntrySuggestions = fields.length > 1; // Only for split transactions

  // Check if main fallback message should be shown
  const shouldShowMainFallback = description && 
    description.trim().length > 0 && 
    !firstEntryAccountId && 
    !mainSuggestion && 
    !isMainSuggestionLoading &&
    fields.length === 1;

  // State for tooltip visibility (prevents flicker)
  const [isTooltipVisible, setIsTooltipVisible] = React.useState(false);
  const [tooltipContent, setTooltipContent] = React.useState('');

  // Handle tooltip visibility with debounce to prevent flicker
  const handleTooltipShow = React.useCallback((content: string) => {
    if (!isMobile) {
      setTooltipContent(content);
      setIsTooltipVisible(true);
    }
  }, [isMobile]);

  const handleTooltipHide = React.useCallback(() => {
    if (!isMobile) {
      // Small delay to prevent flicker when moving between tooltip and button
      setTimeout(() => setIsTooltipVisible(false), 100);
    }
  }, [isMobile]);

  // Handle touch events for mobile
  const handleTouchStart = React.useCallback((content: string) => {
    if (isMobile) {
      setTooltipContent(content);
      setIsTooltipVisible(true);
    }
  }, [isMobile]);

  const handleTouchEnd = React.useCallback(() => {
    if (isMobile) {
      setTimeout(() => setIsTooltipVisible(false), 2000); // Show for 2 seconds on mobile
    }
  }, [isMobile]);

  // Clear tooltip when suggestions change
  React.useEffect(() => {
    setIsTooltipVisible(false);
  }, [mainSuggestion, entrySuggestions]);

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      const formData: TransactionFormType = {
        description: data.description,
        type: data.type,
        date: data.date,
        entries: data.entries,
        isRecurring: isRecurring,
        startDate: isRecurring ? startDate : undefined,
        recurrencePattern: isRecurring ? recurrencePattern : undefined,
        terminationDate: isRecurring ? terminationDate : undefined
      };
      await onSubmit(formData);
      toast.success(initialValues ? 'Transaction updated successfully' : 'Transaction created successfully');
    } catch (error) {
      toast.error('Failed to save transaction');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" data-testid="transaction-form">
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          {...register('description')}
          type="text"
          id="description"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          data-testid="description-input"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1" data-testid="error-description">
            {errors.description.message?.toString()}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          {...register('date', { required: 'Date is required' })}
          type="date"
          id="date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          data-testid="date-input"
        />
        {errors.date && (
          <p className="text-red-500 text-sm mt-1" data-testid="error-date">
            {errors.date.message?.toString()}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          {...register('type')}
          id="type"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          data-testid="type-select"
        >
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </select>
        {errors.type && (
          <p className="text-red-500 text-sm mt-1" data-testid="error-type">
            {errors.type.message?.toString()}
          </p>
        )}
      </div>

      <RecurringToggle
        isRecurring={isRecurring}
        onToggle={setIsRecurring}
        startDate={startDate}
        onStartDateChange={setStartDate}
        recurrencePattern={recurrencePattern}
        onRecurrencePatternChange={setRecurrencePattern}
        terminationDate={terminationDate}
        onTerminationDateChange={setTerminationDate}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Journal Entries
        </label>
        <JournalEntryFields
          entries={fields}
          accounts={accounts}
          register={register as any}
          errors={errors}
          onAdd={() => append({ accountId: '', amount: '', type: 'DEBIT', description: '' })}
          onRemove={remove}
          entrySuggestions={entrySuggestions}
          shouldShowEntrySuggestions={shouldShowEntrySuggestions}
          entryAccountIds={entryAccountIds}
          onApplyEntrySuggestion={handleApplyEntrySuggestion}
          onTooltipShow={handleTooltipShow}
          onTooltipHide={handleTooltipHide}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          isMobile={isMobile}
        />
        {errors.entries && !Array.isArray(errors.entries) && (
          <p className="text-red-500 text-sm mt-1" data-testid="error-entries">
            {errors.entries.message?.toString()}
          </p>
        )}
        
        {/* Main Smart Suggestion Chip - Only for single transactions */}
        {shouldShowMainSuggestion && (
          <div className="mt-3 tooltip-container">
            <div className="relative inline-block">
              <button
                type="button"
                onClick={handleApplyMainSuggestion}
                disabled={isMainSuggestionLoading}
                onMouseEnter={() => handleTooltipShow(mainSuggestion.reason)}
                onMouseLeave={handleTooltipHide}
                onFocus={() => handleTooltipShow(mainSuggestion.reason)}
                onBlur={handleTooltipHide}
                onTouchStart={() => handleTouchStart(mainSuggestion.reason)}
                onTouchEnd={handleTouchEnd}
                className="suggestion-chip inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-150"
                data-testid="suggestion-chip"
                title={mainSuggestion.reason}
              >
                <span className="mr-1">💡</span>
                Suggested: {mainSuggestion.suggestedAccountName}
                <span className="ml-1">✅</span>
              </button>
              
              {/* Enhanced Tooltip with Mobile Responsiveness */}
              <div 
                className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg transition-all duration-200 pointer-events-none z-50 tooltip-mobile ${
                  isTooltipVisible 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-95'
                }`}
                style={{
                  maxWidth: '280px',
                  wordWrap: 'break-word',
                  whiteSpace: 'normal'
                }}
              >
                <div className="text-center">{tooltipContent}</div>
                {/* Arrow pointer - hidden on mobile */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 sm:block hidden"></div>
              </div>
            </div>
            {isMainSuggestionLoading && (
              <span className="ml-2 text-sm text-gray-500 animate-pulse" data-testid="main-suggestion-loading">Loading...</span>
            )}
          </div>
        )}

        {/* Enhanced Fallback Message - No Suggestion Found */}
        {shouldShowMainFallback && (
          <div className="mt-3 animate-in">
            <div className="inline-flex items-center px-3 py-1 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-full shadow-sm">
              <span className="mr-1">ℹ️</span>
              <span className="max-w-xs truncate">
                No account suggestion found for "{description}"
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          data-testid="submit-transaction"
        >
          {isLoading ? 'Saving...' : initialValues ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}; 