// src/pages/Predictions.tsx

import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { getPredictions } from '../api';
import { getUserFriendlyError } from '../utils/errorMessages';
import { 
  fetchTransactions, 
  fetchCategories, 
  getBudget, 
  fetchSavingsGoals,
  fetchUserSettings
} from '../api';
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  TrendingUp,
  AlertTriangle,
  Database,
  Zap
} from 'lucide-react';

const Predictions = () => {
  const [formData, setFormData] = useState<any>(null);
  const [predictions, setPredictions] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [dataSource, setDataSource] = useState<any>(null); // Keep for debugging if needed

  const predictionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (predictions && predictionRef.current) {
      predictionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [predictions]);

  // Map expense categories to prediction fields
  // Using case-insensitive matching to handle any case variations
  // Based on FastAPI/app.py model inputs - all expense categories the model needs
  const mapExpenseToPrediction = (categories: any[], transactions: any[]) => {
    // All expense categories the model needs (from FastAPI/app.py)
    const allModelCategories = [
      'Income', 'Groceries', 'Transport', 'Eating_Out', 'Entertainment', 
      'Utilities', 'Miscellaneous', 'Healthcare', 'Education', 'Insurance', 
      'Rent', 'Loan_Repayment'
    ];
    
    // Create a mapping for case-insensitive lookup
    const categoryMap: Record<string, string> = {};
    allModelCategories.forEach(cat => {
      categoryMap[cat.toLowerCase()] = cat; // Map lowercase to original case
    });
    
    const result: Record<string, number> = {};
    
    // Initialize all prediction expense fields to 0 (except Income which is handled separately)
    allModelCategories.forEach(cat => {
      if (cat !== 'Income') {
        result[cat] = 0;
      }
    });
    
    // Calculate from categories (expenses with budgets and spentAmount)
    // Match by category name (case-insensitive)
    categories.forEach(cat => {
      const categoryName = cat.name;
      const categoryNameLower = categoryName.toLowerCase();
      
      // Check if this category matches any model category (case-insensitive)
      if (categoryMap[categoryNameLower]) {
        const mappedName = categoryMap[categoryNameLower];
        if (mappedName === 'Income') {
          // Income is handled separately
          return;
        }
        result[mappedName] = (result[mappedName] || 0) + (cat.spentAmount || 0);
      }
    });

    // Also calculate from transactions (add to existing or create new)
    // Match transactions by category name (case-insensitive)
    transactions.forEach(tx => {
      const txCategory = tx.category || '';
      const txCategoryLower = txCategory.toLowerCase();
      const txAmount = Math.abs(tx.amount || 0); // Ensure positive
      
      // Check if this transaction category matches any model category (case-insensitive)
      if (categoryMap[txCategoryLower]) {
        const mappedName = categoryMap[txCategoryLower];
        if (mappedName === 'Income') {
          // Income is handled separately
          return;
        }
        result[mappedName] = (result[mappedName] || 0) + txAmount;
      }
    });

    return result;
  };

  // Fetch data from expenses and populate form
  const fetchAndPopulateData = async () => {
    try {
      setFetchingData(true);
      setError(null);
      setMissingFields([]);
      setPredictions(null);

      // Fetch all required data
      const [transactions, categories, budget, savingsGoals, userSettings] = await Promise.all([
        fetchTransactions(),
        fetchCategories(),
        getBudget(),
        fetchSavingsGoals(),
        fetchUserSettings().catch(() => null), // Optional
      ]);

      setDataSource({ transactions, categories, budget, savingsGoals, userSettings });

      // Debug: Log what we received
      console.log('Fetched categories:', categories);
      console.log('Fetched transactions:', transactions.length);
      console.log('Category names:', categories.map((c: any) => c.name));

      // Map expenses to prediction fields
      const expenseMapping = mapExpenseToPrediction(categories, transactions);
      console.log('Expense mapping result:', expenseMapping);

      // Calculate total income from categories and transactions with "Income" category (case-insensitive)
      const incomeCategories = categories.filter((cat: any) => cat.name.toLowerCase() === 'income');
      const incomeFromCategories = incomeCategories.reduce((sum: number, cat: any) => sum + (cat.spentAmount || 0), 0);
      
      const incomeTransactions = transactions.filter((tx: any) => {
        return (tx.category || '').toLowerCase() === 'income'; // Case-insensitive match
      });
      const incomeFromTransactions = incomeTransactions.reduce((sum: number, tx: any) => sum + Math.abs(tx.amount || 0), 0);
      
      // Combine income from categories and transactions
      let totalIncome = incomeFromCategories + incomeFromTransactions;
      
      // If no income found, use budget as income fallback
      if (totalIncome === 0) {
        totalIncome = budget?.monthlyBudget || 0;
      }

      const income = totalIncome;

      // Get highest savings goal for Desired_Savings
      const desiredSavings = savingsGoals.length > 0
        ? Math.max(...savingsGoals.map((g: any) => g.targetAmount || 0))
        : 0;

      // Calculate disposable income
      const totalExpenses = Object.values(expenseMapping).reduce((sum: number, val: any) => sum + (val || 0), 0);
      const disposableIncome = Math.max(0, income - totalExpenses);
      
      // Validate income is reasonable (prevent calculation errors)
      if (income > 1000000000) {
        console.warn('⚠️ WARNING: Income value seems unusually large:', income);
      }

      // Build form data from expenses
      const populatedData: any = {
        Age: userSettings?.profile?.age || 30, // Default if not available
        Income: income,
        Occupation: userSettings?.profile?.occupation || 'Professional', // Default
        City_Tier: userSettings?.profile?.cityTier || 'Tier_2', // Default
        Dependents: userSettings?.profile?.dependents || 0, // Default
        Desired_Savings: desiredSavings,
        Loan_Repayment: expenseMapping.Loan_Repayment || 0,
        Insurance: expenseMapping.Insurance || 0,
        Rent: expenseMapping.Rent || 0,
        Groceries: expenseMapping.Groceries || 0,
        Education: expenseMapping.Education || 0,
        Transport: expenseMapping.Transport || 0,
        Eating_Out: expenseMapping.Eating_Out || 0,
        Utilities: expenseMapping.Utilities || 0,
        Entertainment: expenseMapping.Entertainment || 0,
        Healthcare: expenseMapping.Healthcare || 0,
        Miscellaneous: expenseMapping.Miscellaneous || 0,
        Disposable_Income: Math.max(0, disposableIncome),
      };

      // Calculate Desired_Savings_Percentage
      populatedData.Desired_Savings_Percentage = populatedData.Income > 0
        ? (populatedData.Desired_Savings / populatedData.Income) * 100
        : 0;

      // Validate required fields based on MODEL INPUTS
      // The model requires these expense categories (from FastAPI/app.py):
      // Required for predictions: Groceries, Transport, Eating_Out, Entertainment, Utilities, Miscellaneous
      // Optional (can be 0): Healthcare, Education, Insurance, Rent, Loan_Repayment
      // 
      // Note: The model predicts savings for: Groceries, Transport, Eating_Out, Entertainment, Utilities, Miscellaneous
      // But it also needs Healthcare, Education, Insurance, Rent, Loan_Repayment as inputs (can be 0)
      
      const requiredExpenseCategories = ['Groceries', 'Transport', 'Eating_Out', 'Entertainment', 'Utilities', 'Miscellaneous'];
      const optionalExpenseCategories = ['Healthcare', 'Education', 'Insurance', 'Rent', 'Loan_Repayment'];
      
      const existingCategoryNames = categories.map((c: any) => c.name);
      const existingCategoryNamesLower = existingCategoryNames.map((n: string) => n.toLowerCase());
      
      // Check for missing REQUIRED categories (case-insensitive)
      const missingCategories = requiredExpenseCategories.filter(field => {
        const fieldLower = field.toLowerCase();
        return !existingCategoryNamesLower.includes(fieldLower);
      });

      console.log('=== PREDICTION VALIDATION DEBUG ===');
      console.log('Model requires these inputs:', ['Age', 'Income', 'Occupation', 'City_Tier', 'Dependents', 'Desired_Savings', 'Desired_Savings_Percentage', 'Disposable_Income', ...requiredExpenseCategories, ...optionalExpenseCategories]);
      console.log('Existing category names:', existingCategoryNames);
      console.log('Required expense categories:', requiredExpenseCategories);
      console.log('Optional expense categories:', optionalExpenseCategories);
      console.log('Missing required categories:', missingCategories);
      console.log('Categories data:', categories.map((c: any) => ({ name: c.name, spentAmount: c.spentAmount, budget: c.budget })));

      if (missingCategories.length > 0) {
        setMissingFields(missingCategories);
        setError(`Missing required expense categories: ${missingCategories.join(', ')}. Please create these categories on the Expenses page using the dropdown.`);
        setFormData(null);
        return;
      }

      // Also check if Income is available (either from categories, transactions, or budget)
      if (income === 0) {
        setMissingFields(['Income']);
        setError('Income is required. Please add an Income category, Income transactions, or set a monthly budget.');
        setFormData(null);
        return;
      }

      setFormData(populatedData);
      setError(null);
      setMissingFields([]);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      const friendlyError = getUserFriendlyError(err, 'Unable to load your expense data. Please try again.');
      setError(friendlyError);
      setFormData(null);
    } finally {
      setFetchingData(false);
    }
  };

  // Auto-fetch data on mount
  useEffect(() => {
    fetchAndPopulateData();
  }, []);

  // Get predictions
  const handleGetPredictions = async () => {
    if (!formData) {
      setError('No data available. Please ensure expenses are added.');
      return;
    }

    setLoading(true);
    setError(null);
    setPredictions(null);

    try {
      const payload = { ...formData };

      // Ensure all numeric fields are numbers
      Object.keys(payload).forEach(key => {
        if (typeof payload[key] === 'string' && !isNaN(Number(payload[key]))) {
          payload[key] = Number(payload[key]);
        }
      });

      // Validate payload has all required fields
      console.log('=== SENDING PREDICTION REQUEST ===');
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const res = await getPredictions(payload);
      console.log('Prediction response:', res);
      setPredictions(res.predictions);
    } catch (err: any) {
      console.error('=== PREDICTION ERROR ===');
      console.error('Error:', err);
      
      // Use user-friendly error messages
      let errorMessage = getUserFriendlyError(err, 'Unable to get predictions. Please try again.');
      
      // Special handling for FastAPI service unavailable
      if (err.response?.status === 503 || err.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Prediction service is currently unavailable. Please try again later or contact support.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cityTierLabels: Record<string, string> = {
    Tier_1: 'Major city',
    Tier_2: 'Medium-sized',
    Tier_3: 'Small',
  };

  const fieldLabels: Record<string, string> = {
    Age: 'Age',
    Income: 'Monthly Income',
    Occupation: 'Occupation',
    City_Tier: 'City Tier',
    Dependents: 'Dependents',
    Desired_Savings: 'Desired Savings',
    Loan_Repayment: 'Loan Repayment',
    Insurance: 'Insurance',
    Rent: 'Rent',
    Groceries: 'Groceries',
    Education: 'Education',
    Transport: 'Transport',
    Eating_Out: 'Eating Out',
    Utilities: 'Utilities',
    Entertainment: 'Entertainment',
    Healthcare: 'Healthcare',
    Miscellaneous: 'Miscellaneous',
    Disposable_Income: 'Disposable Income',
  };

  return (
    <Layout>
      <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600 rounded-2xl shadow-2xl p-8 md:p-12 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
            <Database className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Savings Prediction
        </h1>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Predictions are automatically generated from your expenses, transactions, and budget data
        </p>
        <button
          onClick={fetchAndPopulateData}
          disabled={fetchingData}
          className="bg-white text-blue-700 px-6 py-3 rounded-full font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-60 flex items-center gap-2 mx-auto"
        >
          {fetchingData ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading Data...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Refresh Data
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6 animate-slideIn">
          <div className="flex items-start">
            <div className="bg-red-100 p-2 rounded-full mr-4 flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-red-900 font-bold text-lg mb-2">Unable to Get Predictions</h3>
              <p className="text-red-700 mb-4">{error}</p>
              {missingFields.length > 0 && (
                <div className="mt-3 mb-4">
                  <p className="text-red-800 font-medium text-sm mb-2">Missing Required Categories:</p>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    {missingFields.map(field => (
                      <li key={field}>{fieldLabels[field] || field}</li>
                    ))}
                  </ul>
                  <p className="text-red-600 text-xs mt-2">
                    Please add expenses in these categories on the <a href="/expenses" className="underline font-semibold">Expenses page</a>
                  </p>
                </div>
              )}
              {error.includes('unavailable') && (
                <p className="text-sm text-red-600 mb-3">
                  💡 Tip: Make sure the prediction service is running. Check with your administrator.
                </p>
              )}
              <button
                onClick={() => {
                  setError(null);
                  if (formData) {
                    handleGetPredictions();
                  } else {
                    fetchAndPopulateData();
                  }
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Display - Read Only */}
      {formData && !error && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <h2 className="text-2xl font-bold text-primary-900">Prediction Data (Auto-populated)</h2>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">
              From Expenses API
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Object.entries(formData).map(([key, value]) => {
              const label = fieldLabels[key] || key.replace(/_/g, ' ');
            const isSelect = key === 'City_Tier' || key === 'Occupation';

            return (
                <div key={key} className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200">
                  <label className="block text-sm font-medium text-primary-600 mb-2">
                            {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white rounded-lg px-4 py-3 border border-primary-200">
                      <p className="text-lg font-bold text-primary-900">
                        {(() => {
                          if (isSelect) {
                            return key === 'City_Tier' 
                              ? (cityTierLabels[String(value)] || String(value))
                              : String(value);
                          }
                          if (typeof value === 'number') {
                            // Display all monetary values in dollars ($)
                            const formatted = key === 'Income' || key === 'Desired_Savings' || key.includes('Repayment') || key === 'Rent'
                              ? `$${value.toLocaleString()}`
                              : `$${value.toLocaleString()}`;
                            return key === 'Desired_Savings_Percentage' ? `${formatted}%` : formatted;
                          }
                          return String(value);
                        })()}
                      </p>
                    </div>
                    {missingFields.includes(key) && (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
              </div>
            );
          })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleGetPredictions}
              disabled={loading || !formData}
              className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Predictions...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Get Savings Predictions
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {fetchingData && !formData && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
          <Loader2 className="w-16 h-16 text-primary-500 animate-spin mb-4" />
          <p className="text-lg font-semibold text-primary-700">Loading expense data...</p>
          <p className="text-sm text-primary-600 mt-2">Fetching from expenses API</p>
        </div>
      )}

      {/* Empty State */}
      {!fetchingData && !formData && !error && (
        <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 rounded-2xl p-12 text-center border-2 border-dashed border-primary-200">
          <Database className="w-16 h-16 text-primary-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-primary-900 mb-3">No Data Available</h3>
          <p className="text-primary-600 mb-6">
            Click "Refresh Data" to load expense data from the backend
          </p>
        </div>
      )}

      {/* Predictions Display */}
        {predictions && (
          <div
            ref={predictionRef}
          className="bg-white rounded-2xl shadow-xl p-8 animate-slideIn"
          >
          <h2 className="text-4xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-600 tracking-wide">
              Predicted Potential Savings
            </h2>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
  {Object.entries(predictions).map(([key, value], idx, arr) => {
    const label = key
      .replace('Potential_Savings_', '')
      .replace(/_/g, ' ');

    const icons: Record<string, string> = {
      Groceries: '🛒',
      Transport: '🚗',
      'Eating Out': '🍽️',
      Entertainment: '🎬',
      Utilities: '💡',
      Miscellaneous: '📦',
      Total_Predicted_Savings: '💰',
    };

    const icon = icons[label] || '💵';
    const isLast = idx === arr.length - 1;

    return (
      <li
        key={key}
                  className={`bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border-l-4 ${
                    isLast ? 'border-emerald-500 col-span-2' : 'border-primary-500'
                  } shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white rounded-full p-3 shadow-sm">
                      <span className="text-3xl">{icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary-600 mb-1">{label}</p>
                      <p className="text-3xl font-bold text-primary-900">
                        ${typeof value === 'number' ? value.toLocaleString() : value}
                      </p>
                    </div>
                  </div>
      </li>
    );
  })}
</ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Predictions;
