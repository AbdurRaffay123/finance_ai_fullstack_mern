import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { checkEmail, forgotPassword } from '../api';
import { getContextualError } from '../utils/errorMessages';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [error, setError] = useState('');

  // Validate email format (including Gmail)
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if it's a Gmail address (optional - can be any valid email)
  const isGmailAccount = (email: string): boolean => {
    const gmailRegex = /^[^\s@]+@gmail\.com$/i;
    return gmailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Step 1: Validate email format
    if (!email || !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address (e.g., yourname@gmail.com).');
      return;
    }

    // Step 2: Check if email exists in database
    setCheckingEmail(true);
    try {
      const emailCheck = await checkEmail(email);
      
      if (!emailCheck.valid) {
        setError(emailCheck.message || 'Invalid email format. Please enter a valid email address.');
        setCheckingEmail(false);
        return;
      }

      if (!emailCheck.exists) {
        setError(emailCheck.message || 'No account found with this email address. Please check your email or sign up.');
        setCheckingEmail(false);
        return;
      }

      // Step 3: If email exists and is valid, proceed to send OTP
      setCheckingEmail(false);
      setLoading(true);

      const response = await forgotPassword(email);
      if (response.success) {
        setSubmitted(true);
        // Navigate to verify-otp after 2 seconds
        setTimeout(() => {
          navigate('/verify-otp', { state: { email } });
        }, 2000);
      } else {
        setError(response.message || 'Unable to send password reset email. Please try again.');
      }
    } catch (err: any) {
      const friendlyError = getContextualError(err, 'forgotPassword');
      setError(friendlyError);
    } finally {
      setLoading(false);
      setCheckingEmail(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Check your email</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We have sent a password reset link to {email}
          </p>
          <div className="mt-4 text-center">
            <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-2xl font-bold text-emerald-600 text-center mb-2">FinanceAI</h1>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset your password</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || checkingEmail}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingEmail ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Verifying email...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>

            <div className="text-sm text-center">
              <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                Return to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;