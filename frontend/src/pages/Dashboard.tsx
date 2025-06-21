// Updated Dashboard.tsx with production-quality UI/UX improvements
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchAccounts } from '../services/AccountService';
import { fetchTransactions } from '../services/TransactionService';
import { Account } from '../types/account';
import { Transaction } from '../types/transaction';
import { formatCurrency } from '../utils/formatUtils';
import { useAuth } from '../contexts/AuthContext';
import { SmartGoalSuggestions } from '../components/SmartGoalSuggestions';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // console.log('Loading dashboard data...');
        const [accountsData, transactionsData] = await Promise.all([
          fetchAccounts(),
          fetchTransactions()
        ]);
        // console.log('Accounts data:', accountsData);
        // console.log('Transactions data:', transactionsData);
        setAccounts(accountsData);
        setTransactions(transactionsData);
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
      const balance = typeof account.balance === 'number' ? account.balance : parseFloat(account.balance) || 0;
      return sum + balance;
    }, 0);
  }, [cashAccounts]);
  
  // console.log('Cash accounts found:', cashAccounts.length);
  // console.log('Total cash:', totalCash);

  const recentTransactions = useMemo(() => {
    return (transactions || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Memoize helper function to prevent recreation on every render
  const formatTransactionAmount = useCallback((transaction: Transaction) => {
    const amount = Math.abs(transaction.amount);
    return formatCurrency(amount);
  }, []);

  // Memoize callback functions to prevent recreation on every render
  const handleReload = useCallback(() => window.location.reload(), []);
  const handleGoalSelected = useCallback(() => {}, []);

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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={handleReload} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
      
      {/* Smart Goal Suggestions Section */}
      <div className="mb-12">
        <SmartGoalSuggestions
          onGoalSelected={handleGoalSelected}
          userRiskTolerance={user?.riskTolerance}
        />
      </div>
      
      {/* Financial Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Total Cash</h2>
          <p className={`text-3xl font-bold ${totalCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalCash)}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Cash & Cash Equivalents</h2>
          <div className="space-y-3">
            {cashAccounts.length > 0 ? (
              cashAccounts.map(account => (
                <div key={account.id} className="flex justify-between items-center">
                  <span className="text-base text-gray-700">{account.name}</span>
                  <span className={`text-base font-medium ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-base text-gray-500 italic">No cash accounts available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
        <h2 className="text-lg font-semibold mb-6 text-gray-900">Recent Transactions</h2>
        <div className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map(transaction => (
              <div key={transaction.id} className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-b-0">
                <div>
                  <p className="text-base font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500 mt-1">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-base font-medium ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatTransactionAmount(transaction)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-base text-gray-500 italic text-center py-8">No recent transactions to show.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
