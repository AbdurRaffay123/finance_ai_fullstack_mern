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
        console.log('Fetched transactions:', response.data);
        // Debug: log first transaction to check if description exists
        if (response.data && response.data.length > 0) {
          console.log('Sample transaction:', response.data[0]);
          console.log('Description field:', response.data[0].description);
        }
        setTransactions(response.data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      }
    };

    fetchTransactions();
  }, []);

  // Static categories matching AddTransaction page
  const categories = ['All', 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Groceries', 'Income', 'Gifts & Donations', 'Personal Care', 'Home & Garden', 'Insurance', 'Others'];

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
    const categoryMatch = selectedCategory === 'all' || transaction.category?.toLowerCase() === selectedCategory.toLowerCase();
    
    // Search in category and description
    const categoryMatch_search = transaction.category?.toLowerCase().includes(searchLower);
    const descriptionMatch = transaction.description?.toLowerCase().includes(searchLower);

    return categoryMatch && (categoryMatch_search || descriptionMatch || searchTerm === '');
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
            <h1 className="text-2xl font-bold text-primary-900 animate-fadeIn">Transaction History</h1>
            <p className="text-primary-600 mt-1">View and manage your transactions</p>
          </div>
          <button
            onClick={handleAddTransactionClick}
            className="btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </button>
        </div>

        {/* Filters */}
        <div className="card p-4 animate-slideIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-primary-400" />
              </div>
              <input
                type="text"
                placeholder="Search transactions..."
                className="input-focus pl-10 block w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select
                className="input-focus block w-full"
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
              <thead className="bg-primary-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider cursor-pointer"
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
                    className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider"
                    style={{ minWidth: '200px' }}
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider cursor-pointer"
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-primary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-primary-900" style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                      <div className="whitespace-normal">
                        {transaction.description && transaction.description.trim() ? (
                          <span className="text-primary-900">{transaction.description}</span>
                        ) : (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {transaction.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        {transaction.amount > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-primary-500 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className={transaction.amount > 0 ? 'text-primary-600' : 'text-red-600'}>
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>
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
