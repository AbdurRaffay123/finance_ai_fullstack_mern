import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { DollarSign, Target, TrendingUp, Calendar, Save, Loader2, AlertCircle } from 'lucide-react';
import { getBudget, updateBudget, getBudgetHistory } from '../api';

interface Budget {
  _id: string;
  monthlyBudget: number;
  currentMonth: string;
  createdAt: string;
  updatedAt: string;
}

const BudgetManagement = () => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [budgetHistory, setBudgetHistory] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [budgetData, historyData] = await Promise.all([
        getBudget(),
        getBudgetHistory()
      ]);
      
      setBudget(budgetData);
      setBudgetHistory(historyData);
      setNewBudget(budgetData.monthlyBudget.toString());
    } catch (err) {
      console.error('Error fetching budget data:', err);
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBudget || parseFloat(newBudget) < 0) {
      alert('Please enter a valid budget amount');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const updatedBudget = await updateBudget({
        monthlyBudget: parseFloat(newBudget)
      });
      
      setBudget(updatedBudget);
      await fetchBudgetData(); // Refresh data
      alert('Budget updated successfully!');
    } catch (err) {
      console.error('Error updating budget:', err);
      setError('Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2 text-primary-700">Loading budget data...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="w-8 h-8 text-accent-500" />
          <span className="ml-2 text-accent-700">{error}</span>
          <button 
            onClick={fetchBudgetData}
            className="ml-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-900 animate-fadeIn">Budget Management</h1>
          <button 
            onClick={fetchBudgetData}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Current Budget Card */}
        <div className="card p-6 animate-slideIn">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-primary-900">Current Monthly Budget</h2>
            <div className="flex items-center text-primary-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="text-sm">{formatMonth(budget?.currentMonth || '')}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mr-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-900">
                  {budget ? formatCurrency(budget.monthlyBudget) : '$0.00'}
                </p>
                <p className="text-sm text-primary-600">Monthly spending limit</p>
              </div>
            </div>
          </div>

          {/* Update Budget Form */}
          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div>
              <label htmlFor="newBudget" className="block text-sm font-medium text-primary-700 mb-2">
                Update Monthly Budget
              </label>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-primary-400" />
                    </div>
                    <input
                      type="number"
                      id="newBudget"
                      step="0.01"
                      min="0"
                      className="input-focus block w-full pl-10 pr-3 py-2"
                      placeholder="0.00"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Update Budget'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Budget History */}
        <div className="card p-6 animate-slideIn">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Budget History</h3>
          <div className="space-y-3">
            {budgetHistory.length > 0 ? (
              budgetHistory.map((budgetItem, index) => (
                <div 
                  key={budgetItem._id} 
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0 ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-primary-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-primary-900">
                        {formatMonth(budgetItem.currentMonth)}
                      </p>
                      <p className="text-xs text-primary-600">
                        {index === 0 ? 'Current Month' : 'Previous Month'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary-900">
                      {formatCurrency(budgetItem.monthlyBudget)}
                    </p>
                    <p className="text-xs text-primary-600">
                      Updated {new Date(budgetItem.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-primary-500">
                <p>No budget history available</p>
              </div>
            )}
          </div>
        </div>

        {/* Budget Tips */}
        <div className="card p-6 animate-slideIn">
          <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Budget Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-primary-500 mt-1" />
              <div>
                <h4 className="font-medium text-primary-900">Track Your Spending</h4>
                <p className="text-sm text-primary-600">
                  Monitor your expenses regularly to stay within your budget.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Target className="w-5 h-5 text-primary-500 mt-1" />
              <div>
                <h4 className="font-medium text-primary-900">Set Realistic Goals</h4>
                <p className="text-sm text-primary-600">
                  Choose a budget that's achievable based on your income and expenses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BudgetManagement;
