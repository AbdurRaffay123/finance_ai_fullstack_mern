import React, { useState } from 'react';
import Layout from '../components/Layout';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

const SpendingTrends = () => {
  const [timeRange, setTimeRange] = useState('6months');

  const monthlySpending = [
    { month: 'Oct', amount: 2400, budget: 3000 },
    { month: 'Nov', amount: 1398, budget: 3000 },
    { month: 'Dec', amount: 3200, budget: 3000 },
    { month: 'Jan', amount: 2800, budget: 3000 },
    { month: 'Feb', amount: 1908, budget: 3000 },
    { month: 'Mar', amount: 2800, budget: 3000 },
  ];

  const categoryBreakdown = [
    { name: 'Housing', value: 1200, percentage: 35 },
    { name: 'Food', value: 800, percentage: 25 },
    { name: 'Transport', value: 400, percentage: 15 },
    { name: 'Entertainment', value: 300, percentage: 10 },
    { name: 'Utilities', value: 250, percentage: 8 },
    { name: 'Others', value: 200, percentage: 7 },
  ];

  const weekdaySpending = [
    { day: 'Mon', amount: 120 },
    { day: 'Tue', amount: 85 },
    { day: 'Wed', amount: 150 },
    { day: 'Thu', amount: 95 },
    { day: 'Fri', amount: 180 },
    { day: 'Sat', amount: 210 },
    { day: 'Sun', amount: 165 },
  ];

  const COLORS = ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];

  const insights = [
    {
      title: 'Highest Spending Day',
      value: 'Saturday',
      change: '+15%',
      trend: 'up',
      description: 'Weekend activities drive higher spending'
    },
    {
      title: 'Most Expensive Category',
      value: 'Housing',
      change: '35%',
      trend: 'up',
      description: 'Of total monthly expenses'
    },
    {
      title: 'Average Daily Spend',
      value: '$143.57',
      change: '-8%',
      trend: 'down',
      description: 'Compared to last month'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Spending Trends</h1>
            <p className="text-gray-500 mt-1">Analyze your spending patterns and behaviors</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <Download className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">{insight.title}</h3>
                {insight.trend === 'up' ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{insight.value}</p>
              <div className="mt-2 flex items-center">
                <span className={`text-sm ${insight.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {insight.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">{insight.description}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Spending vs Budget */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly Spending vs Budget</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" name="Spending" fill="#059669" />
                <Bar dataKey="budget" name="Budget" fill="#D1FAE5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Spending by Category</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {categoryBreakdown.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">{category.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{category.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Spending Pattern */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Spending Pattern</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekdaySpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
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
        </div>
      </div>
    </Layout>
  );
};

export default SpendingTrends;
