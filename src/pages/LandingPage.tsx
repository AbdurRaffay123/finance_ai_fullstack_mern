import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, PieChart, Brain, Shield } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-emerald-600">FinanceAI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Smart Financial Management with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Take control of your finances with intelligent insights and personalized recommendations
          </p>
          <Link
            to="/signup"
            className="bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Get Started Free
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <FeatureCard
            icon={TrendingUp}
            title="Expense Tracking"
            description="Automatically categorize and track your spending patterns"
          />
          <FeatureCard
            icon={PieChart}
            title="Budget Planning"
            description="Set and manage budgets with visual insights"
          />
          <FeatureCard
            icon={Brain}
            title="AI Insights"
            description="Get personalized financial recommendations"
          />
          <FeatureCard
            icon={Shield}
            title="Secure Platform"
            description="Bank-grade security for your financial data"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step
              number="1"
              title="Connect Your Accounts"
              description="Securely link your financial accounts for automatic tracking"
            />
            <Step
              number="2"
              title="Set Your Goals"
              description="Define your financial goals and budgets"
            />
            <Step
              number="3"
              title="Get AI Insights"
              description="Receive personalized recommendations and insights"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-md">
    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-emerald-600" />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Step = ({ number, title, description }) => (
  <div className="text-center">
    <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
      {number}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default LandingPage;