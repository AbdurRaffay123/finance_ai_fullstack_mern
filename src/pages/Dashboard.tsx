import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useCurrency } from '../contexts/CurrencyContext';
import { useMonth } from '../contexts/MonthContext';
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
import { Plus, ArrowUpRight, ArrowDownRight, Target, Loader2, AlertCircle, Settings } from 'lucide-react';
import {
  getDashboardStats,
  getMonthlySpending,
  getCategoryBreakdown,
  fetchSavingsGoals,
  fetchTransactions,
  getBudget,
  fetchCategories
} from '../api';

const COLORS = ['#355070', '#6d597a', '#b56576', '#e56b6f', '#eaac8b', '#8338ec', '#3a86ff', '#ff006e', '#fb5607', '#ffbe0b', '#06d6a0', '#118ab2'];

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

interface ExpenseCategory {
  _id: string;
  name: string;
  color: string;
  budget: number;
  spentAmount?: number;
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
  const { formatCurrency, convertToCurrentCurrency } = useCurrency();
  const { selectedMonth } = useMonth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);

  // Converted data for currency display
  const [convertedStats, setConvertedStats] = useState<DashboardStats | null>(null);
  const [convertedMonthlyData, setConvertedMonthlyData] = useState<MonthlyData[]>([]);
  const [convertedCategoryData, setConvertedCategoryData] = useState<CategoryData[]>([]);
  const [convertedSavingsGoals, setConvertedSavingsGoals] = useState<SavingsGoal[]>([]);
  const [convertedRecentTransactions, setConvertedRecentTransactions] = useState<Transaction[]>([]);
  const [convertedBudget, setConvertedBudget] = useState<Budget | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]); // Refetch when month changes

  // Convert amounts to current currency when data or currency changes
  useEffect(() => {
    if (stats) {
      setConvertedStats({
        ...stats,
        totalBalance: convertToCurrentCurrency(stats.totalBalance),
        monthlySpending: convertToCurrentCurrency(stats.monthlySpending),
      });
    }

    if (monthlyData.length > 0) {
      setConvertedMonthlyData(
        monthlyData.map(item => ({
          ...item,
          amount: convertToCurrentCurrency(item.amount),
        }))
      );
    }

    if (categoryData.length > 0) {
      setConvertedCategoryData(
        categoryData.map(item => ({
          ...item,
          value: convertToCurrentCurrency(item.value),
        }))
      );
    }

    if (savingsGoals.length > 0) {
      setConvertedSavingsGoals(
        savingsGoals.map(goal => ({
          ...goal,
          targetAmount: convertToCurrentCurrency(goal.targetAmount),
          currentAmount: convertToCurrentCurrency(goal.currentAmount),
        }))
      );
    }

    if (recentTransactions.length > 0) {
      setConvertedRecentTransactions(
        recentTransactions.map(tx => ({
          ...tx,
          amount: convertToCurrentCurrency(tx.amount),
        }))
      );
    }

    if (budget) {
      setConvertedBudget({
        ...budget,
        monthlyBudget: convertToCurrentCurrency(budget.monthlyBudget),
      });
    }
  }, [stats, monthlyData, categoryData, savingsGoals, recentTransactions, budget, convertToCurrentCurrency]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data for selected month
      const [statsData, monthlyData, transactionCategoryData, goalsData, transactionsData, budgetData, categoriesData] = await Promise.all([
        getDashboardStats(selectedMonth),
        getMonthlySpending(),
        getCategoryBreakdown(selectedMonth),
        fetchSavingsGoals(selectedMonth), // Filter by selected month
        fetchTransactions(selectedMonth),
        getBudget(selectedMonth), // Budget for selected month
        fetchCategories(selectedMonth) // Fetch categories for selected month
      ]);
      
      setStats(statsData);
      setMonthlyData(monthlyData);
      setSavingsGoals(goalsData);
      setBudget(budgetData);
      // Get the 5 most recent transactions
      setRecentTransactions(transactionsData.slice(0, 5));
      
      // Use categories with spentAmount for pie chart if available
      // This shows data from ExpenseManagement page
      // Fall back to transaction-based data if categories are empty
      if (categoriesData && categoriesData.length > 0) {
        // Convert categories to CategoryData format using spentAmount
        const categoryDataFromCategories: CategoryData[] = categoriesData
          .filter((cat: ExpenseCategory) => cat.spentAmount && cat.spentAmount > 0)
          .map((cat: ExpenseCategory) => ({
            name: cat.name,
            value: cat.spentAmount || 0
          }));
        
        // Use category data if it has spending, otherwise use transaction data
        if (categoryDataFromCategories.length > 0) {
          setCategoryData(categoryDataFromCategories);
        } else if (transactionCategoryData && transactionCategoryData.length > 0) {
          setCategoryData(transactionCategoryData);
        } else {
          // If both are empty, show categories with budget as placeholder
          const categoryDataWithBudget: CategoryData[] = categoriesData
            .slice(0, 8) // Limit to 8 categories
            .map((cat: ExpenseCategory) => ({
              name: cat.name,
              value: cat.spentAmount || 0
            }));
          setCategoryData(categoryDataWithBudget);
        }
      } else {
        setCategoryData(transactionCategoryData);
      }
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

  const handleManageCategoriesClick = () => {
    navigate('/expenses');
  };

  // Currency formatting is now handled by useCurrency hook

  const getSavingsProgress = () => {
    if (convertedSavingsGoals.length === 0) return { percentage: 0, totalTarget: 0, totalCurrent: 0 };

    const totalTarget = convertedSavingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrent = convertedSavingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
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
              {convertedStats ? formatCurrency(convertedStats.totalBalance) : '$0.00'}
            </p>
            <div className="mt-2">
              <p className="text-sm text-primary-600">
                {convertedBudget ? `of ${formatCurrency(convertedBudget.monthlyBudget)} budget` : 'No budget set'}
              </p>
              {budget && stats && (
                <div className="w-full bg-primary-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${convertedStats && convertedBudget ? Math.min((convertedStats.totalBalance / convertedBudget.monthlyBudget) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-secondary-600">Monthly Spending</h3>
              {convertedStats && convertedStats.spendingChange < 0 ? (
                <ArrowDownRight className="w-5 h-5 text-primary-500" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-accent-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-primary-900">
              {convertedStats ? formatCurrency(convertedStats.monthlySpending) : '$0.00'}
            </p>
            <p className={`text-sm mt-1 ${
              convertedStats && convertedStats.spendingChange < 0 ? 'text-primary-600' : 'text-accent-600'
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-primary-900">Expense Categories</h3>
              <button
                onClick={handleManageCategoriesClick}
                className="text-primary-600 hover:text-primary-700 p-1 rounded-full hover:bg-primary-100 transition-colors"
                title="Manage Categories"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
            <div className="h-64">
              {convertedCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={convertedCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      fill="#355070"
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {convertedCategoryData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        />
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
                <div className="flex flex-col items-center justify-center h-full text-primary-500">
                  <p className="mb-3">No category data available</p>
                  <button 
                    onClick={handleManageCategoriesClick}
                    className="btn-secondary text-sm"
                  >
                    Add Categories
                  </button>
                </div>
              )}
            </div>
            
            {/* Category Legend with Amounts */}
            {convertedCategoryData.length > 0 && (
              <>
                <div className="border-t border-primary-200 mt-4 pt-4">
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {convertedCategoryData.map((item, index) => {
                      const total = convertedCategoryData.reduce((sum, cat) => sum + cat.value, 0);
                      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                      return (
                        <div 
                          key={item.name} 
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer"
                          onClick={handleManageCategoriesClick}
                        >
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <span className="text-sm font-medium text-primary-800">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-primary-900">{formatCurrency(item.value)}</span>
                            <span className="text-xs text-primary-500 ml-2">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Total and Action Button */}
                <div className="border-t border-primary-200 mt-3 pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-primary-700">Total Spending</span>
                    <span className="text-lg font-bold text-primary-900">
                      {formatCurrency(convertedCategoryData.reduce((sum, cat) => sum + cat.value, 0))}
                    </span>
                  </div>
                  <button
                    onClick={handleManageCategoriesClick}
                    className="w-full btn-secondary flex items-center justify-center text-sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Categories
                  </button>
                </div>
              </>
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
