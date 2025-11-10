import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  fetchSavingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  updateSavingsGoalCurrentAmount,
} from '../api';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from 'recharts';

const goalCategories = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'emergency', label: 'Emergency Fund' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'home', label: 'Home' },
  { value: 'education', label: 'Education' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'debt_payoff', label: 'Debt Payoff' },
  { value: 'other', label: 'Other' },
];

const SavingsGoal = () => {
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    category: 'vacation',
  });

  const [addingSavedAmountForId, setAddingSavedAmountForId] = useState<string | null>(null);
  const [savedAmountToAdd, setSavedAmountToAdd] = useState('');

  // New state for delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Calculate monthly progress from actual goals data
  const calculateMonthlyProgress = () => {
    if (goals.length === 0) return [];
    
    // Get last 6 months of data
    const monthlyData: { month: string; amount: number }[] = [];
    const currentDate = new Date();
    
    // Calculate total current savings across all goals
    const totalCurrentSavings = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
    
    if (totalCurrentSavings === 0) {
      // If no savings yet, show zeros for all months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData.push({ month: monthName, amount: 0 });
      }
      return monthlyData;
    }
    
    // Calculate based on when goals were created and their progress
    // Use the oldest goal's creation date as starting point
    const oldestGoal = goals.reduce((oldest, goal) => {
      const goalDate = goal.createdAt ? new Date(goal.createdAt) : new Date(goal.deadline);
      const oldestDate = oldest.createdAt ? new Date(oldest.createdAt) : new Date(oldest.deadline);
      return goalDate < oldestDate ? goal : oldest;
    }, goals[0]);
    
    const startDate = oldestGoal.createdAt ? new Date(oldestGoal.createdAt) : new Date(oldestGoal.deadline);
    const monthsSinceStart = Math.max(1, Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    // Distribute savings progress across months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Calculate how many months ago this was from the start
      const monthsAgo = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const monthsFromStart = monthsSinceStart - monthsAgo;
      
      if (monthsFromStart <= 0) {
        // Before any goals were created
        monthlyData.push({ month: monthName, amount: 0 });
      } else {
        // Estimate progress: assume linear accumulation over time
        const progressRatio = Math.min(1, monthsFromStart / monthsSinceStart);
        const estimatedAmount = Math.round(totalCurrentSavings * progressRatio);
        monthlyData.push({ month: monthName, amount: estimatedAmount });
      }
    }
    
    return monthlyData;
  };

  const monthlyProgress = calculateMonthlyProgress();

  // Calculate average monthly savings across all goals
  const averageMonthlySavings = (() => {
    const totalSaved = goals.reduce((acc, goal) => acc + goal.currentAmount, 0);
    const goalCount = goals.length;
    if (goalCount === 0) return 0;
    return totalSaved / goalCount;
  })();

  const stats = [
    {
      title: 'Total Saved',
      amount: `$${goals.reduce((acc, goal) => acc + goal.currentAmount, 0).toLocaleString()}`,
    },
    {
      title: 'Average Monthly Savings',
      amount: `$${averageMonthlySavings.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      title: 'Goals Completed',
      amount: goals.filter((g) => g.currentAmount >= g.targetAmount).length.toString(),
    },
  ];

  useEffect(() => {
    loadGoals();
  }, []);

  // Recalculate progress when goals change
  useEffect(() => {
    // This ensures the chart updates when goals are updated
    if (goals.length > 0) {
      console.log('Goals updated, recalculating progress:', goals);
    }
  }, [goals]);

  const loadGoals = async () => {
    try {
      const data = await fetchSavingsGoals();
      setGoals(data);
    } catch (error) {
      console.error('Failed to fetch savings goals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.deadline || !newGoal.category) {
      alert('Please fill all fields');
      return;
    }

    try {
      if (editingGoalId) {
        await updateSavingsGoal(editingGoalId, {
          name: newGoal.name,
          targetAmount: Number(newGoal.targetAmount),
          deadline: newGoal.deadline,
          category: newGoal.category,
        });
      } else {
        await addSavingsGoal({
          name: newGoal.name,
          targetAmount: Number(newGoal.targetAmount),
          currentAmount: 0,
          deadline: newGoal.deadline,
          category: newGoal.category,
        });
      }

      setShowNewGoalForm(false);
      setEditingGoalId(null);
      setNewGoal({ name: '', targetAmount: '', deadline: '', category: 'vacation' });
      loadGoals();
    } catch (error) {
      console.error('Failed to save savings goal:', error);
      alert('Failed to save savings goal');
    }
  };

  // Instead of direct delete, open confirmation modal
  const askDeleteConfirm = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await deleteSavingsGoal(showDeleteConfirm);
      setShowDeleteConfirm(null);
      loadGoals();
    } catch (error) {
      console.error('Failed to delete savings goal:', error);
      setShowDeleteConfirm(null);
    }
  };

  const handleEdit = (goal: any) => {
    setEditingGoalId(goal._id);
    setNewGoal({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      deadline: goal.deadline.slice(0, 10),
      category: goal.category,
    });
    setShowNewGoalForm(true);
  };

  const calculateProgress = (goal: any) => {
    if (!goal.targetAmount || goal.targetAmount === 0) return 0;
    return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  };

  const openAddSavedAmount = (goalId: string) => {
    setAddingSavedAmountForId(goalId);
    setSavedAmountToAdd('');
  };

  const closeAddSavedAmount = () => {
    setAddingSavedAmountForId(null);
    setSavedAmountToAdd('');
  };

  const submitAddSavedAmount = async () => {
    const amountNum = Number(savedAmountToAdd);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    try {
      const goal = goals.find((g) => g._id === addingSavedAmountForId);
      if (!goal) {
        alert('Goal not found');
        closeAddSavedAmount();
        return;
      }

      const newCurrentAmount = goal.currentAmount + amountNum;

      await updateSavingsGoalCurrentAmount(goal._id, newCurrentAmount);

      await loadGoals();
      closeAddSavedAmount();
    } catch (error) {
      console.error('Failed to update saved amount:', error);
      alert('Failed to update saved amount');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 animate-fadeIn">Savings Goals</h1>
            <p className="text-primary-600 mt-1">Track and manage your financial goals</p>
          </div>
          <button
            onClick={() => {
              setEditingGoalId(null);
              setNewGoal({ name: '', targetAmount: '', deadline: '', category: 'vacation' });
              setShowNewGoalForm(true);
            }}
            className="btn-primary flex items-center animate-slideIn"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Goal
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.amount}</p>
            </div>
          ))}
        </div>

        {/* Active Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <div key={goal._id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                  <p className="text-sm text-gray-500">
                    Due by {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {/* Edit button unchanged */}
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-2 hover:bg-gray-100 rounded-md"
                    aria-label={`Edit goal ${goal.name}`}
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Add saved amount button */}
                  <button
                    onClick={() => openAddSavedAmount(goal._id)}
                    className="p-2 hover:bg-gray-100 rounded-md"
                    aria-label={`Add saved amount to goal ${goal.name}`}
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Delete button opens confirmation modal */}
                  <button
                    onClick={() => askDeleteConfirm(goal._id)}
                    className="p-2 hover:bg-gray-100 rounded-md"
                    aria-label={`Delete goal ${goal.name}`}
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Saved</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${goal.currentAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Target</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${goal.targetAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200">
                      {calculateProgress(goal)}% Complete
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-emerald-100">
                  <div
                    style={{ width: `${calculateProgress(goal)}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Savings Progress</h2>
          <div className="h-80">
            {goals.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 text-lg mb-2">No savings goals yet</p>
                  <p className="text-gray-400 text-sm">Create a savings goal to see your progress over time</p>
                </div>
              </div>
            ) : monthlyProgress.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 text-lg mb-2">Calculating progress...</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyProgress} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Savings']}
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ fill: '#059669', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          {goals.length > 0 && monthlyProgress.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Total Savings: <span className="font-semibold text-gray-900">
                  ${monthlyProgress[monthlyProgress.length - 1]?.amount.toLocaleString() || 0}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* New Goal Modal */}
        {showNewGoalForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingGoalId ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Goal Name</label>
                  <input
                    type="text"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Amount</label>
                  <input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deadline</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  >
                    {goalCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewGoalForm(false);
                      setEditingGoalId(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700"
                  >
                    {editingGoalId ? 'Update Goal' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Saved Amount Modal */}
        {addingSavedAmountForId && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Saved Amount</h2>
              <input
                type="number"
                value={savedAmountToAdd}
                onChange={(e) => setSavedAmountToAdd(e.target.value)}
                placeholder="Enter amount"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 mb-4"
                min="0"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeAddSavedAmount}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAddSavedAmount}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="mb-6">Are you sure you want to delete this savings goal?</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SavingsGoal;
