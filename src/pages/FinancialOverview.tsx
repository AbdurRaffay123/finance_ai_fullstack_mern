import React from 'react';
import Layout from '../components/Layout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from 'lucide-react';

const monthlyData = [
  { name: 'Jan', income: 5000, expenses: 3500 },
  { name: 'Feb', income: 5200, expenses: 3200 },
  { name: 'Mar', income: 5100, expenses: 3800 },
  { name: 'Apr', income: 5400, expenses: 3300 },
  { name: 'May', income: 5300, expenses: 3400 },
  { name: 'Jun', income: 5600, expenses: 3100 },
];

const expenseBreakdown = [
  { name: 'Housing', value: 1500 },
  { name: 'Transportation', value: 500 },
  { name: 'Food', value: 600 },
  { name: 'Utilities', value: 300 },
  { name: 'Entertainment', value: 200 },
];

const COLORS = ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'];

const FinancialOverview = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Monthly Income</h3>
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">$5,600.00</p>
            <p className="text-sm text-emerald-600 mt-1">+8% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Monthly Expenses</h3>
              <ArrowDownRight className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">$3,100.00</p>
            <p className="text-sm text-red-600 mt-1">-9% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Net Savings</h3>
              <Wallet className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">$2,500.00</p>
            <p className="text-sm text-blue-600 mt-1">+32% from last month</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#059669"
                    fill="#059669"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#DC2626"
                    fill="#DC2626"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {expenseBreakdown.map((item, index) => (
                <div key={item.name} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FinancialOverview;