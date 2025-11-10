import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Wallet,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Zap,
  ArrowRight,
  BarChart3,
  PieChart
} from 'lucide-react';
import { 
  fetchTransactions, 
  fetchCategories, 
  getBudget, 
  fetchSavingsGoals 
} from '../api';

interface UserFinancialData {
  transactions: any[];
  categories: any[];
  budget: any;
  savingsGoals: any[];
}

const AIRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [financialData, setFinancialData] = useState<UserFinancialData | null>(null);

  // Fetch all user financial data
  const fetchUserFinancialData = async () => {
    try {
      setFetchingData(true);
      const [transactions, categories, budget, savingsGoals] = await Promise.all([
        fetchTransactions(),
        fetchCategories(),
        getBudget(),
        fetchSavingsGoals(),
      ]);

      setFinancialData({
        transactions,
        categories,
        budget,
        savingsGoals,
      });

      return { transactions, categories, budget, savingsGoals };
    } catch (err) {
      console.error('Error fetching financial data:', err);
      throw err;
    } finally {
      setFetchingData(false);
    }
  };

  // Get AI recommendations
  const getRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      setRecommendations([]);

      // First fetch all user data
      const data = await fetchUserFinancialData();

      // Call backend API to get LLM recommendations
      const { getAIRecommendations } = await import('../api');
      console.log('Calling API with data:', {
        transactions: data.transactions?.length || 0,
        categories: data.categories?.length || 0,
        budget: data.budget ? 'present' : 'missing',
        savingsGoals: data.savingsGoals?.length || 0,
      });

      const result = await getAIRecommendations({
        transactions: data.transactions,
        categories: data.categories,
        budget: data.budget,
        savingsGoals: data.savingsGoals,
      });
      
      console.log('API Response:', result);
      setRecommendations(result.recommendations || []);
    } catch (err: any) {
      console.error('Error getting recommendations:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });
      setError(err.response?.data?.message || err.message || 'Failed to get recommendations. Please try again.');
      
      // Fallback: Show sample recommendations if API fails
      setRecommendations([
        '💡 Consider reducing your spending on Entertainment category by 15-20%',
        '🎯 Your savings goal of $5,000 may be challenging with your current budget. Consider extending the deadline or increasing monthly contributions.',
        '💰 Review your recurring subscriptions - cancel any unused services to save money monthly.',
        '📊 Your Groceries spending is higher than average. Try meal planning to reduce food waste and costs.',
        '🚗 Transportation costs are significant. Consider carpooling or using public transport a few days a week.',
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Get recommendation icon and color based on content
  const getRecommendationStyle = (rec: string) => {
    const lowerRec = rec.toLowerCase();
    if (lowerRec.includes('urgent') || lowerRec.includes('over budget') || lowerRec.includes('reduce')) {
      return {
        icon: AlertTriangle,
        bgColor: 'from-red-50 to-orange-50',
        borderColor: 'border-red-400',
        iconColor: 'text-red-500',
        badgeColor: 'bg-red-100 text-red-700',
        badgeText: 'Priority'
      };
    }
    if (lowerRec.includes('warning') || lowerRec.includes('near limit') || lowerRec.includes('monitor')) {
      return {
        icon: AlertCircle,
        bgColor: 'from-yellow-50 to-amber-50',
        borderColor: 'border-yellow-400',
        iconColor: 'text-yellow-500',
        badgeColor: 'bg-yellow-100 text-yellow-700',
        badgeText: 'Warning'
      };
    }
    if (lowerRec.includes('goal') || lowerRec.includes('savings') || lowerRec.includes('target')) {
      return {
        icon: Target,
        bgColor: 'from-blue-50 to-indigo-50',
        borderColor: 'border-blue-400',
        iconColor: 'text-blue-500',
        badgeColor: 'bg-blue-100 text-blue-700',
        badgeText: 'Savings'
      };
    }
    return {
      icon: Lightbulb,
      bgColor: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-400',
      iconColor: 'text-emerald-500',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      badgeText: 'Tip'
    };
  };

  useEffect(() => {
    // Optionally auto-fetch on mount
    // getRecommendations();
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Section with Action Button */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            AI-Powered Financial Advisor
          </h2>
          <p className="text-primary-100 text-center mb-8 max-w-2xl mx-auto">
            Get personalized recommendations based on your transactions, expenses, budget, and savings goals
          </p>
          <div className="flex justify-center">
            <button
              onClick={getRecommendations}
              disabled={loading || fetchingData}
              className="group relative bg-white text-primary-700 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                {loading || fetchingData ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {fetchingData ? 'Analyzing Your Data...' : 'Generating Recommendations...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get AI Recommendations
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg p-5 shadow-lg animate-slideIn">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-600 mr-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-bold text-lg mb-1">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Data Summary - Enhanced Cards */}
      {financialData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-primary-100">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-primary-100 rounded-lg p-3 group-hover:bg-primary-200 transition-colors">
                  <Wallet className="w-6 h-6 text-primary-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-primary-600 mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-primary-900">{financialData.transactions.length}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-primary-100">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-emerald-100 rounded-lg p-3 group-hover:bg-emerald-200 transition-colors">
                  <PieChart className="w-6 h-6 text-emerald-600" />
                </div>
                <DollarSign className="w-5 h-5 text-primary-500" />
              </div>
              <p className="text-sm font-medium text-primary-600 mb-1">Expense Categories</p>
              <p className="text-3xl font-bold text-primary-900">{financialData.categories.length}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-primary-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 rounded-lg p-3 group-hover:bg-blue-200 transition-colors">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-primary-600 mb-1">Monthly Budget</p>
              <p className="text-3xl font-bold text-primary-900">
                ${financialData.budget?.monthlyBudget?.toLocaleString() || '0'}
              </p>
            </div>
          </div>

          <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-primary-100">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 rounded-lg p-3 group-hover:bg-purple-200 transition-colors">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-sm font-medium text-primary-600 mb-1">Savings Goals</p>
              <p className="text-3xl font-bold text-primary-900">{financialData.savingsGoals.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Display - Enhanced */}
      {recommendations.length > 0 && (
        <div className="space-y-6 animate-slideIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl p-3 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary-900">AI Recommendations</h2>
                <p className="text-sm text-primary-600">{recommendations.length} personalized suggestions</p>
              </div>
            </div>
          </div>
          
          {/* Recommendations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((recommendation, index) => {
              const style = getRecommendationStyle(recommendation);
              const Icon = style.icon;
              
              return (
                <div
                  key={index}
                  className={`group relative bg-gradient-to-br ${style.bgColor} rounded-xl p-6 border-l-4 ${style.borderColor} shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`${style.badgeColor} text-xs font-bold px-3 py-1 rounded-full`}>
                      {style.badgeText}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex items-start gap-4 mt-2">
                    <div className={`${style.iconColor} bg-white rounded-lg p-3 shadow-sm group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-primary-900 leading-relaxed font-medium pr-12">
                        {recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Decorative element */}
                  <div className="absolute bottom-0 right-0 w-24 h-24 opacity-10">
                    <Icon className="w-full h-full" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading State */}
      {(loading || fetchingData) && recommendations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
            <Sparkles className="w-8 h-8 text-primary-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="mt-6 text-lg font-semibold text-primary-700">
            {fetchingData ? 'Analyzing your financial data...' : 'Generating personalized recommendations...'}
          </p>
          <p className="mt-2 text-sm text-primary-600">This may take a few moments</p>
        </div>
      )}

      {/* Empty State - Enhanced */}
      {!loading && !fetchingData && recommendations.length === 0 && !error && (
        <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 rounded-2xl p-12 text-center border-2 border-dashed border-primary-200">
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-primary-900 mb-3">Ready for AI Insights?</h3>
            <p className="text-primary-600 mb-6 leading-relaxed">
              Click the button above to analyze your financial data and get personalized, actionable recommendations powered by AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;
