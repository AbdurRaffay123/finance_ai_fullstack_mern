import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Loader2, AlertCircle, Settings, RefreshCw } from 'lucide-react';
import { getCategoryBreakdown, fetchTransactions } from '../api';

interface CategoryData {
  name: string;
  value: number;
  percentage?: number;
}

interface Transaction {
  _id: string;
  amount: number;
  category: string;
  date: string;
}

interface CategoryInsight {
  category: string;
  trend: 'up' | 'down' | 'stable';
  percentage: string;
  message: string;
  currentAmount: number;
  previousAmount: number;
}

const COLORS = ['#355070', '#6d597a', '#b56576', '#e56b6f', '#eaac8b', '#8338ec', '#3a86ff', '#ff006e'];

const CategoriesAnalysis = () => {
  const navigate = useNavigate();
  const { formatCurrency, convertToCurrentCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [categoryInsights, setCategoryInsights] = useState<CategoryInsight[]>([]);
  const [topCategories, setTopCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchCategoryAnalysis();
  }, []);

  const fetchCategoryAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch category breakdown and transactions
      const [categoryBreakdown, transactions] = await Promise.all([
        getCategoryBreakdown(),
        fetchTransactions()
      ]);

      // Process category data with percentages
      const total = categoryBreakdown.reduce((sum: number, cat: CategoryData) => sum + cat.value, 0);
      const processedCategories = categoryBreakdown.map((cat: CategoryData) => ({
        ...cat,
        value: convertToCurrentCurrency(cat.value),
        percentage: total > 0 ? ((cat.value / total) * 100) : 0
      }));
      setCategoryData(processedCategories);

      // Get top 5 categories for trends
      const sortedCategories = [...processedCategories].sort((a, b) => b.value - a.value);
      const topCats = sortedCategories.slice(0, 5).map(c => c.name);
      setTopCategories(topCats);

      // Process monthly trends from transactions
      const monthlyData = processMonthlyTrends(transactions, topCats);
      setMonthlyTrends(monthlyData);

      // Generate insights by comparing current month to previous month
      const insights = generateCategoryInsights(transactions, topCats);
      setCategoryInsights(insights);

    } catch (err) {
      console.error('Error fetching category analysis:', err);
      setError('Failed to load category analysis data');
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyTrends = (transactions: Transaction[], categories: string[]) => {
    // Group transactions by month and category
    const monthlyMap: { [key: string]: { [cat: string]: number } } = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {};
      }
      
      if (categories.includes(tx.category)) {
        monthlyMap[monthKey][tx.category] = (monthlyMap[monthKey][tx.category] || 0) + tx.amount;
      }
    });

    // Convert to array format for chart
    const sortedMonths = Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month,
        ...Object.fromEntries(
          Object.entries(data).map(([cat, value]) => [cat, convertToCurrentCurrency(value)])
        )
      }))
      .slice(-6); // Last 6 months

    return sortedMonths;
  };

  const generateCategoryInsights = (transactions: Transaction[], categories: string[]): CategoryInsight[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const insights: CategoryInsight[] = [];

    categories.forEach(category => {
      // Current month spending
      const currentSpending = transactions
        .filter(tx => {
          const date = new Date(tx.date);
          return tx.category === category && 
                 date.getMonth() === currentMonth && 
                 date.getFullYear() === currentYear;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Previous month spending
      const previousSpending = transactions
        .filter(tx => {
          const date = new Date(tx.date);
          return tx.category === category && 
                 date.getMonth() === prevMonth && 
                 date.getFullYear() === prevYear;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

      // Calculate change
      let change = 0;
      if (previousSpending > 0) {
        change = ((currentSpending - previousSpending) / previousSpending) * 100;
      } else if (currentSpending > 0) {
        change = 100; // New spending this month
      }

      const trend: 'up' | 'down' | 'stable' = change > 2 ? 'up' : change < -2 ? 'down' : 'stable';
      
      let message = '';
      if (trend === 'up') {
        message = `Increased spending on ${category.toLowerCase()}`;
      } else if (trend === 'down') {
        message = `Reduced spending on ${category.toLowerCase()}`;
      } else {
        message = `Stable spending on ${category.toLowerCase()}`;
      }

      insights.push({
        category,
        trend,
        percentage: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
        message,
        currentAmount: convertToCurrentCurrency(currentSpending),
        previousAmount: convertToCurrentCurrency(previousSpending)
      });
    });

    return insights;
  };

  const handleManageCategoriesClick = () => {
    navigate('/expenses');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2 text-primary-700">Loading category analysis...</span>
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
            onClick={fetchCategoryAnalysis}
            className="ml-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 animate-fadeIn">Categories Analysis</h1>
            <p className="text-primary-600 mt-1">Detailed breakdown of spending by category</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchCategoryAnalysis}
              className="p-2 hover:bg-primary-100 rounded-md transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-primary-600" />
            </button>
            <button 
              onClick={handleManageCategoriesClick}
              className="btn-secondary flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage Categories
            </button>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6 animate-slideIn">
            <h2 className="text-lg font-semibold text-primary-900 mb-6">Category Distribution</h2>
            <div className="h-80">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage?.toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((_, index) => (
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
            
            {/* Category Legend */}
            {categoryData.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary-50">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-primary-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary-900">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6 animate-slideIn">
            <h2 className="text-lg font-semibold text-primary-900 mb-6">Category Insights</h2>
            <div className="space-y-4">
              {categoryInsights.length > 0 ? (
                categoryInsights.map((insight, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-primary-900">{insight.category}</h3>
                        <div className="flex items-center">
                          {insight.trend === 'up' ? (
                            <TrendingUp className="w-5 h-5 text-accent-500 mr-2" />
                          ) : insight.trend === 'down' ? (
                            <TrendingDown className="w-5 h-5 text-primary-500 mr-2" />
                          ) : (
                            <span className="w-5 h-5 mr-2 text-primary-400">→</span>
                          )}
                          <span className={`text-sm font-medium ${
                            insight.trend === 'up' ? 'text-accent-600' : 
                            insight.trend === 'down' ? 'text-primary-600' : 
                            'text-primary-500'
                          }`}>
                            {insight.percentage}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-primary-500 mt-1">{insight.message}</p>
                      <div className="flex justify-between text-xs text-primary-600 mt-2">
                        <span>This month: {formatCurrency(insight.currentAmount)}</span>
                        <span>Last month: {formatCurrency(insight.previousAmount)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-32 text-primary-500">
                  <p>No insight data available. Add more transactions to see trends.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="card p-6 animate-slideIn">
          <h2 className="text-lg font-semibold text-primary-900 mb-6">Monthly Category Trends</h2>
          <div className="h-80">
            {monthlyTrends.length > 0 && topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), '']}
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  {topCategories.map((cat, index) => (
                    <Bar 
                      key={cat} 
                      dataKey={cat} 
                      fill={COLORS[index % COLORS.length]} 
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-primary-500">
                <p>Not enough transaction data for monthly trends</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Card */}
        {categoryData.length > 0 && (
          <div className="card p-6 animate-slideIn">
            <h2 className="text-lg font-semibold text-primary-900 mb-4">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary-50 rounded-lg p-4 text-center">
                <p className="text-sm text-primary-600">Total Categories</p>
                <p className="text-2xl font-bold text-primary-900">{categoryData.length}</p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4 text-center">
                <p className="text-sm text-primary-600">Total Spending</p>
                <p className="text-2xl font-bold text-primary-900">
                  {formatCurrency(categoryData.reduce((sum, cat) => sum + cat.value, 0))}
                </p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4 text-center">
                <p className="text-sm text-primary-600">Top Category</p>
                <p className="text-2xl font-bold text-primary-900">
                  {categoryData.length > 0 ? 
                    [...categoryData].sort((a, b) => b.value - a.value)[0]?.name : 
                    'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CategoriesAnalysis;
