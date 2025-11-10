import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  updateCategorySpentAmount, // Make sure this is exported from your api.js
} from '../api';
import CategoryModal from './CategoryModal'; // Adjust path if needed

interface Category {
  _id: string;
  name: string;
  color: string;
  budget: number;
  spentAmount?: number; // use spentAmount consistently
}

const ExpenseManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#059669');
  const [budget, setBudget] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for delete confirmation UI
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // New states for spent amount modal
  const [addingSpentAmountForId, setAddingSpentAmountForId] = useState<string | null>(null);
  const [spentAmountToAdd, setSpentAmountToAdd] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const clearModalFields = useCallback(() => {
    setCategoryId(null);
    setName('');
    setColor('#059669');
    setBudget('');
  }, []);

  const openAddModal = useCallback(() => {
    clearModalFields();
    setShowCategoryModal(true);
  }, [clearModalFields]);

  const openEditModal = useCallback((category: Category) => {
    setCategoryId(category._id);
    setName(category.name);
    setColor(category.color);
    setBudget(category.budget);
    setShowCategoryModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowCategoryModal(false);
    clearModalFields();
  }, [clearModalFields]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!name || !color || budget === '' || budget === null) {
        alert('Please fill all fields');
        return;
      }
      try {
        if (categoryId) {
          await updateCategory(categoryId, { name, color, budget });
        } else {
          await addCategory({ name, color, budget });
        }
        closeModal();
        loadCategories();
      } catch (err) {
        console.error('Failed to save category', err);
        alert('Failed to save category');
      }
    },
    [name, color, budget, categoryId, closeModal, loadCategories]
  );

  // Open the modal to add spent amount
  const openAddSpentAmount = (id: string) => {
    setAddingSpentAmountForId(id);
    setSpentAmountToAdd('');
  };

  const closeAddSpentAmount = () => {
    setAddingSpentAmountForId(null);
    setSpentAmountToAdd('');
  };

  const submitAddSpentAmount = async () => {
    const amountNum = Number(spentAmountToAdd);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }
    try {
      if (!addingSpentAmountForId) return;

      await updateCategorySpentAmount(addingSpentAmountForId, amountNum);
      await loadCategories();
      closeAddSpentAmount();
    } catch (error) {
      console.error('Failed to update spent amount:', error);
      alert('Failed to update spent amount');
    }
  };

  const calculateProgress = (category: Category) => {
    if (!category.spentAmount || category.spentAmount === 0) return 0;
    return Math.min(
      100,
      Math.round((category.spentAmount / (category.budget || 1)) * 100)
    );
  };

  // Updated handleDelete to use inline confirmation UI
  const confirmDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategoryToDelete(null); // close confirmation UI
      loadCategories();
    } catch (err) {
      console.error('Failed to delete category', err);
      alert('Failed to delete category');
    }
  };

  const cancelDelete = () => {
    setCategoryToDelete(null);
  };

  const renderCategoryCard = (category: Category) => {
    const spent = category.spentAmount || 0;
    const budgetVal = category.budget || 1; // avoid division by zero
    const percentUsed = ((spent / budgetVal) * 100).toFixed(0);

    return (
      <div key={category._id} className="bg-white rounded-xl shadow-sm p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-3"
              style={{ backgroundColor: category.color }}
            />
            <h3 className="font-medium text-gray-900">{category.name}</h3>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => openEditModal(category)}
              className="p-1 hover:bg-gray-100 rounded-md"
              aria-label={`Edit category ${category.name}`}
            >
              <Edit2 className="w-4 h-4 text-gray-500" />
            </button>
            {/* "+" button to add spent amount */}
            <button
              onClick={() => openAddSpentAmount(category._id)}
              className="p-1 hover:bg-gray-100 rounded-md"
              aria-label={`Add spent amount to category ${category.name}`}
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
            {/* Delete button toggles confirmation UI */}
            <button
              onClick={() => setCategoryToDelete(category._id)}
              className="p-1 hover:bg-gray-100 rounded-md"
              aria-label={`Delete category ${category.name}`}
            >
              <Trash2 className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Show confirmation UI only if this is the category to delete */}
        {categoryToDelete === category._id && (
          <div className="absolute inset-0 bg-white bg-opacity-100 flex flex-col items-center justify-center rounded-xl shadow-lg p-4 space-y-4 z-10">
            <p className="text-gray-800 font-semibold text-center">
              Are you sure you want to delete <br /> <strong>{category.name}</strong>?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => confirmDelete(category._id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add Spent Amount Modal */}
        {addingSpentAmountForId === category._id && (
          <div className="absolute inset-0 bg-white bg-opacity-100 flex flex-col items-center justify-center rounded-xl shadow-lg p-4 z-20">
            <h2 className="text-lg font-semibold mb-4">Add Spent Amount</h2>
            <input
              type="number"
              min="0"
              value={spentAmountToAdd}
              onChange={(e) => setSpentAmountToAdd(e.target.value)}
              placeholder="Enter amount spent"
              className="mb-4 rounded border border-gray-300 p-2 w-full max-w-xs"
            />
            <div className="flex space-x-4">
              <button
                onClick={submitAddSpentAmount}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Add
              </button>
              <button
                onClick={closeAddSpentAmount}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Monthly Budget</span>
              <span className="font-medium text-gray-900">${category.budget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Spent</span>
              <span className="font-medium text-gray-900">${spent.toLocaleString()}</span>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200">
                    {percentUsed}% COMPLETE
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-emerald-100">
                <div
                  style={{ width: `${percentUsed}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 animate-fadeIn">Expense Categories</h1>
            <p className="text-primary-600 mt-1">Manage your expense categories and budgets</p>
          </div>
          <button
            onClick={openAddModal}
            className="btn-primary flex items-center animate-slideIn"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </button>
        </div>

        {loading && <p>Loading categories...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(renderCategoryCard)}
        </div>

        <CategoryModal
          visible={showCategoryModal}
          categoryId={categoryId}
          name={name}
          setName={setName}
          color={color}
          setColor={setColor}
          budget={budget}
          setBudget={setBudget}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      </div>
    </Layout>
  );
};

export default ExpenseManagement;
