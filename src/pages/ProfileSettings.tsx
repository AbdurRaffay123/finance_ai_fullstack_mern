import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Globe, Check } from 'lucide-react';
import { useCurrency, SUPPORTED_CURRENCIES } from '../contexts/CurrencyContext';
import { fetchUserSettings } from '../api';

const ProfileSettings = () => {
  const { currentCurrency, setCurrency, formatCurrency, convertToCurrentCurrency } = useCurrency();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settings, setSettings] = useState({
    preferences: {
      currency: currentCurrency.code,
    },
  });

  // Get supported currencies from context
  const supportedCurrencies = Object.values(SUPPORTED_CURRENCIES);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchUserSettings();
        setSettings({
          preferences: {
            currency: data.preferences?.currency || currentCurrency.code,
          },
        });
      } catch (error) {
        console.error('Failed to load user settings', error);
      }
    };
    loadSettings();
  }, [currentCurrency.code]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        currency: value,
      },
    }));

    // Update global currency immediately
    setCurrency(value);
    
    // Show success message
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary-100 p-3 rounded-lg">
            <Globe className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900 animate-fadeIn">Currency Preferences</h1>
            <p className="text-primary-600 text-sm">Choose your preferred display currency</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-6">
            {/* Currency Description */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 How it works:</strong> All financial data is stored in PKR (Pakistani Rupee). 
                When you select a different currency, amounts are automatically converted and displayed 
                in your preferred currency across the entire application.
              </p>
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-2">
                Display Currency
              </label>
              <select
                name="currency"
                value={settings.preferences.currency}
                onChange={handleCurrencyChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg py-3 px-4"
              >
                {supportedCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Success Message */}
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg animate-fadeIn">
                <Check className="w-5 h-5" />
                <span className="font-medium">Currency updated successfully!</span>
              </div>
            )}

            {/* Current Selection Preview */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-xl border border-primary-200">
              <h4 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-3">
                Current Selection
              </h4>
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-full p-4 shadow-sm">
                  <span className="text-3xl font-bold text-primary-700">{currentCurrency.symbol}</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-primary-900">{currentCurrency.name}</p>
                  <p className="text-sm text-primary-600">
                    Code: {currentCurrency.code}
                  </p>
                </div>
              </div>
            </div>

            {/* Exchange Rate Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-primary-900 mb-3">Exchange Rates (Base: PKR)</h4>
              <div className="grid grid-cols-2 gap-3">
                {supportedCurrencies.map((currency) => (
                  <div 
                    key={currency.code}
                    className={`flex items-center justify-between p-2 rounded ${
                      currency.code === currentCurrency.code 
                        ? 'bg-primary-100 border border-primary-300' 
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <span className="font-medium text-primary-800">
                      {currency.symbol} {currency.code}
                    </span>
                    <span className="text-sm text-gray-600">
                      = {currency.rateToPKR} PKR
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-white border-2 border-dashed border-primary-300 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-primary-900 mb-3">Live Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">1,000 PKR =</span>
                  <span className="font-bold text-primary-900">{formatCurrency(convertToCurrentCurrency(1000))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">10,000 PKR =</span>
                  <span className="font-bold text-primary-900">{formatCurrency(convertToCurrentCurrency(10000))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">100,000 PKR =</span>
                  <span className="font-bold text-primary-900">{formatCurrency(convertToCurrentCurrency(100000))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfileSettings;
