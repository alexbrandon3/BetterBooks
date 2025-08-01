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
import { Link, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                {getGreeting()}, {user?.displayName || user?.email?.split('@')[0] || 'Business Owner'}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                Here's your financial overview for today
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <div className="text-sm text-gray-500">Last updated</div>
                <div className="text-sm font-medium text-gray-700">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Total Cash */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Cash</p>
                <p className={`text-3xl font-bold ${totalCash >= 0 ? 'text-green-600' : 'text-red-600'} group-hover:scale-105 transition-transform duration-200`}>
                  {formatCurrency(totalCash)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {cashAccounts.length} account{cashAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Account Count */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Total Accounts</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-200">
                  {accounts?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatAccountCount(accounts?.length || 0, 'account')}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Recent Activity</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-200">
                  {recentTransactions?.length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last 10 transactions</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Quick Actions</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-200">3</p>
                <p className="text-xs text-gray-500 mt-1">Available actions</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl group-hover:scale-110 transition-transform duration-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl mr-3 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Recent Transactions</h3>
                </div>
                <button
                  onClick={() => navigate('/transactions')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  View All
                </button>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={handleReload}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : recentTransactions && recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="group p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-200"
                      onClick={() => navigate('/transactions')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-900 transition-colors duration-200">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-sm font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount >= 0 ? '+' : ''}{formatTransactionAmount(transaction)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            {transaction.type.toLowerCase().replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-300 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <p className="text-gray-500">No recent transactions</p>
                  <p className="text-sm text-gray-400 mt-1">Start by adding your first transaction</p>
                </div>
              )}
            </div>

            {/* Account Balances */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center mb-6">
                <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl mr-3 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Account Balances</h3>
              </div>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : accounts && accounts.length > 0 ? (
                <div className="space-y-3">
                  {accounts.slice(0, 5).map((account) => {
                    const balance = accountBalances.get(account.id) ?? Number(account.balance);
                    return (
                      <div
                        key={account.id}
                        className="group p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-green-50 hover:to-emerald-50 transition-all duration-200 cursor-pointer border border-gray-200 hover:border-green-200"
                        onClick={() => navigate('/accounts')}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-green-900 transition-colors duration-200">
                              {account.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 capitalize">
                              {account.type.toLowerCase().replace('_', ' ')}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className={`text-sm font-semibold ${isBalanceNegative(balance) ? 'text-red-600' : 'text-green-600'}`}>
                              {formatAccountBalance(balance)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {account.financialCategory?.toLowerCase().replace('_', ' ') || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-gray-300 mb-3">
                    <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No accounts found</p>
                  <p className="text-xs text-gray-400 mt-1">Set up your accounts to get started</p>
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
