import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Plus, ArrowUpRight, ArrowDownRight, Target, Loader2, AlertCircle } from 'lucide-react';
import { 
  getDashboardStats, 
  getMonthlySpending, 
  getCategoryBreakdown, 
  fetchSavingsGoals,
  fetchTransactions,
  getBudget
} from '../api';

const COLORS = ['#355070', '#6d597a', '#b56576', '#e56b6f', '#eaac8b'];

interface DashboardStats {
  totalBalance: number;
  monthlySpending: number;
  spendingChange: number;
  totalTransactions: number;
}

interface MonthlyData {
  name: string;
  amount: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface SavingsGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

interface Transaction {
  _id: string;
  amount: number;
  category: string;
  date: string;
  userId: string;
}

interface Budget {
  _id: string;
  monthlyBudget: number;
  currentMonth: string;
  createdAt: string;
  updatedAt: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, monthlyData, categoryData, goalsData, transactionsData, budgetData] = await Promise.all([
        getDashboardStats(),
        getMonthlySpending(),
        getCategoryBreakdown(),
        fetchSavingsGoals(),
        fetchTransactions(),
        getBudget()
      ]);
      
      setStats(statsData);
      setMonthlyData(monthlyData);
      setCategoryData(categoryData);
      setSavingsGoals(goalsData);
      setBudget(budgetData);
      // Get the 5 most recent transactions
      setRecentTransactions(transactionsData.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransactionClick = () => {
    navigate('/add-transaction');
  };

  const handleTransactionHistoryClick = () => {
    navigate('/transaction-history');
  };

  const handleBudgetManagementClick = () => {
    navigate('/budget-management');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getSavingsProgress = () => {
    if (savingsGoals.length === 0) return { percentage: 0, totalTarget: 0, totalCurrent: 0 };
    
    const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrent = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const percentage = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    
    return { percentage, totalTarget, totalCurrent };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2 text-primary-700">Loading dashboard...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="w-8 h-8 text-accent-500" />
          <span className="ml-2 text-accent-700">{error}</span>
          <button 
            onClick={fetchDashboardData}
            className="ml-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }


  const savingsProgress = getSavingsProgress();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-900">Dashboard</h1>
          <button 
            onClick={fetchDashboardData}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleAddTransactionClick}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </button>

          <div className="flex space-x-3">
            <button
              onClick={handleBudgetManagementClick}
              className="btn-secondary flex items-center"
            >
              <Target className="w-5 h-5 mr-2" />
              Manage Budget
            </button>
            <button
              onClick={handleTransactionHistoryClick}
              className="btn-secondary flex items-center"
            >
              View Transaction History
            </button>
          </div>
        </div>

        {/* Dashboard Content - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="card p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-primary-600">Remaining Budget</h3>
              <ArrowUpRight className="w-5 h-5 text-primary-500" />
            </div>
            <p className="text-2xl font-bold text-primary-900">
              {stats ? formatCurrency(stats.totalBalance) : '$0.00'}
            </p>
            <div className="mt-2">
              <p className="text-sm text-primary-600">
                {budget ? `of ${formatCurrency(budget.monthlyBudget)} budget` : 'No budget set'}
              </p>
              {budget && stats && (
                <div className="w-full bg-primary-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min((stats.totalBalance / budget.monthlyBudget) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-secondary-600">Monthly Spending</h3>
              {stats && stats.spendingChange < 0 ? (
                <ArrowDownRight className="w-5 h-5 text-primary-500" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-accent-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-primary-900">
              {stats ? formatCurrency(stats.monthlySpending) : '$0.00'}
            </p>
            <p className={`text-sm mt-1 ${
              stats && stats.spendingChange < 0 ? 'text-primary-600' : 'text-accent-600'
            }`}>
              {stats ? `${stats.spendingChange > 0 ? '+' : ''}${stats.spendingChange.toFixed(1)}% from last month` : 'No data'}
            </p>
          </div>

          <div className="card p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-primary-600">Savings Progress</h3>
              <Target className="w-5 h-5 text-secondary-500" />
            </div>
            <p className="text-2xl font-bold text-primary-900">
              {formatCurrency(savingsProgress.totalCurrent)}
            </p>
            <div className="w-full bg-primary-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-gradient-primary h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(savingsProgress.percentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-primary-700 mt-1">
              {savingsProgress.percentage.toFixed(1)}% of {formatCurrency(savingsProgress.totalTarget)} goal
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="card p-6 animate-slideIn">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.amount > 0 ? 'bg-primary-500' : 'bg-accent-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-primary-900">{transaction.category}</p>
                        <p className="text-xs text-primary-600">
                          {new Date(transaction.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        transaction.amount > 0 ? 'text-primary-600' : 'text-accent-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-32 text-primary-500">
                  <p>No recent transactions</p>
                </div>
              )}
            </div>
            {recentTransactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-primary-200">
                <button
                  onClick={handleTransactionHistoryClick}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all transactions →
                </button>
              </div>
            )}
          </div>

          <div className="card p-6 animate-slideIn">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Expense Categories</h3>
            <div className="h-80">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#355070"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                      contentStyle={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-primary-500">
                  <p>No category data available</p>
                </div>
              )}
            </div>
            {categoryData.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-primary-700">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Monthly Spending Chart */}
        <div className="card p-6 animate-slideIn">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Monthly Spending Trend</h3>
          <div className="h-80">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Spending']}
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#355070"
                    fill="#355070"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-primary-500">
                <p>No spending data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Savings Goals Section */}
        {savingsGoals.length > 0 && (
          <div className="card p-6 animate-slideIn">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">Active Savings Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savingsGoals.slice(0, 3).map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal._id} className="border border-primary-200 rounded-lg p-4">
                    <h4 className="font-medium text-primary-900 mb-2">{goal.name}</h4>
                    <div className="flex justify-between text-sm text-primary-700 mb-2">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span>{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="w-full bg-primary-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-secondary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-primary-600 mt-1">
                      {progress.toFixed(1)}% complete
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
