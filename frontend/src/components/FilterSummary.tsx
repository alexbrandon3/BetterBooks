import React from 'react';
import { Account } from '../types/account';

interface FilterSummaryProps {
  filters: {
    search: string;
    type: string;
    category: string;
    startDate: string;
    endDate: string;
    accountId: string;
    minAmount: string;
    maxAmount: string;
  };
  accounts: Account[];
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}

const FilterSummary: React.FC<FilterSummaryProps> = ({
  filters,
  accounts,
  onRemoveFilter,
  onClearAll
}) => {
  const getActiveFilters = () => {
    const active: Array<{ key: string; label: string; value: string }> = [];

    if (filters.search) {
      active.push({ key: 'search', label: 'Search', value: filters.search });
    }

    if (filters.type) {
      active.push({ key: 'type', label: 'Type', value: filters.type });
    }

    if (filters.category) {
      active.push({ key: 'category', label: 'Category', value: filters.category });
    }

    if (filters.startDate || filters.endDate) {
      const dateRange = [];
      if (filters.startDate) dateRange.push(`From ${filters.startDate}`);
      if (filters.endDate) dateRange.push(`To ${filters.endDate}`);
      active.push({ 
        key: 'dateRange', 
        label: 'Date Range', 
        value: dateRange.join(' - ') 
      });
    }

    if (filters.accountId) {
      const account = accounts.find(a => a.id.toString() === filters.accountId);
      active.push({ 
        key: 'accountId', 
        label: 'Account', 
        value: account?.name || filters.accountId 
      });
    }

    if (filters.minAmount || filters.maxAmount) {
      const amountRange = [];
      if (filters.minAmount) amountRange.push(`Min: $${filters.minAmount}`);
      if (filters.maxAmount) amountRange.push(`Max: $${filters.maxAmount}`);
      active.push({ 
        key: 'amountRange', 
        label: 'Amount Range', 
        value: amountRange.join(' - ') 
      });
    }

    return active;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-blue-900">Active Filters</h3>
        <button
          onClick={onClearAll}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Clear All
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter) => (
          <div
            key={filter.key}
            className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs"
          >
            <span className="font-medium mr-1">{filter.label}:</span>
            <span className="mr-2">{filter.value}</span>
            <button
              onClick={() => onRemoveFilter(filter.key)}
              className="text-blue-600 hover:text-blue-800 ml-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterSummary; 