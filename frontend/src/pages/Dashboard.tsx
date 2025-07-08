// Updated Dashboard.tsx with production-quality UI/UX improvements
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchAccountsWithConsistentBalances, fetchAccountBalances } from '../services/AccountService';
import { fetchRecentTransactions } from '../services/TransactionService';
import { Account } from '../types/account';
import { Transaction } from '../types/transaction';
import { formatCurrency } from '../utils/formatUtils';
import { useAuth } from '../contexts/AuthContext';
import { SmartGoalSuggestions } from '../components/SmartGoalSuggestions';
import GoalTrackerCard from '../components/GoalTrackerCard';
import { FinancialGoal } from '../types/goal';
import { toast } from 'react-hot-toast';
import { Link } from "react-router-dom";

// Helper to format account counts with proper grammar
function formatAccountCount(count: number, label: string = 'account'): string {
  if (count === 0) {
    return `No ${label}s`;
  } else if (count === 1) {
    return `1 ${label}`;
  } else {
    return `${count} ${label}s`;
  }
}

const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [accountBalances, setAccountBalances] = useState<Map<number, number>>(new Map());
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [accountsData, transactionsData, balancesData] = await Promise.all([
          fetchAccountsWithConsistentBalances(),
          fetchRecentTransactions(10),
          fetchAccountBalances()
        ]);
        
        setAccounts(accountsData);
        setRecentTransactions(transactionsData);
        setAccountBalances(balancesData);
        setError(null);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        toast.error('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Memoize expensive calculations
  const cashAccounts = useMemo(() => {
    return (accounts || []).filter(account => {
      // Include CURRENT_ASSET accounts as cash accounts (most liquid)
      return account.type === 'ASSET' && account.financialCategory === 'CURRENT_ASSET';
    });
  }, [accounts]);

  const totalCash = useMemo(() => {
    return cashAccounts.reduce((sum, account) => {
      // Use cached balance if available, otherwise fall back to account.balance
      const balance = accountBalances.get(account.id) ?? Number(account.balance);
      // Safety check for NaN or invalid values
      if (isNaN(balance) || !isFinite(balance)) {
        console.warn('⚠️ Invalid balance detected in Dashboard for account:', account.name, 'balance:', balance);
        return sum;
      }
      return sum + balance;
    }, 0);
  }, [cashAccounts, accountBalances]);
  
  // console.log('Cash accounts found:', cashAccounts.length);
  // console.log('Total cash:', totalCash);

  // Memoize callback functions to prevent recreation on every render
  const formatTransactionAmount = useCallback((transaction: Transaction) => {
    const amount = Math.abs(transaction.amount);
    return formatCurrency(amount);
  }, []);

  // Helper function to safely format account balances
  const formatAccountBalance = useCallback((balance: any) => {
    const numBalance = Number(balance);
    if (isNaN(numBalance) || !isFinite(numBalance)) {
      console.warn('⚠️ Invalid account balance:', balance);
      return formatCurrency(0);
    }
    return formatCurrency(numBalance);
  }, []);

  // Helper function to check if balance is negative
  const isBalanceNegative = useCallback((balance: any) => {
    const numBalance = Number(balance);
    return !isNaN(numBalance) && isFinite(numBalance) && numBalance < 0;
  }, []);

  // Memoize callback functions to prevent recreation on every render
  const handleReload = useCallback(() => window.location.reload(), []);
  const handleGoalSelected = useCallback((suggestedGoal: any) => {
    // Add to dismissed suggestions to remove it from the list
    setDismissedSuggestions(prev => new Set(prev).add(suggestedGoal.id));
    
    // Convert suggested goal to FinancialGoal and add to goals
    const newGoal: FinancialGoal = {
      id: crypto.randomUUID(),
      type: 'INCREASE_ASSETS',
      targetAmount: suggestedGoal.targetAmount,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      progress: 0,
      // Store the original title to preserve it
      title: suggestedGoal.title
    };
    setGoals(prev => {
      const updatedGoals = [...prev, newGoal];
      return updatedGoals;
    });
    toast.success(`Added "${suggestedGoal.title}" goal!`);
  }, []);

  const handleGoalsChange = useCallback((newGoals: FinancialGoal[]) => {
    setGoals(newGoals);
  }, []);

  const handleDismissSuggestion = useCallback((suggestionId: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(suggestionId));
  }, []);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-8">
      {/* Smart Goal Suggestions Skeleton */}
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Recent Transactions Skeleton */}
      <div className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            <LoadingSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleReload}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getGreeting()}, {user?.email?.split('@')[0] || 'Business Owner'}! 👋
            </h1>
          <p className="text-gray-600">
            Here's your financial overview for today
          </p>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Cash */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cash</p>
                <p className={`text-2xl font-bold ${totalCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalCash)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Account Count */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Accounts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAccountCount(accounts.length)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recentTransactions.length} transactions
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quick Actions</p>
                <p className="text-2xl font-bold text-gray-900">3 available</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Smart Suggestions & Goals */}
          <div className="lg:col-span-2 space-y-8">
            {/* Smart Goal Suggestions */}
            <SmartGoalSuggestions
              dismissedSuggestions={dismissedSuggestions}
              onGoalSelected={handleGoalSelected}
              onDismissSuggestion={handleDismissSuggestion}
            />

            {/* Goal Tracker */}
            <GoalTrackerCard
              accounts={accounts}
              goals={goals}
              onGoalsChange={handleGoalsChange}
            />
          </div>

          {/* Right Column - Recent Transactions */}
          <div className="space-y-8">
            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
                <Link
                  to="/transactions"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  View All →
                </Link>
              </div>
              
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No recent transactions</p>
                  <Link
                    to="/transactions"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                  >
                    Create your first transaction
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className={`text-sm font-semibold ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatTransactionAmount(transaction)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Balances Summary */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Balances</h2>
              
              {accounts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No accounts found</p>
                  <Link
                    to="/accounts"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                  >
                    Create your first account
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    // Prioritize balance sheet accounts with positive balances
                    const balanceSheetAccounts = accounts.filter(account => {
                      const balance = accountBalances.get(account.id) ?? Number(account.balance);
                      return (
                        (account.type === 'ASSET' || account.type === 'LIABILITY' || account.type === 'EQUITY') &&
                        balance > 0
                      );
                    }).sort((a, b) => {
                      const balanceA = accountBalances.get(a.id) ?? Number(a.balance);
                      const balanceB = accountBalances.get(b.id) ?? Number(b.balance);
                      return balanceB - balanceA; // Sort by highest balance first
                    });

                    // Get other accounts (non-balance sheet or zero/negative balance)
                    const otherAccounts = accounts.filter(account => {
                      const balance = accountBalances.get(account.id) ?? Number(account.balance);
                      return !(
                        (account.type === 'ASSET' || account.type === 'LIABILITY' || account.type === 'EQUITY') &&
                        balance > 0
                      );
                    });

                    // Combine prioritized accounts first, then others
                    const displayAccounts = [...balanceSheetAccounts, ...otherAccounts].slice(0, 5);

                    return displayAccounts.map((account) => {
                      const balance = accountBalances.get(account.id) ?? Number(account.balance);
                      const isBalanceSheet = account.type === 'ASSET' || account.type === 'LIABILITY' || account.type === 'EQUITY';
                      const isPositiveBalance = balance > 0;
                      
                      return (
                        <div key={account.id} className={`flex items-center justify-between p-2 rounded-lg ${
                          isBalanceSheet && isPositiveBalance 
                            ? account.type === 'ASSET' 
                              ? 'bg-green-50 border border-green-100' 
                              : account.type === 'LIABILITY' 
                                ? 'bg-red-50 border border-red-100' 
                                : 'bg-purple-50 border border-purple-100'
                            : ''
                        }`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {account.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {account.type.toLowerCase()}
                            </p>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <span className={`text-sm font-semibold ${
                              isBalanceNegative(balance) ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {formatAccountBalance(balance)}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                  
                  {accounts.length > 5 && (
                    <div className="pt-3 border-t border-gray-200">
                      <Link
                        to="/accounts"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View all {accounts.length} accounts →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
