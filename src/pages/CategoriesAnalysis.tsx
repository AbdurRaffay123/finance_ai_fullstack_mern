import React, { useState } from 'react';
import Layout from '../components/Layout';
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
import { Filter, Calendar, Download, TrendingUp, TrendingDown } from 'lucide-react';

const CategoriesAnalysis = () => {
  const [timeRange, setTimeRange] = useState('3months');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const COLORS = ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];

  const categoryData = [
    { name: 'Housing', value: 1500, percentage: 30 },
    { name: 'Food', value: 800, percentage: 16 },
    { name: 'Transport', value: 600, percentage: 12 },
    { name: 'Utilities', value: 500, percentage: 10 },
    { name: 'Entertainment', value: 400, percentage: 8 },
    { name: 'Others', value: 1200, percentage: 24 }
  ];

  const monthlyTrends = [
    { month: 'Jan', Housing: 1450, Food: 780, Transport: 580 },
    { month: 'Feb', Housing: 1500, Food: 800, Transport: 600 },
    { month: 'Mar', Housing: 1480, Food: 820, Transport: 590 }
  ];

  const categoryInsights = [
    {
      category: 'Housing',
      trend: 'up',
      percentage: '+2.3%',
      message: 'Slight increase in housing expenses'
    },
    {
      category: 'Food',
      trend: 'down',
      percentage: '-5.1%',
      message: 'Reduced spending on dining out'
    },
    {
      category: 'Transport',
      trend: 'up',
      percentage: '+1.8%',
      message: 'Higher fuel costs this month'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories Analysis</h1>
            <p className="text-gray-500 mt-1">Detailed breakdown of spending by category</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-md border-gray-300 text-sm focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <Download className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Category Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Category Insights</h2>
            <div className="space-y-4">
              {categoryInsights.map((insight, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{insight.category}</h3>
                    <p className="text-sm text-gray-500 mt-1">{insight.message}</p>
                  </div>
                  <div className="flex items-center">
                    {insight.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-red-500 mr-2" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-emerald-500 mr-2" />
                    )}
                    <span className={`text-sm font-medium ${
                      insight.trend === 'up' ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {insight.percentage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly Category Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Housing" fill="#059669" />
                <Bar dataKey="Food" fill="#10B981" />
                <Bar dataKey="Transport" fill="#34D399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoriesAnalysis;