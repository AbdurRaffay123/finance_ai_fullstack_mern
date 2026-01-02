import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Calendar, Tag, FileText } from 'lucide-react';
import api from '../api';
import Input from '../components/Input';
import CurrencyInput from '../components/CurrencyInput';

// Static list of transaction categories (independent from expenses)
const TRANSACTION_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Income',
  'Gifts & Donations',
  'Personal Care',
  'Home & Garden',
  'Insurance',
  'Others'
];

const AddTransaction = () => {
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0], // default today's date
    description: '', // Optional description field
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transaction.amount || !transaction.category) {
      alert('Please fill in both amount and category.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');

      // Prepare request data
      const requestData: any = {
        amount: parseFloat(transaction.amount),
        category: transaction.category,
        date: new Date(transaction.date), // Convert string to Date object
      };

      // Only include description if it's not empty
      if (transaction.description && transaction.description.trim().length > 0) {
        requestData.description = transaction.description.trim();
      }

      console.log('Sending transaction data:', requestData);

      const response = await api.post(
        '/transactions',
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Transaction added:', response.data);
      console.log('Description in response:', response.data.description);
      navigate('/transaction-history');
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setTransaction({
      ...transaction,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-primary-900 mb-6 animate-fadeIn">Add New Transaction</h1>

        <form onSubmit={handleSubmit} className="card p-6 space-y-6 animate-slideIn">
          <CurrencyInput
            label="Amount"
            name="amount"
            valueInPKR={parseFloat(transaction.amount) || 0}
            onChange={(e) => {
              const syntheticEvent = {
                ...e,
                target: {
                  ...e.target,
                  name: 'amount',
                },
              } as React.ChangeEvent<HTMLInputElement>;
              handleChange(syntheticEvent);
            }}
            required
            step="0.01"
            min="0"
          />

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-primary-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Tag className="h-5 w-5 text-primary-400" />
              </div>
              <select
                name="category"
                id="category"
                required
                className="input-focus block w-full pl-10 pr-10 py-2 appearance-none bg-white text-gray-900"
                value={transaction.category}
                onChange={handleChange}
                style={{ minHeight: '2.5rem' }}
              >
                <option value="">Select a category</option>
                {TRANSACTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            type="date"
            name="date"
            label="Date"
            leftIcon={Calendar}
            required
            value={transaction.date}
            onChange={handleChange}
          />

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-primary-700 mb-2">
              Description <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative rounded-md shadow-sm">
              {!transaction.description && (
                <div className="absolute top-3 left-3 pointer-events-none z-10 transition-opacity duration-200">
                  <FileText className="h-5 w-5 text-primary-400" />
                </div>
              )}
              <textarea
                name="description"
                id="description"
                rows={3}
                className={`input-focus block w-full ${transaction.description ? 'pl-3' : 'pl-11'} pr-3 py-2 transition-all duration-200 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500 focus:outline-none focus:ring-2`}
                placeholder="Add a note about this transaction..."
                value={transaction.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/transaction-history')}
              className="px-4 py-2 text-sm font-medium text-primary-700 bg-white border border-primary-300 rounded-md hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#355070] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
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
