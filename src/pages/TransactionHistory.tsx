import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../api';

const TransactionHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<string>('desc');
  const [transactions, setTransactions] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No token found');
        window.location.href = '/login';
        return;
      }
      try {
        const response = await api.get('/transactions');
        setTransactions(response.data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      }
    };

    fetchTransactions();
  }, []);

  const categories = ['All', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Income'];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const searchLower = searchTerm.toLowerCase();

    const categoryMatch = selectedCategory === 'all' || transaction.category.toLowerCase() === selectedCategory;

    const searchMatch = transaction.category.toLowerCase().includes(searchLower);

    return categoryMatch && searchMatch;
  });

  const sortedTransactions = filteredTransactions.sort((a, b) => {
    if (sortField === 'date') {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'amount') {
      return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    return 0;
  });

  const handleAddTransactionClick = () => {
    navigate('/add-transaction');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-500 mt-1">View and manage your transactions</p>
          </div>
          <button
            onClick={handleAddTransactionClick}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search transactions..."
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.toLowerCase()} value={category.toLowerCase()}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4 ml-1" aria-label="Sort Ascending" />
                        ) : (
                          <ChevronDown className="w-4 h-4 ml-1" aria-label="Sort Descending" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      Amount
                      {sortField === 'amount' && (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4 ml-1" aria-label="Sort Ascending" />
                        ) : (
                          <ChevronDown className="w-4 h-4 ml-1" aria-label="Sort Descending" />
                        )
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Payment Method
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.notes || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {transaction.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        {transaction.amount > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={transaction.amount > 0 ? 'text-emerald-600' : 'text-red-600'}>
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.paymentMethod || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.notes || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TransactionHistory;
