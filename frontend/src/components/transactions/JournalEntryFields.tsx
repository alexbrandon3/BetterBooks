import React from 'react';
import { UseFormRegister, FieldErrors, FieldArrayWithId } from 'react-hook-form';
import { Account } from '../../types/account';
import { useFormContext } from 'react-hook-form';
// Removed saveUserPreference import - no longer needed

interface JournalEntryFieldsProps {
  entries: FieldArrayWithId[];
  accounts: Account[];
  register: UseFormRegister<any>;
  errors?: FieldErrors<any>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onDescriptionChange?: (index: number, value: string) => void;
  showDescriptionFields?: boolean;
  transactionDescription?: string; // Add transaction description for preference saving
}

export const JournalEntryFields: React.FC<JournalEntryFieldsProps> = ({
  entries,
  accounts,
  register,
  errors,
  onAdd,
  onRemove,
  onDescriptionChange,
  showDescriptionFields = false,
  transactionDescription
}) => {
  // Get the form context to access isRecurring
  const formContext = useFormContext();
  const isRecurring = formContext?.watch('isRecurring') || false;

  // Handler for account selection - removed automatic preference saving
  // Preferences will be saved when transaction is submitted instead
  const handleAccountSelection = async (accountId: string, description: string) => {
    // No longer automatically saving preferences here
    // This prevents duplicate preference saves
  };

  return (
    <div className="space-y-6" data-testid="journal-entries">
      {/* Show info message for recurring transactions */}
      {isRecurring && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <span className="text-blue-600 mr-2">ℹ️</span>
            <span className="text-sm text-blue-700">
              Recurring transactions use exactly 2 accounts (one debit, one credit)
            </span>
          </div>
        </div>
      )}

      {entries.map((entry, idx) => (
        <div key={entry.id} className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50" data-testid={`journal-entry-${idx}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label htmlFor={`account-${idx}`} className="block text-sm font-medium text-gray-700 mb-2">
                Account *
              </label>
              <select
                id={`account-${idx}`}
                {...register(`entries.${idx}.accountId`)}
                onChange={(e) => {
                  // Call the original register onChange
                  register(`entries.${idx}.accountId`).onChange(e);
                  // Save user preference when account is selected
                  handleAccountSelection(e.target.value, transactionDescription || '');
                }}
                aria-label="Account *"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                data-testid={`account-select-${idx}`}
              >
                <option value="">Select Account</option>
                {accounts.map(account => (
                  <option key={account.id} value={String(account.id)}>
                    {account.name}
                  </option>
                ))}
              </select>
              {(errors?.entries as any)?.[idx]?.accountId?.message && (
                <p className="text-red-500 text-sm mt-2" data-testid={`error-entries.${idx}.accountId`}>
                  {(errors?.entries as any)[idx]?.accountId?.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`amount-${idx}`} className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                id={`amount-${idx}`}
                {...register(`entries.${idx}.amount`)}
                aria-label={showDescriptionFields ? `Split ${idx + 1} Amount` : "Amount *"}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                min="0.01"
                data-testid={`amount-input-${idx}`}
              />
              {errors && errors.entries && ((errors.entries as unknown) as any[])[idx] && ((errors.entries as unknown) as any[])[idx].amount && (
                <span className="text-red-600 text-xs mt-2 block">{((errors.entries as unknown) as any[])[idx].amount.message || 'Amount is required'}</span>
              )}
            </div>

            <div>
              <label htmlFor={`type-${idx}`} className="block text-sm font-medium text-gray-700 mb-2">
                Entry Type *
              </label>
              <select
                id={`type-${idx}`}
                {...register(`entries.${idx}.type`)}
                aria-label="Entry Type *"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                data-testid={`type-select-${idx}`}
              >
                <option value="DEBIT">Debit</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            {showDescriptionFields && (
              <div>
                <label htmlFor={`description-${idx}`} className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  id={`description-${idx}`}
                  value={(entry as any).description || ''}
                  onChange={e => onDescriptionChange && onDescriptionChange(idx, e.target.value)}
                  aria-label={`Split ${idx + 1} Description`}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2"
                  data-testid={`description-input-${idx}`}
                  placeholder="e.g., Groceries, Gas, Entertainment"
                />
                {(errors?.entries as any)?.[idx]?.description?.message && (
                  <p className="text-red-500 text-sm mt-2" data-testid={`error-entries.${idx}.description`}>
                    {(errors?.entries as any)[idx]?.description?.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-end space-x-2 pt-8 md:pt-0">
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:text-red-600 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  data-testid={`remove-entry-${idx}`}
                  aria-label="Remove entry"
                  title="Remove entry"
                >
                  <span className="text-gray-600 group-hover:text-red-600">🗑️</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* Only show "Add New Row" button when not recurring */}
      {!isRecurring && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 px-6 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          data-testid="add-split-btn"
        >
          Add New Row
        </button>
      )}
    </div>
  );
}; 