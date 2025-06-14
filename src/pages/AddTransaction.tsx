import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Calendar, DollarSign, Tag } from 'lucide-react';
import api from '../api';

const AddTransaction = () => {
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0], // default today's date
  });

  const categories = [
    'Food',
    'Transport',
    'Utilities',
    'Rent',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Others',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transaction.amount || !transaction.category) {
      alert('Please fill in both amount and category.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');

      const response = await api.post(
        '/transactions',
        {
          amount: parseFloat(transaction.amount),
          category: transaction.category,
          date: transaction.date,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Transaction added:', response.data);
      navigate('/transaction-history');
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTransaction({
      ...transaction,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Transaction</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                name="amount"
                id="amount"
                required
                step="0.01"
                min="0"
                className="block w-full pl-10 pr-3 py-2 rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0.00"
                value={transaction.amount}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-gray-400" />
              </div>
              <select
                name="category"
                id="category"
                required
                className="block w-full pl-10 pr-3 py-2 rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                value={transaction.category}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                name="date"
                id="date"
                required
                className="block w-full pl-10 pr-3 py-2 rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                value={transaction.date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/transaction-history')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddTransaction;
