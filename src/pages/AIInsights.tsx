import React, { useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import AIRecommendations from './AIRecommendations';
import Predictions from './Predictions';

const AIInsights = () => {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'predictions'>('recommendations');

  return (
    <Layout>
      <div className="space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-900 mb-2 animate-fadeIn">AI Insights</h1>
            <p className="text-primary-600">Get intelligent financial recommendations and predictions</p>
          </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-primary-100 p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex items-center px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'recommendations'
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'text-primary-700 hover:text-primary-900'
              }`}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Recommendations
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`flex items-center px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'predictions'
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'text-primary-700 hover:text-primary-900'
              }`}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Predictions
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-slideIn">
          {activeTab === 'recommendations' ? <AIRecommendations /> : <Predictions />}
        </div>
      </div>
    </Layout>
  );
};

export default AIInsights;

