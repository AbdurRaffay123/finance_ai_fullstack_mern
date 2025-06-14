import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
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
import { Plus, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';

const data = [
  { name: 'Jan', amount: 4000 },
  { name: 'Feb', amount: 3000 },
  { name: 'Mar', amount: 2000 },
  { name: 'Apr', amount: 2780 },
  { name: 'May', amount: 1890 },
  { name: 'Jun', amount: 2390 },
];

const expenseData = [
  { name: 'Food', value: 400 },
  { name: 'Transport', value: 300 },
  { name: 'Utilities', value: 300 },
  { name: 'Entertainment', value: 200 },
];

const COLORS = ['#059669', '#10B981', '#34D399', '#6EE7B7'];

const Dashboard = () => {
  const navigate = useNavigate(); // Create a navigate function

  const handleAddTransactionClick = () => {
    navigate('/add-transaction'); // Navigate to the Add Transaction page
  };

  const handleTransactionHistoryClick = () => {
    navigate('/transaction-history'); // Navigate to the Transaction History page
  };


  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleAddTransactionClick} // Add the onClick handler
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </button>

          {/* View Transaction History Button */}
          <button
            onClick={handleTransactionHistoryClick} // Navigate to transaction history
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            View Transaction History
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">$24,563.00</p>
            <p className="text-sm text-emerald-600 mt-1">+2.45% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Monthly Spending</h3>
              <ArrowDownRight className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">$3,242.00</p>
            <p className="text-sm text-red-600 mt-1">-4.75% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Savings Goal</h3>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">$12,000.00</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">45% of annual goal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Overview</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
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

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {expenseData.map((item, index) => (
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

export default Dashboard;
