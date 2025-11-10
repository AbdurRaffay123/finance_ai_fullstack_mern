import React, { useEffect, useRef } from 'react';

interface CategoryModalProps {
  visible: boolean;
  categoryId: string | null;
  name: string;
  setName: (val: string) => void;
  color: string;
  setColor: (val: string) => void;
  budget: number | '';
  setBudget: (val: number | '') => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

// Prediction model required categories - must match exactly for predictions to work
// Based on FastAPI/app.py model inputs:
// Required: Groceries, Transport, Eating_Out, Entertainment, Utilities, Miscellaneous
// Optional but recommended: Income, Healthcare, Education, Insurance, Rent, Loan_Repayment
const PREDICTION_CATEGORIES = [
  'Income',
  'Groceries',
  'Transport',
  'Eating_Out',
  'Entertainment',
  'Utilities',
  'Miscellaneous',
  'Healthcare',
  'Education',
  'Insurance',
  'Rent',
  'Loan_Repayment'
];

const CategoryModal: React.FC<CategoryModalProps> = ({
  visible,
  categoryId,
  name,
  setName,
  color,
  setColor,
  budget,
  setBudget,
  onClose,
  onSubmit,
}) => {
  const categorySelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (visible) {
      categorySelectRef.current?.focus();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          {categoryId ? 'Edit Category' : 'Add New Category'}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 block mt-1 font-normal">
                Select a category required by the prediction system
              </span>
            </label>
            <select
              ref={categorySelectRef}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {PREDICTION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <p className="text-xs text-blue-600 mt-2">
              💡 These categories are linked to the prediction system. The category name will be used for AI predictions.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input
              type="color"
              className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Budget</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="0.00"
                min={0}
                step="0.01"
                value={budget !== '' ? budget : ''}
                onChange={(e) =>
                  setBudget(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700"
            >
              {categoryId ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
