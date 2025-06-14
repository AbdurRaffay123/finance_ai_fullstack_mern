import React from 'react';

const BudgetSetup: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Budget Setup</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Configure your budget settings here.</p>
        </div>
      </div>
    </div>
  );
};

export default BudgetSetup;