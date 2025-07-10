import React, { useState, useEffect, useRef } from 'react';
import { Account } from '../types/account';
import { getUniqueCategories } from '../services/TransactionService';

interface AdvancedFiltersProps {
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
  onFilterChange: (key: keyof AdvancedFiltersProps['filters'], value: string) => void;
  onClearFilters: () => void;
}

const AdvancedTransactionFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  accounts,
  onFilterChange,
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Common categories for autocomplete (fallback)
  const commonCategories = [
    'Sales', 'Revenue', 'Service Income', 'Product Sales',
    'Payroll', 'Wages', 'Employee Benefits', 'Bonuses',
    'Taxes', 'Income Tax', 'Sales Tax', 'Property Tax',
    'Rent', 'Lease', 'Office Rent', 'Equipment Lease',
    'Utilities', 'Electricity', 'Water', 'Internet', 'Phone',
    'Marketing', 'Advertising', 'Promotion', 'Social Media',
    'Travel', 'Transportation', 'Meals', 'Lodging',
    'Equipment', 'Machinery', 'Tools', 'Computers',
    'Insurance', 'Health Insurance', 'Liability Insurance',
    'Legal', 'Attorney Fees', 'Legal Services',
    'Accounting', 'Bookkeeping', 'CPA Services',
    'Software', 'Subscriptions', 'SaaS',
    'Supplies', 'Office Supplies', 'Materials',
    'Other', 'Miscellaneous', 'Uncategorized'
  ];

  // Load dynamic categories from backend
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categories = await getUniqueCategories();
        setDynamicCategories(categories);
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to common categories
        setDynamicCategories(commonCategories);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Combine dynamic and common categories, removing duplicates
  const allCategories = [...new Set([...dynamicCategories, ...commonCategories])];

  // Common search terms for suggestions
  const commonSearchTerms = [
    'invoice', 'payment', 'receipt', 'deposit', 'withdrawal',
    'transfer', 'fee', 'charge', 'refund', 'credit',
    'debit', 'cash', 'check', 'credit card', 'bank',
    'online', 'automatic', 'recurring', 'monthly', 'quarterly',
    'annual', 'subscription', 'service', 'product', 'equipment',
    'rent', 'utilities', 'insurance', 'tax', 'salary',
    'commission', 'bonus', 'expense', 'income', 'revenue'
  ];

  // Filter categories based on search input with improved fuzzy matching
  useEffect(() => {
    if (filters.category) {
      const searchTerm = filters.category.toLowerCase();
      const filtered = allCategories.filter(cat => {
        const category = cat.toLowerCase();
        
        // Exact match gets highest priority
        if (category === searchTerm) return true;
        
        // Starts with search term
        if (category.startsWith(searchTerm)) return true;
        
        // Contains search term
        if (category.includes(searchTerm)) return true;
        
        // Fuzzy matching for typos and partial matches
        const words = category.split(' ');
        const searchWords = searchTerm.split(' ');
        
        // Check if any word starts with any search word
        for (const word of words) {
          for (const searchWord of searchWords) {
            if (word.startsWith(searchWord) && searchWord.length > 1) {
              return true;
            }
          }
        }
        
        return false;
      });
      
      // Sort by relevance: exact matches first, then starts with, then contains
      const sorted = filtered.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        
        if (aLower === searchTerm && bLower !== searchTerm) return -1;
        if (bLower === searchTerm && aLower !== searchTerm) return 1;
        if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1;
        if (bLower.startsWith(searchTerm) && !aLower.startsWith(searchTerm)) return 1;
        
        return aLower.localeCompare(bLower);
      });
      
      setCategorySuggestions(sorted.slice(0, 10)); // Limit to top 10 matches
    } else {
      setCategorySuggestions(allCategories.slice(0, 10)); // Show top 10 categories when empty
    }
  }, [filters.category, allCategories]);

  // Filter search terms based on search input with improved fuzzy matching
  useEffect(() => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const filtered = commonSearchTerms.filter(term => {
        const termLower = term.toLowerCase();
        
        // Exact match gets highest priority
        if (termLower === searchTerm) return true;
        
        // Starts with search term
        if (termLower.startsWith(searchTerm)) return true;
        
        // Contains search term
        if (termLower.includes(searchTerm)) return true;
        
        // Fuzzy matching for typos and partial matches
        const words = termLower.split(' ');
        const searchWords = searchTerm.split(' ');
        
        // Check if any word starts with any search word
        for (const word of words) {
          for (const searchWord of searchWords) {
            if (word.startsWith(searchWord) && searchWord.length > 1) {
              return true;
            }
          }
        }
        
        return false;
      });
      
      // Sort by relevance: exact matches first, then starts with, then contains
      const sorted = filtered.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        
        if (aLower === searchTerm && bLower !== searchTerm) return -1;
        if (bLower === searchTerm && aLower !== searchTerm) return 1;
        if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1;
        if (bLower.startsWith(searchTerm) && !aLower.startsWith(searchTerm)) return 1;
        
        return aLower.localeCompare(bLower);
      });
      
      setSearchSuggestions(sorted.slice(0, 8)); // Limit to top 8 matches
    } else {
      setSearchSuggestions(commonSearchTerms.slice(0, 8)); // Show top 8 terms when empty
    }
  }, [filters.search]);

  // Handle clicks outside of suggestion dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryInputRef.current && !categoryInputRef.current.contains(event.target as Node)) {
        setShowCategorySuggestions(false);
      }
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategorySelect = (category: string) => {
    onFilterChange('category', category);
    setShowCategorySuggestions(false);
  };

  const handleSearchSelect = (term: string) => {
    onFilterChange('search', term);
    setShowSearchSuggestions(false);
  };

  const handleAmountSliderChange = (type: 'min' | 'max', value: string) => {
    onFilterChange(type === 'min' ? 'minAmount' : 'maxAmount', value);
  };

  const handleQuickDatePreset = (preset: string) => {
    const today = new Date();
    let startDate = '';
    let endDate = today.toISOString().split('T')[0];

    switch (preset) {
      case 'last7':
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = lastWeek.toISOString().split('T')[0];
        break;
      case 'last30':
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = lastMonth.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = startOfMonth.toISOString().split('T')[0];
        break;
      case 'thisYear':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        startDate = startOfYear.toISOString().split('T')[0];
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = lastMonthStart.toISOString().split('T')[0];
        endDate = lastMonthEnd.toISOString().split('T')[0];
        break;
      case 'lastQuarter':
        const lastQuarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - 3, 1);
        const lastQuarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 0);
        startDate = lastQuarterStart.toISOString().split('T')[0];
        endDate = lastQuarterEnd.toISOString().split('T')[0];
        break;
    }

    onFilterChange('startDate', startDate);
    onFilterChange('endDate', endDate);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Advanced Filters</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Basic Filters - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search with Suggestions */}
        <div className="relative" ref={searchInputRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => {
              onFilterChange('search', e.target.value);
              setShowSearchSuggestions(true);
            }}
            onFocus={() => setShowSearchSuggestions(true)}
            placeholder="Search descriptions..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchSuggestions.map((term, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleSearchSelect(term)}
                >
                  {term}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
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

        {/* Category with Autocomplete */}
        <div className="relative" ref={categoryInputRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
            {isLoadingCategories && (
              <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
            )}
          </label>
          <input
            type="text"
            value={filters.category}
            onChange={(e) => {
              onFilterChange('category', e.target.value);
              setShowCategorySuggestions(true);
            }}
            onFocus={() => setShowCategorySuggestions(true)}
            placeholder={isLoadingCategories ? "Loading categories..." : "Enter category..."}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoadingCategories}
          />
          {showCategorySuggestions && categorySuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {categorySuggestions.map((category, index) => (
                <div
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account
          </label>
          <select
            value={filters.accountId}
            onChange={(e) => onFilterChange('accountId', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters - Expandable */}
      {isExpanded && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Date Range */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => onFilterChange('startDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => onFilterChange('endDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Range
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.minAmount}
                    onChange={(e) => handleAmountSliderChange('min', e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.maxAmount}
                    onChange={(e) => handleAmountSliderChange('max', e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="mt-4 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Date Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickDatePreset('last7')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => handleQuickDatePreset('last30')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => handleQuickDatePreset('thisMonth')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                This Month
              </button>
              <button
                onClick={() => handleQuickDatePreset('lastMonth')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Last Month
              </button>
              <button
                onClick={() => handleQuickDatePreset('thisYear')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                This Year
              </button>
              <button
                onClick={() => handleQuickDatePreset('lastQuarter')}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Last Quarter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedTransactionFilters; 