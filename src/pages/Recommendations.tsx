// src/pages/Recommendations.tsx

import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';

const initialFormData = {
  Age: '',
  Income: '',
  Occupation: '',
  City_Tier: '',
  Dependents: '',
  Desired_Savings: '',
  Loan_Repayment: '',
  Insurance: '',
  Rent: '',
  Groceries: '',
  Education: '',
  Transport: '',
  Eating_Out: '',
  Utilities: '',
  Entertainment: '',
  Healthcare: '',
  Miscellaneous: '',
  Disposable_Income: '',
};

const inputOrder = [
  'Age',
  'Income',
  'Occupation',
  'City_Tier',
  'Dependents',
  'Desired_Savings',
  'Loan_Repayment',
  'Insurance',
  'Rent',
  'Groceries',
  'Education',
  'Transport',
  'Eating_Out',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Miscellaneous',
  'Disposable_Income',
];

const cityTierLabels: Record<string, string> = {
  Tier_1: 'Major city',
  Tier_2: 'Medium-sized',
  Tier_3: 'Small',
};

const numericFields = [
  'Age',
  'Income',
  'Dependents',
  'Desired_Savings',
  'Loan_Repayment',
  'Insurance',
  'Rent',
  'Groceries',
  'Education',
  'Transport',
  'Eating_Out',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Miscellaneous',
  'Disposable_Income',
];

const Recommendations = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [predictions, setPredictions] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (predictions && predictionRef.current) {
      predictionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [predictions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPredictions(null);

    try {
      const payload = { ...formData };

      numericFields.forEach(field => {
        const val = formData[field];
        payload[field] = val === '' ? 0 : Number(val);
      });

      payload.Desired_Savings_Percentage =
        payload.Income > 0 ? (payload.Desired_Savings / payload.Income) * 100 : 0;

      const res = await api.post('/predict', payload);
      setPredictions(res.data.predictions);
    } catch (err) {
      setError('Failed to fetch predictions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation-name: fadeInUp;
          animation-fill-mode: both;
          animation-duration: 600ms;
          animation-timing-function: ease-out;
        }
        /* Floating label effect */
        .input-container {
          position: relative;
          margin-top: 1.5rem;
        }
        .input-container input,
        .input-container select {
          width: 100%;
          padding: 1.25rem 0.75rem 0.5rem 0.75rem;
          border: 2px solid #d1fae5; /* Tailwind emerald-200 */
          border-radius: 0.5rem;
          background: #f0fdf4; /* Tailwind emerald-50 */
          transition: border-color 0.3s ease;
          font-weight: 600;
          color: #065f46; /* Tailwind emerald-800 */
        }
        .input-container input:focus,
        .input-container select:focus {
          outline: none;
          border-color: #10b981; /* Tailwind emerald-500 */
          background: white;
          box-shadow: 0 0 10px #6ee7b7;
        }
        .input-container label {
          position: absolute;
          left: 0.75rem;
          top: 1.25rem;
          font-size: 1rem;
          color: #16a34a; /* emerald-600 */
          font-weight: 700;
          pointer-events: none;
          transition: all 0.3s ease;
          background: transparent;
        }
        .input-container input:focus + label,
        .input-container input:not(:placeholder-shown) + label,
        .input-container select:focus + label,
        .input-container select:not([value=""]) + label {
          top: 0.25rem;
          font-size: 0.75rem;
          color: #059669; /* emerald-600 */
          background: white;
          padding: 0 0.25rem;
          border-radius: 0.25rem;
        }
        /* Button styles */
        button.primary-btn {
          background: linear-gradient(90deg, #059669, #10b981);
          padding: 0.75rem 3rem;
          font-weight: 700;
          font-size: 1.1rem;
          border-radius: 9999px;
          color: white;
          box-shadow: 0 8px 15px rgba(16, 185, 129, 0.4);
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          user-select: none;
        }
        button.primary-btn:hover {
          background: linear-gradient(90deg, #10b981, #059669);
          box-shadow: 0 12px 20px rgba(16, 185, 129, 0.6);
          transform: translateY(-3px);
        }
        button.primary-btn:disabled {
          background: #6ee7b7;
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }
        /* Prediction cards */
        .prediction-card {
          background: #d1fae5; /* emerald-200 */
          border-radius: 1rem;
          padding: 1.5rem 2rem;
          box-shadow: 0 8px 15px rgba(6, 95, 70, 0.15);
          transition: box-shadow 0.3s ease;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          cursor: default;
        }
        .prediction-card:hover {
          box-shadow: 0 12px 25px rgba(6, 95, 70, 0.3);
          transform: translateY(-5px);
        }
        .prediction-icon {
          font-size: 3rem;
          background: linear-gradient(135deg, #34d399, #059669);
          color: white;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 12px rgba(6, 95, 70, 0.3);
          user-select: none;
        }
        .prediction-label {
          font-weight: 700;
          font-size: 1.125rem;
          color: #065f46;
          text-transform: capitalize;
        }
        .prediction-value {
          font-weight: 900;
          font-size: 1.5rem;
          color: #047857;
          margin-left: auto;
          user-select: text;
        }
      `}</style>

      <div className="max-w-5xl mx-auto p-8 bg-white rounded-3xl shadow-2xl">
        <h1 className="text-4xl font-extrabold mb-10 text-center text-emerald-700 tracking-wide">
          Savings Prediction Form
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8"
          noValidate
        >
          {inputOrder.map(key => {
            const val = formData[key];
            const isSelect = key === 'City_Tier' || key === 'Occupation';

            return (
              <div key={key} className="input-container">
                {isSelect ? (
                  <select
                    id={key}
                    name={key}
                    value={val}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      {key === 'City_Tier' ? 'Select city tier' : 'Select occupation'}
                    </option>
                    {key === 'City_Tier'
                      ? Object.entries(cityTierLabels).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))
                      : ['Professional', 'Clerical', 'Skilled', 'Unskilled'].map(o => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    id={key}
                    name={key}
                    value={val}
                    onChange={handleChange}
                    placeholder=" "
                    min="0"
                    required
                  />
                )}
                <label htmlFor={key}>
                  {key === 'City_Tier' ? 'City Tier' : key.replaceAll('_', ' ')}
                </label>
              </div>
            );
          })}

          <div className="col-span-1 md:col-span-2 flex justify-center mt-6">
            <button className="primary-btn" disabled={loading}>
              {loading ? 'Predicting...' : 'Predict Savings'}
            </button>
          </div>
        </form>

        {error && (
          <p className="text-red-600 mt-8 text-center font-semibold text-lg">{error}</p>
        )}

        {predictions && (
          <div
            ref={predictionRef}
            className="mt-12 max-w-4xl mx-auto animate-fadeInUp"
          >
            <h2 className="text-4xl font-extrabold mb-8 text-center bg-clip-text text-transparent
                           bg-gradient-to-r from-emerald-400 to-teal-600 tracking-wide">
              Predicted Potential Savings
            </h2>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-8">
  {Object.entries(predictions).map(([key, value], idx, arr) => {
    const label = key
      .replace('Potential_Savings_', '')
      .replaceAll('_', ' ');

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

    // Check if this is the last item
    const isLast = idx === arr.length - 1;

    return (
      <li
        key={key}
        className={`prediction-card ${isLast ? 'col-span-2' : ''}`}
      >
        <div className="prediction-icon">{icon}</div>
        <p className="prediction-label">{label}</p>
        <p className="prediction-value">{value.toLocaleString()} Rs.</p>
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

export default Recommendations;
