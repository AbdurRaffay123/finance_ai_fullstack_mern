import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, Loader2 } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useMonth } from '../contexts/MonthContext';
import { getDashboardStats, getCategoryBreakdown, fetchTransactions, getBudget } from '../api';

const MonthlySummary = () => {
  const { formatCurrency, convertToCurrentCurrency } = useCurrency();
  const { selectedMonth, formatMonthDisplay } = useMonth();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState({
    income: 0,
    expenses: 0,
    savings: 0,
    lastMonth: {
      income: 0,
      expenses: 0,
      savings: 0
    }
  });
  const [dailySpending, setDailySpending] = useState<{ date: string; amount: number }[]>([]);
  const [categorySpending, setCategorySpending] = useState<{ name: string; amount: number }[]>([]);

  useEffect(() => {
    fetchMonthlySummary();
  }, [selectedMonth]);

  const fetchMonthlySummary = async () => {
    try {
      setLoading(true);
      
      // Calculate previous month for comparison
      const [year, month] = selectedMonth.split('-').map(Number);
      const prevMonthDate = new Date(year, month - 2, 1);
      const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

      // Fetch data for selected month and previous month
      const [currentStats, prevStats, categoryData, transactions, budget] = await Promise.all([
        getDashboardStats(selectedMonth),
        getDashboardStats(prevMonth),
        getCategoryBreakdown(selectedMonth),
        fetchTransactions(selectedMonth),
        getBudget(selectedMonth)
      ]);

      // Calculate income (positive transactions)
      const income = transactions
        .filter(tx => tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Calculate expenses (negative transactions)
      const expenses = Math.abs(transactions
        .filter(tx => tx.amount < 0)
        .reduce((sum, tx) => sum + tx.amount, 0));

      // Calculate savings
      const savings = income - expenses;

      // Calculate previous month data
      const prevIncome = prevStats.totalIncome || 0;
      const prevExpenses = Math.abs(prevStats.totalExpenses || 0);
      const prevSavings = prevIncome - prevExpenses;

      setMonthlyData({
        income,
        expenses,
        savings,
        lastMonth: {
          income: prevIncome,
          expenses: prevExpenses,
          savings: prevSavings
        }
      });

      // Process daily spending
      const dailyMap: { [key: number]: number } = {};
      transactions.forEach(tx => {
        const date = new Date(tx.date);
        const day = date.getDate();
        if (!dailyMap[day]) {
          dailyMap[day] = 0;
        }
        dailyMap[day] += Math.abs(tx.amount);
      });

      const dailyData = Object.entries(dailyMap)
        .map(([date, amount]) => ({
          date,
          amount: convertToCurrentCurrency(amount)
        }))
        .sort((a, b) => parseInt(a.date) - parseInt(b.date));

      setDailySpending(dailyData);

      // Process category spending
      const categoryDataConverted = categoryData.map(cat => ({
        name: cat.name,
        amount: convertToCurrentCurrency(cat.value)
      }));

      setCategorySpending(categoryDataConverted);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Summary</h1>
            <p className="text-gray-500 mt-1">Financial overview for {formatMonthDisplay(selectedMonth)}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <Download className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <span className="ml-2 text-primary-700">Loading monthly summary...</span>
          </div>
        )}

        {!loading && (
          <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(convertToCurrentCurrency(monthlyData.income))}</p>
            {monthlyData.lastMonth.income > 0 ? (
              <p className="text-sm text-emerald-600 mt-1">
                {monthlyData.income >= monthlyData.lastMonth.income ? '+' : ''}
                {((monthlyData.income - monthlyData.lastMonth.income) / monthlyData.lastMonth.income * 100).toFixed(1)}% from last month
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">No data for last month</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(convertToCurrentCurrency(monthlyData.expenses))}</p>
            {monthlyData.lastMonth.expenses > 0 ? (
              <p className="text-sm text-red-600 mt-1">
                {monthlyData.expenses <= monthlyData.lastMonth.expenses ? '-' : '+'}
                {Math.abs((monthlyData.lastMonth.expenses - monthlyData.expenses) / monthlyData.lastMonth.expenses * 100).toFixed(1)}% from last month
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">No data for last month</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Net Savings</h3>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(convertToCurrentCurrency(monthlyData.savings))}</p>
            {monthlyData.lastMonth.savings !== 0 ? (
              <p className="text-sm text-blue-600 mt-1">
                {monthlyData.savings >= monthlyData.lastMonth.savings ? '+' : ''}
                {((monthlyData.savings - monthlyData.lastMonth.savings) / Math.abs(monthlyData.lastMonth.savings) * 100).toFixed(1)}% from last month
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">No data for last month</p>
            )}
          </div>
        </div>

        {/* Daily Spending Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Spending Pattern</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#059669"
                  fill="#059669"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Spending Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Spending by Category</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        </>
        )}
      </div>
    </Layout>
  );
};

export default MonthlySummary;