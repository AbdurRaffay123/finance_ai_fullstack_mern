import React, { useState } from 'react';
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
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download } from 'lucide-react';

const MonthlySummary = () => {
  const [selectedMonth, setSelectedMonth] = useState('March 2024');

  const monthlyData = {
    income: 6500,
    expenses: 4200,
    savings: 2300,
    lastMonth: {
      income: 6200,
      expenses: 4500,
      savings: 1700
    }
  };

  const dailySpending = [
    { date: '1', amount: 150 },
    { date: '5', amount: 220 },
    { date: '10', amount: 180 },
    { date: '15', amount: 250 },
    { date: '20', amount: 190 },
    { date: '25', amount: 210 },
    { date: '30', amount: 160 }
  ];

  const categorySpending = [
    { name: 'Housing', amount: 1500 },
    { name: 'Food', amount: 800 },
    { name: 'Transport', amount: 400 },
    { name: 'Utilities', amount: 300 },
    { name: 'Entertainment', amount: 250 },
    { name: 'Healthcare', amount: 200 }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Summary</h1>
            <p className="text-gray-500 mt-1">Financial overview for {selectedMonth}</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option>March 2024</option>
              <option>February 2024</option>
              <option>January 2024</option>
            </select>
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <Download className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${monthlyData.income}</p>
            <p className="text-sm text-emerald-600 mt-1">
              +{((monthlyData.income - monthlyData.lastMonth.income) / monthlyData.lastMonth.income * 100).toFixed(1)}% from last month
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${monthlyData.expenses}</p>
            <p className="text-sm text-red-600 mt-1">
              -{((monthlyData.lastMonth.expenses - monthlyData.expenses) / monthlyData.lastMonth.expenses * 100).toFixed(1)}% from last month
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Net Savings</h3>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${monthlyData.savings}</p>
            <p className="text-sm text-blue-600 mt-1">
              +{((monthlyData.savings - monthlyData.lastMonth.savings) / monthlyData.lastMonth.savings * 100).toFixed(1)}% from last month
            </p>
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
      </div>
    </Layout>
  );
};

export default MonthlySummary;