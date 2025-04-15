import { useState, useCallback } from 'react';
import { Account, AccountType } from '../types/account';
import { accountService } from '../services/accountService';
import { sortAccounts, filterAccounts, suggestSubtype, validateAccount } from '../utils/accountUtils';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<keyof Account>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedAccounts = await accountService.getAccounts();
      setAccounts(loadedAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleTypeFilter = useCallback((type: AccountType | 'all') => {
    setTypeFilter(type);
  }, []);

  const handleSort = useCallback((property: keyof Account) => {
    if (property === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(property);
      setSortOrder('asc');
    }
  }, [sortBy]);

  const handleArchiveToggle = useCallback(async (accountId: string, isActive: boolean) => {
    try {
      await accountService.updateAccount(accountId, { isActive });
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
    }
  }, [loadAccounts]);

  const handleAddAccount = useCallback(async (newAccount: Omit<Account, 'id'>) => {
    try {
      const validation = validateAccount(newAccount);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      await accountService.createAccount(newAccount);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      throw err;
    }
  }, [loadAccounts]);

  const handleUpdateAccount = useCallback(async (accountId: string, updates: Partial<Account>) => {
    try {
      const validation = validateAccount(updates);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      await accountService.updateAccount(accountId, updates);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update account');
      throw err;
    }
  }, [loadAccounts]);

  const getFilteredAndSortedAccounts = useCallback(() => {
    const filtered = filterAccounts(accounts, searchTerm, typeFilter, showArchived);
    return sortAccounts(filtered, sortBy, sortOrder);
  }, [accounts, searchTerm, typeFilter, showArchived, sortBy, sortOrder]);

  const getSuggestedSubtype = useCallback((name: string, type: AccountType) => {
    return suggestSubtype(name, type);
  }, []);

  return {
    accounts: getFilteredAndSortedAccounts(),
    searchTerm,
    typeFilter,
    showArchived,
    sortBy,
    sortOrder,
    isLoading,
    error,
    handleSearch,
    handleTypeFilter,
    handleSort,
    handleArchiveToggle,
    handleAddAccount,
    handleUpdateAccount,
    getSuggestedSubtype,
    setShowArchived,
    loadAccounts
  };
}; 