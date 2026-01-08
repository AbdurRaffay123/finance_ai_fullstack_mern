import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { DollarSign, Target, TrendingUp, Calendar, Save, Loader2, AlertCircle } from 'lucide-react';
import { getBudget, updateBudget, getBudgetHistory } from '../api';
import MonthYearPicker from '../components/MonthYearPicker';
import { useCurrency } from '../contexts/CurrencyContext';
import { useMonth } from '../contexts/MonthContext';
import CurrencyInput from '../components/CurrencyInput';

interface Budget {
  _id: string | null;
  monthlyBudget: number;
  currentMonth: string;
  createdAt: string | null;
  updatedAt: string | null;
}

const BudgetManagement = () => {
  const { formatCurrency, convertToCurrentCurrency } = useCurrency();
  const { selectedMonth, setSelectedMonth } = useMonth(); // Use global month context
  const [budget, setBudget] = useState<Budget | null>(null);
  const [budgetHistory, setBudgetHistory] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monthError, setMonthError] = useState<string | null>(null);
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    fetchBudgetData();
  }, []);

  // Fetch budget when selected month changes
  useEffect(() => {
    if (selectedMonth) {
      fetchBudgetForMonth(selectedMonth);
    }
  }, [selectedMonth]);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch current month budget and ALL months' budget history
      const [budgetData, historyData] = await Promise.all([
        getBudget(), // Current month by default (used for display)
        getBudgetHistory(50) // Fetch up to 50 months of history to show all budgets
      ]);
      
      setBudget(budgetData);
      setBudgetHistory(historyData);
      
      // Set selected month to match fetched budget
      if (budgetData?.currentMonth) {
        setSelectedMonth(budgetData.currentMonth);
      }
      
      // Convert and set budget amount for display
      if (budgetData?.monthlyBudget !== undefined && budgetData.monthlyBudget > 0) {
        const budgetInPKR = budgetData.monthlyBudget; // Assume backend returns in PKR
        setNewBudget(budgetInPKR.toString());
      } else {
        setNewBudget(''); // Empty string = show placeholder "0.00"
      }
    } catch (err: any) {
      console.error('Error fetching budget data:', err);
      setError(err.response?.data?.message || 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetForMonth = async (month: string) => {
    try {
      setError(null);
      setMonthError(null);
      
      const budgetData = await getBudget(month);
      
      setBudget(budgetData);
      
      // Convert and set budget amount for display
      if (budgetData?.monthlyBudget !== undefined && budgetData.monthlyBudget > 0) {
        const budgetInPKR = budgetData.monthlyBudget; // Assume backend returns in PKR
        setNewBudget(budgetInPKR.toString());
      } else {
        setNewBudget(''); // Empty string = show placeholder "0.00"
      }
    } catch (err: any) {
      console.error('Error fetching budget for month:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load budget for selected month';
      setMonthError(errorMessage);
      
      // If budget doesn't exist for this month, show empty state
      if (err.response?.status === 404 || !err.response) {
        setBudget({
          _id: null,
          monthlyBudget: 0,
          currentMonth: month,
          createdAt: null,
          updatedAt: null,
        });
        setNewBudget(''); // Empty string = show placeholder "0.00"
      }
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate month selection
    if (!selectedMonth) {
      setMonthError('Please select a month');
      return;
    }

    // Validate budget amount (value is in PKR from CurrencyInput)
    const budgetAmount = parseFloat(newBudget);
    if (isNaN(budgetAmount) || budgetAmount < 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMonthError(null);
      
      // Send budget with selected month
      // newBudget is already in PKR (from CurrencyInput conversion)
      const updatedBudget = await updateBudget({
        monthlyBudget: budgetAmount,
        month: selectedMonth
      });
      
      setBudget(updatedBudget);
      
      // Refresh budget history
      const historyData = await getBudgetHistory();
      setBudgetHistory(historyData);
      
      alert(`Budget for ${formatMonth(selectedMonth)} saved successfully!`);
    } catch (err: any) {
      console.error('Error updating budget:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update budget';
      setError(errorMessage);
      
      // Check if it's a month validation error
      if (err.response?.data?.field === 'month') {
        setMonthError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  // formatCurrency is now from useCurrency hook

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

        {/* Budget Card */}
        <div className="card p-6 animate-slideIn">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-primary-900">
              {budget?._id ? 'Update Monthly Budget' : 'Create Monthly Budget'}
            </h2>
            <div className="flex items-center text-primary-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span className="text-sm">{formatMonth(selectedMonth)}</span>
            </div>
          </div>
          
          {/* Display current budget for selected month */}
          {budget && budget._id && (
            <div className="flex items-center justify-between mb-6 p-4 bg-primary-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mr-4">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-900">
                    {formatCurrency(convertToCurrentCurrency(budget.monthlyBudget))}
                  </p>
                  <p className="text-sm text-primary-600">Current budget for this month</p>
                </div>
              </div>
            </div>
          )}

          {/* Budget Form */}
          <form onSubmit={handleSaveBudget} className="space-y-4">
            {/* Month/Year Picker */}
            <div>
              <MonthYearPicker
                value={selectedMonth}
                onChange={(monthYear) => {
                  setSelectedMonth(monthYear);
                  setMonthError(null);
                }}
                label="Select Month & Year"
                error={monthError}
                maxMonthsBack={24}
              />
            </div>

            {/* Budget Amount Input */}
            <div>
              <CurrencyInput
                label="Monthly Budget Amount"
                valueInPKR={newBudget ? parseFloat(newBudget) : undefined}
                onChange={(e) => setNewBudget(e.target.value)}
                containerClassName=""
                inputClassName=""
                size="md"
                error={error}
                required
                min="0"
                step="0.01"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {budget?._id ? 'Update Budget' : 'Create Budget'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Budget History - Shows ALL months' budgets */}
        <div className="card p-6 animate-slideIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary-900">Budget History</h3>
            <span className="text-xs text-primary-500">
              {budgetHistory.length} {budgetHistory.length === 1 ? 'month' : 'months'} recorded
            </span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {budgetHistory.length > 0 ? (
              budgetHistory.map((budgetItem, index) => {
                // Check if this is the current month
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear();
                const currentMonth = currentDate.getMonth() + 1;
                const [itemYear, itemMonth] = budgetItem.currentMonth.split('-').map(Number);
                const isCurrentMonth = itemYear === currentYear && itemMonth === currentMonth;
                
                return (
                  <div 
                    key={budgetItem._id || budgetItem.currentMonth} 
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      isCurrentMonth 
                        ? 'bg-primary-50 border border-primary-200' 
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        isCurrentMonth ? 'bg-primary-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-primary-900">
                          {formatMonth(budgetItem.currentMonth)}
                        </p>
                        <p className="text-xs text-primary-600">
                          {isCurrentMonth 
                            ? 'Current Month' 
                            : itemYear < currentYear || (itemYear === currentYear && itemMonth < currentMonth)
                              ? 'Past Month'
                              : 'Future Month'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary-900">
                        {formatCurrency(convertToCurrentCurrency(budgetItem.monthlyBudget))}
                      </p>
                      <p className="text-xs text-primary-600">
                        {budgetItem.updatedAt 
                          ? `Updated ${new Date(budgetItem.updatedAt).toLocaleDateString()}`
                          : budgetItem.createdAt
                            ? `Created ${new Date(budgetItem.createdAt).toLocaleDateString()}`
                            : 'No date available'
                        }
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-32 text-primary-500">
                <p>No budget history available. Create a budget to get started!</p>
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
