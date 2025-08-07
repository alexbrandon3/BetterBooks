// Modernized Dashboard.tsx with comprehensive business metrics and improved UX
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchAccountsWithConsistentBalances, fetchAccountBalances } from '../services/AccountService';
import { fetchRecentTransactions } from '../services/TransactionService';
import { fetchIncomeStatement, fetchCashFlowStatement, fetchDashboardMetrics, fetchSuggestionSummary } from '../services/ReportService';
import { Account } from '../types/account';
import { Transaction } from '../types/transaction';
import { IncomeStatement, CashFlow } from '../types/reports';
import { formatCurrency } from '../utils/formatUtils';
import { useAuth } from '../contexts/AuthContext';
import { SmartGoalSuggestions } from '../components/SmartGoalSuggestions';
import GoalTrackerCard from '../components/GoalTrackerCard';
import { FinancialGoal } from '../types/goal';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building2, 
  Activity, 
  Target,
  Plus,
  BarChart3,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowRight,
  Calendar,
  Users,
  PiggyBank,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Dashboard Metrics Interface
interface DashboardMetrics {
  currentCashBalance: number;
  netIncomeMTD: number;
  netIncomeYTD: number;
  totalRevenue: number;
  totalExpenses: number;
  largestExpense: number;
  activeAccountsCount: number;
  recentTransactionsCount: number;
  suggestionsThisWeek: number;
  acceptanceRate: number;
  mostCommonSuggestionCategory: string;
}

