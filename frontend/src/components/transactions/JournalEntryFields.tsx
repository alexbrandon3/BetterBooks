import React from 'react';
import { UseFormRegister, FieldErrors, FieldArrayWithId } from 'react-hook-form';
import { Account } from '../../types/account';
import { useFormContext } from 'react-hook-form';

interface JournalEntryFieldsProps {
  entries: FieldArrayWithId[];
  accounts: Account[];
  register: UseFormRegister<any>;
  errors?: FieldErrors<any>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onDescriptionChange: (index: number, value: string) => void;
  showDescriptionFields?: boolean;
}

export const JournalEntryFields: React.FC<JournalEntryFieldsProps> = ({
  entries,
  accounts,
  register,
  errors,
  onAdd,
  onRemove,
  onDescriptionChange,
  showDescriptionFields = false
}) => {
  return (
    <div className="space-y-4" data-testid="journal-entries">
      {entries.map((entry, idx) => (
        <div key={entry.id} className="space-y-3" data-testid={`journal-entry-${idx}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor={`account-${idx}`} className="block text-sm font-medium text-gray-700">
                Account *
              </label>
              <select
                id={`account-${idx}`}
                {...register(`entries.${idx}.accountId`)}
                aria-label="Account *"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                <p className="text-red-500 text-sm mt-1" data-testid={`error-entries.${idx}.accountId`}>
                  {(errors?.entries as any)[idx]?.accountId?.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`amount-${idx}`} className="block text-sm font-medium text-gray-700">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                id={`amount-${idx}`}
                {...register(`entries.${idx}.amount`)}
                aria-label={showDescriptionFields ? `Split ${idx + 1} Amount` : "Amount *"}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0.01"
                data-testid={`amount-input-${idx}`}
              />
              {errors && errors.entries && ((errors.entries as unknown) as any[])[idx] && ((errors.entries as unknown) as any[])[idx].amount && (
                <span className="text-red-600 text-xs">{((errors.entries as unknown) as any[])[idx].amount.message || 'Amount is required'}</span>
              )}
            </div>

            <div>
              <label htmlFor={`type-${idx}`} className="block text-sm font-medium text-gray-700">
                Entry Type *
              </label>
              <select
                id={`type-${idx}`}
                {...register(`entries.${idx}.type`)}
                aria-label="Entry Type *"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                data-testid={`type-select-${idx}`}
              >
                <option value="DEBIT">Debit</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            {showDescriptionFields && (
              <div>
                <label htmlFor={`description-${idx}`} className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <input
                  type="text"
                  id={`description-${idx}`}
                  value={(entry as any).description || ''}
                  onChange={e => onDescriptionChange(idx, e.target.value)}
                  aria-label={`Split ${idx + 1} Description`}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  data-testid={`description-input-${idx}`}
                  placeholder="e.g., Groceries, Gas, Entertainment"
                />
                {(errors?.entries as any)?.[idx]?.description?.message && (
                  <p className="text-red-500 text-sm mt-1" data-testid={`error-entries.${idx}.description`}>
                    {(errors?.entries as any)[idx]?.description?.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-end space-x-2 pt-6 md:pt-0">
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  data-testid={`remove-entry-${idx}`}
                  aria-label="Remove entry"
                  title="Remove entry"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        data-testid="add-split-btn"
      >
        Add Split
      </button>
    </div>
  );
}; 