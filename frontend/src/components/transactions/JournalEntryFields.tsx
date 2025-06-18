import React from 'react';
import { UseFormRegister, FieldErrors, FieldArrayWithId } from 'react-hook-form';
import { Account } from '../../types/account';
import { TransactionForm } from '../../services/TransactionService';
import { FaTrash } from 'react-icons/fa';

interface JournalEntryFieldsProps {
  entries: FieldArrayWithId[];
  accounts: Account[];
  register: UseFormRegister<any>;
  errors?: FieldErrors<any>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  entrySuggestions?: any[];
  shouldShowEntrySuggestions?: boolean;
  entryAccountIds?: string[];
  onApplyEntrySuggestion?: (index: number) => void;
  onTooltipShow?: (content: string) => void;
  onTooltipHide?: () => void;
  onTouchStart?: (content: string) => void;
  onTouchEnd?: () => void;
  isMobile?: boolean;
}

export const JournalEntryFields: React.FC<JournalEntryFieldsProps> = ({
  entries,
  accounts,
  register,
  errors,
  onAdd,
  onRemove,
  entrySuggestions = [],
  shouldShowEntrySuggestions = false,
  entryAccountIds = [],
  onApplyEntrySuggestion,
  onTooltipShow,
  onTooltipHide,
  onTouchStart,
  onTouchEnd,
  isMobile = false
}) => {
  return (
    <div className="space-y-4" data-testid="journal-entries">
      {entries.map((entry, idx) => {
        const entrySuggestion = entrySuggestions[idx];
        const entryAccountId = entryAccountIds[idx];
        const shouldShowSuggestion = shouldShowEntrySuggestions && 
          entrySuggestion?.suggestion && 
          !entryAccountId && 
          entrySuggestion.suggestion;

        return (
          <div key={entry.id} className="space-y-3" data-testid={`journal-entry-${idx}`}>
            {/* Entry Description Field - Only show for split transactions */}
            {shouldShowEntrySuggestions && (
              <div>
                <label htmlFor={`description-${idx}`} className="block text-sm font-medium text-gray-700">
                  Entry Description
                </label>
                <input
                  {...register(`entries.${idx}.description`)}
                  type="text"
                  id={`description-${idx}`}
                  placeholder="e.g., Groceries, Gas, Entertainment"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  data-testid={`description-input-${idx}`}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label htmlFor={`account-${idx}`} className="block text-sm font-medium text-gray-700">
                  Account
                </label>
                <select
                  {...register(`entries.${idx}.accountId`)}
                  id={`account-${idx}`}
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
                  Amount
                </label>
                <input
                  type="number"
                  {...register(`entries.${idx}.amount`)}
                  id={`amount-${idx}`}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0.01"
                  step="0.01"
                  data-testid={`amount-input-${idx}`}
                />
                {(errors?.entries as any)?.[idx]?.amount?.message && (
                  <p className="text-red-500 text-sm mt-1" data-testid={`error-entries.${idx}.amount`}>
                    {(errors?.entries as any)[idx]?.amount?.message}
                  </p>
                )}
              </div>

              <div className="flex items-end space-x-2">
                <select
                  {...register(`entries.${idx}.type`)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  data-testid={`type-select-${idx}`}
                >
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Credit</option>
                </select>

                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    data-testid={`remove-entry-${idx}`}
                    aria-label="Remove entry"
                    title="Remove entry"
                  >
                    {FaTrash({ size: 16 })}
                  </button>
                )}
              </div>
            </div>

            {/* Entry-level Smart Suggestion Chip */}
            {shouldShowSuggestion && (
              <div className="tooltip-container">
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => onApplyEntrySuggestion?.(idx)}
                    disabled={entrySuggestion?.isLoading}
                    onMouseEnter={() => onTooltipShow?.(entrySuggestion.suggestion.reason)}
                    onMouseLeave={onTooltipHide}
                    onFocus={() => onTooltipShow?.(entrySuggestion.suggestion.reason)}
                    onBlur={onTooltipHide}
                    onTouchStart={() => onTouchStart?.(entrySuggestion.suggestion.reason)}
                    onTouchEnd={onTouchEnd}
                    className="suggestion-chip inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-150"
                    data-testid={`entry-suggestion-chip-${idx}`}
                    title={entrySuggestion.suggestion.reason}
                  >
                    <span className="mr-1">💡</span>
                    Suggested: {entrySuggestion.suggestion.suggestedAccountName}
                    <span className="ml-1">✅</span>
                  </button>
                  
                  {/* Enhanced Tooltip with Mobile Responsiveness */}
                  <div 
                    className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg transition-all duration-200 pointer-events-none z-50 tooltip-mobile ${
                      entrySuggestion.suggestion.reason 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-95'
                    }`}
                    style={{
                      maxWidth: '280px',
                      wordWrap: 'break-word',
                      whiteSpace: 'normal'
                    }}
                  >
                    <div className="text-center">{entrySuggestion.suggestion.reason}</div>
                    {/* Arrow pointer - hidden on mobile */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 sm:block hidden"></div>
                  </div>
                </div>
                {entrySuggestion?.isLoading && (
                  <span className="ml-2 text-sm text-gray-500 animate-pulse">Loading...</span>
                )}
              </div>
            )}

            {/* Entry-level Fallback Message */}
            {shouldShowEntrySuggestions && 
             !entryAccountId && 
             !entrySuggestion?.suggestion && 
             !entrySuggestion?.isLoading && 
             entrySuggestion?.suggestion && (
              <div className="animate-in">
                <div className="inline-flex items-center px-3 py-1 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-full shadow-sm">
                  <span className="mr-1">ℹ️</span>
                  <span className="max-w-xs truncate">
                    No account suggestion found for this entry
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        data-testid="add-entry"
      >
        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Add Entry
      </button>
    </div>
  );
}; 