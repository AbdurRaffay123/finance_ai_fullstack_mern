import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { verifyOTP, resendOTP } from '../api';
import { getUserFriendlyError } from '../utils/errorMessages';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Clear error when user types
    if (error) setError('');
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);

    // Focus last input
    const lastInput = document.getElementById(`otp-5`);
    lastInput?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyOTP(email, otpString);
      if (response.success && response.reset_token) {
        // Navigate to reset password page with reset token
        navigate('/reset-password', {
          state: {
            email,
            resetToken: response.reset_token
          }
        });
      } else {
        setError(response.message || 'Invalid code. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = getUserFriendlyError(err, 'Invalid or expired code. Please request a new code.');
      setError(errorMessage);

      // Extract attempts left from error message if available
      const attemptsMatch = errorMessage.match(/(\d+)\s+attempt/);
      if (attemptsMatch) {
        setAttemptsLeft(parseInt(attemptsMatch[1]));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendLoading) return;

    setResendLoading(true);
    setError('');
    setAttemptsLeft(null);

    try {
      const response = await resendOTP(email);
      if (response.success) {
        setOtp(['', '', '', '', '', '']);
        setCountdown(60);
        setCanResend(false);
        // Focus first input
        const firstInput = document.getElementById('otp-0');
        firstInput?.focus();
      } else {
        setError(response.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err: any) {
      const friendlyError = getUserFriendlyError(err, 'Unable to resend code. Please try again.');
      setError(friendlyError);
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold gradient-text">
          Verify OTP
        </h2>
        <p className="mt-2 text-center text-sm text-primary-700">
          We sent a 6-digit code to <span className="font-medium">{email}</span>
        </p>
        <p className="mt-1 text-center text-xs text-primary-600">
          Check your inbox and spam folder. Code expires in 10 minutes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 sm:px-10 animate-fadeIn">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-4 text-center">
                Enter the 6-digit code
              </label>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {attemptsLeft !== null && attemptsLeft > 0 && (
              <div className="text-primary-600 text-sm text-center">
                You have {attemptsLeft} attempt(s) left.
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full btn-primary py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || resendLoading}
                className="text-sm text-primary-600 hover:text-primary-500 disabled:text-primary-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Sending...
                  </>
                ) : canResend ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Resend Code
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Resend Code ({countdown}s)
                  </>
                )}
              </button>
            </div>

            <div className="text-sm text-center">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Use a different email
              </Link>
            </div>

            <div className="text-sm text-center">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;