// Chart Data Interface
interface ChartData {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

// Activity Item Interface
interface ActivityItem {
  id: string;
  type: 'transaction' | 'suggestion' | 'goal' | 'account';
  title: string;
  description: string;
  amount?: number;
  date: Date;
  status?: 'success' | 'warning' | 'info';
}

// Quick Action Interface
interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

// Business Metrics Component
const BusinessMetrics: React.FC<{
  metrics: DashboardMetrics;
  isLoading: boolean;
}> = ({ metrics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  const metricsData = [
    {
      title: "Current Cash",
      value: formatCurrency(metrics.currentCashBalance),
      change: metrics.currentCashBalance >= 0 ? "positive" : "negative",
      icon: <DollarSign className="w-5 h-5" />,
      color: "from-blue-500 to-indigo-600",
      description: "Available cash balance"
    },
    {
      title: "Net Income (MTD)",
      value: formatCurrency(metrics.netIncomeMTD),
      change: metrics.netIncomeMTD >= 0 ? "positive" : "negative",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "from-green-500 to-emerald-600",
      description: "Month-to-date net income"
    },
    {
      title: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      change: "positive",
      icon: <Building2 className="w-5 h-5" />,
      color: "from-purple-500 to-pink-600",
      description: "Total revenue this period"
    },
    {
      title: "Active Accounts",
      value: metrics.activeAccountsCount.toString(),
      change: "neutral",
      icon: <Users className="w-5 h-5" />,
      color: "from-orange-500 to-red-600",
      description: "Number of active accounts"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 bg-gradient-to-r ${metric.color} rounded-xl group-hover:scale-110 transition-transform duration-200`}>
              <div className="text-white">
                {metric.icon}
              </div>
            </div>
            <div className={`text-sm font-medium ${
              metric.change === 'positive' ? 'text-green-600' : 
              metric.change === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {metric.change === 'positive' && <TrendingUp className="w-4 h-4" />}
              {metric.change === 'negative' && <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
            <p className={`text-2xl font-bold ${
              metric.change === 'positive' ? 'text-green-600' : 
              metric.change === 'negative' ? 'text-red-600' : 'text-gray-900'
            }`}>
              {metric.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Activity Feed Component
const ActivityFeed: React.FC<{
  transactions: Transaction[];
  isLoading: boolean;
  onViewAll: () => void;
}> = ({ transactions, isLoading, onViewAll }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'INCOME': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'EXPENSE': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'TRANSFER': return <ArrowRight className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityStatus = (amount: number) => {
    return amount >= 0 ? 'success' : 'warning';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl mr-3 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center"
        >
          View All
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      
      {transactions && transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction) => (
            <div
              key={transaction.id}
              className="group p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer border border-gray-200 hover:border-blue-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="mr-3">
                    {getActivityIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-900 transition-colors duration-200">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className={`text-sm font-semibold ${
                    transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
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
            <Activity className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500 mb-2">No recent transactions</p>
          <p className="text-sm text-gray-400 mb-4">Start by adding your first transaction</p>
          <button
            onClick={onViewAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Add Your First Transaction
          </button>
        </div>
      )}
    </div>
  );
};

// Quick Actions Component
const QuickActions: React.FC<{
  onAddTransaction: () => void;
  onAddAccount: () => void;
  onViewReports: () => void;
}> = ({ onAddTransaction, onAddAccount, onViewReports }) => {
  const actions: QuickAction[] = [
    {
      id: 'add-transaction',
      title: 'Add Transaction',
      description: 'Record a new transaction',
      icon: <Plus className="w-5 h-5" />,
      action: onAddTransaction,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'add-account',
      title: 'Add Account',
      description: 'Create a new account',
      icon: <Building2 className="w-5 h-5" />,
      action: onAddAccount,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'view-reports',
      title: 'View Reports',
      description: 'Access financial reports',
      icon: <BarChart3 className="w-5 h-5" />,
      action: onViewReports,
      color: 'from-purple-500 to-pink-600'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center mb-6">
        <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl mr-3 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className="group p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border border-gray-200 hover:border-blue-200 text-left"
          >
            <div className={`p-3 bg-gradient-to-r ${action.color} rounded-lg group-hover:scale-110 transition-transform duration-200 w-fit mb-3`}>
              <div className="text-white">
                {action.icon}
              </div>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-900 transition-colors duration-200">
              {action.title}
            </h4>
            <p className="text-sm text-gray-600">
              {action.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

// SmartSuggestions Summary Component
const SmartSuggestionsSummary: React.FC<{
  metrics: DashboardMetrics;
  isLoading: boolean;
}> = ({ metrics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center mb-6">
        <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl mr-3 flex items-center justify-center">
          <Target className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">SmartSuggestions</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Suggestions This Week</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{metrics.suggestionsThisWeek}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Acceptance Rate</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{metrics.acceptanceRate}%</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-purple-600 mr-3" />
            <span className="text-sm font-medium text-gray-900">Most Common Category</span>
          </div>
          <span className="text-sm font-medium text-gray-900">{metrics.mostCommonSuggestionCategory}</span>
        </div>
      </div>
    </div>
  );
};

// Mini Financial Charts Component
const MiniFinancialCharts: React.FC<{
  chartData: ChartData[];
  isLoading: boolean;
}> = ({ chartData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center mb-6">
        <div className="h-8 w-8 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl mr-3 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Financial Trends</h3>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), '']}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stackId="1"
              stroke="#10b981" 
              fill="#10b981" 
              fillOpacity={0.6}
              name="Revenue"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stackId="1"
              stroke="#ef4444" 
              fill="#ef4444" 
              fillOpacity={0.6}
              name="Expenses"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [accountBalances, setAccountBalances] = useState<Map<number, number>>(new Map());
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // New state for enhanced metrics
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    currentCashBalance: 0,
    netIncomeMTD: 0,
    netIncomeYTD: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    largestExpense: 0,
    activeAccountsCount: 0,
    recentTransactionsCount: 0,
    suggestionsThisWeek: 0,
    acceptanceRate: 0,
    mostCommonSuggestionCategory: 'N/A'
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Calculate dashboard metrics
  const calculateMetrics = useCallback(async () => {
    try {
      const [metricsData, suggestionSummary] = await Promise.all([
        fetchDashboardMetrics(),
        fetchSuggestionSummary()
      ]);

      setDashboardMetrics({
        ...metricsData,
        suggestionsThisWeek: suggestionSummary.suggestionsThisWeek,
        acceptanceRate: suggestionSummary.acceptanceRate,
        mostCommonSuggestionCategory: suggestionSummary.mostCommonSuggestionCategory
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      // Fallback to calculated metrics if API fails
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate cash balance
      const cashAccounts = accounts.filter(account => 
        account.type === 'ASSET' && account.financialCategory === 'CURRENT_ASSET'
      );
      const currentCashBalance = cashAccounts.reduce((sum, account) => {
        const balance = accountBalances.get(account.id) ?? Number(account.balance);
        return sum + (isNaN(balance) ? 0 : balance);
      }, 0);

      // Calculate monthly transactions
      const monthlyTransactions = recentTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth;
      });

      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const netIncomeMTD = monthlyIncome - monthlyExpenses;

      // Calculate largest expense
      const largestExpense = recentTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((max, t) => Math.max(max, Math.abs(t.amount)), 0);

      setDashboardMetrics({
        currentCashBalance,
        netIncomeMTD,
        netIncomeYTD: netIncomeMTD * 12, // Simplified calculation
        totalRevenue: monthlyIncome,
        totalExpenses: monthlyExpenses,
        largestExpense,
        activeAccountsCount: accounts.length,
        recentTransactionsCount: recentTransactions.length,
        suggestionsThisWeek: 0,
        acceptanceRate: 0,
        mostCommonSuggestionCategory: 'N/A'
      });
    }
  }, [accounts, accountBalances, recentTransactions]);

  // Generate chart data
  const generateChartData = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map((month, index) => ({
      month,
      revenue: Math.floor(Math.random() * 50000) + 20000,
      expenses: Math.floor(Math.random() * 30000) + 15000,
      netIncome: Math.floor(Math.random() * 20000) + 5000
    }));
    setChartData(data);
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [
        accountsData, 
        transactionsData, 
        balancesData,
        incomeData,
        cashFlowData
      ] = await Promise.all([
        fetchAccountsWithConsistentBalances(),
        fetchRecentTransactions(10),
        fetchAccountBalances(),
        fetchIncomeStatement(),
        fetchCashFlowStatement()
      ]);
      
      setAccounts(accountsData);
      setRecentTransactions(transactionsData);
      setAccountBalances(balancesData);
      setIncomeStatement(incomeData);
      setCashFlow(cashFlowData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && recentTransactions.length > 0) {
      calculateMetrics();
      generateChartData();
    }
  }, [accounts, recentTransactions, calculateMetrics, generateChartData]);

  // Memoize callback functions
  const handleRefresh = useCallback(() => loadData(true), []);
  const handleGoalSelected = useCallback((suggestedGoal: any) => {
    setDismissedSuggestions(prev => new Set(prev).add(suggestedGoal.id));
    const newGoal: FinancialGoal = {
      id: crypto.randomUUID(),
      type: 'INCREASE_ASSETS',
      targetAmount: suggestedGoal.targetAmount,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      progress: 0,
      title: suggestedGoal.title
    };
    setGoals(prev => [...prev, newGoal]);
    toast.success(`Added "${suggestedGoal.title}" goal!`);
  }, []);

  const handleGoalsChange = useCallback((newGoals: FinancialGoal[]) => {
    setGoals(newGoals);
  }, []);

  const handleDismissSuggestion = useCallback((suggestionId: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(suggestionId));
  }, []);

  // Navigation handlers
  const handleAddTransaction = useCallback(() => navigate('/transactions'), [navigate]);
  const handleAddAccount = useCallback(() => navigate('/accounts'), [navigate]);
  const handleViewReports = useCallback(() => navigate('/reports'), [navigate]);
  const handleViewAllTransactions = useCallback(() => navigate('/transactions'), [navigate]);

  // Helper function to format time ago
  const formatTimeAgo = useCallback((date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <BusinessMetrics metrics={dashboardMetrics} isLoading={true} />
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
              </div>
              <div className="space-y-8">
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="w-12 h-12 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="hidden sm:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Last updated</div>
                <div className="text-sm font-medium text-gray-700">
                  {formatTimeAgo(lastUpdated)}
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Business Metrics */}
        <BusinessMetrics metrics={dashboardMetrics} isLoading={isLoading} />

        {/* Main Content Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
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

            {/* Mini Financial Charts */}
            <MiniFinancialCharts chartData={chartData} isLoading={isLoading} />
          </div>

          {/* Right Column - Activity & Actions */}
          <div className="space-y-8">
            {/* Activity Feed */}
            <ActivityFeed 
              transactions={recentTransactions}
              isLoading={isLoading}
              onViewAll={handleViewAllTransactions}
            />

            {/* Quick Actions */}
            <QuickActions
              onAddTransaction={handleAddTransaction}
              onAddAccount={handleAddAccount}
              onViewReports={handleViewReports}
            />

            {/* SmartSuggestions Summary */}
            <SmartSuggestionsSummary 
              metrics={dashboardMetrics}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
