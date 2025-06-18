import React from 'react';

interface RecurringToggleProps {
  isRecurring: boolean;
  onToggle: (isRecurring: boolean) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  recurrencePattern: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  onRecurrencePatternChange: (pattern: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY") => void;
  terminationDate?: string;
  onTerminationDateChange: (date: string) => void;
}

export const RecurringToggle: React.FC<RecurringToggleProps> = ({
  isRecurring,
  onToggle,
  startDate,
  onStartDateChange,
  recurrencePattern,
  onRecurrencePatternChange,
  terminationDate,
  onTerminationDateChange
}) => {
  return (
    <div className="space-y-4" data-testid="recurring-toggle">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="recurring-toggle"
          checked={isRecurring}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          data-testid="recurring-checkbox"
        />
        <label htmlFor="recurring-toggle" className="ml-2 block text-sm text-gray-900">
          Recurring Transaction
        </label>
      </div>

      {isRecurring && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              data-testid="start-date-input"
            />
          </div>

          <div>
            <label htmlFor="recurrence-pattern" className="block text-sm font-medium text-gray-700">
              Recurrence Pattern
            </label>
            <select
              id="recurrence-pattern"
              value={recurrencePattern}
              onChange={(e) => onRecurrencePatternChange(e.target.value as "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              data-testid="recurrence-pattern-select"
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <div>
            <label htmlFor="termination-date" className="block text-sm font-medium text-gray-700">
              Termination Date
            </label>
            <input
              type="date"
              id="termination-date"
              value={terminationDate || ''}
              onChange={(e) => onTerminationDateChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              data-testid="termination-date-input"
            />
          </div>
        </div>
      )}
    </div>
  );
}; 