import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, XCircle, AlertCircle } from 'lucide-react';
import Input from './Input';
import { changePassword } from '../api';
import { calculatePasswordStrength, getStrengthColor, getStrengthTextColor } from '../utils/passwordStrength';

interface ChangePasswordProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string | string[];
    confirmPassword?: string;
  }>({});

  // Calculate password strength in real-time
  const passwordStrength = calculatePasswordStrength(formData.newPassword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (error) setError(null);
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof fieldErrors];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    // Current password validation
    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    // New password validation
    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is same as current
    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      // Success
      setSuccess(true);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('Password change error:', err);

      // Handle API errors
      if (err.response?.data) {
        const errorData = err.response.data;

        // Set general error message
        const errorMessage = errorData.message || 'Failed to change password. Please try again.';
        setError(errorMessage);

        // Set field-specific errors if provided
        if (errorData.errors) {
          setFieldErrors(errorData.errors);
        }

        // Call error callback
        if (onError) {
          onError(errorMessage);
        }
      } else {
        const errorMessage = 'Network error. Please check your connection and try again.';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-primary-900 mb-2">Change Password</h3>
        <p className="text-sm text-gray-600">
          Update your password to keep your account secure. Use a strong password with at least 8 characters.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <Check className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">Password changed successfully!</p>
            <p className="text-green-700 text-sm mt-1">
              Your password has been updated. Please use your new password for future logins.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Current Password */}
        <Input
          type={showPasswords.current ? "text" : "password"}
          name="currentPassword"
          label="Current Password"
          leftIcon={Lock}
          rightIcon={showPasswords.current ? EyeOff : Eye}
          placeholder="Enter your current password"
          value={formData.currentPassword}
          onChange={handleChange}
          onRightIconClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
          error={!!fieldErrors.currentPassword}
          helperText={fieldErrors.currentPassword}
          required
          disabled={isLoading}
        />

        {/* New Password */}
        <div>
          <Input
            type={showPasswords.new ? "text" : "password"}
            name="newPassword"
            label="New Password"
            leftIcon={Lock}
            rightIcon={showPasswords.new ? EyeOff : Eye}
            placeholder="Enter your new password"
            value={formData.newPassword}
            onChange={handleChange}
            onRightIconClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
            error={!!fieldErrors.newPassword}
            helperText={Array.isArray(fieldErrors.newPassword) ? fieldErrors.newPassword[0] : fieldErrors.newPassword}
            required
            disabled={isLoading}
          />

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Password Strength:</span>
                <span className={`text-xs font-medium ${getStrengthTextColor(passwordStrength.strength)}`}>
                  {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.strength)}`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
              {passwordStrength.feedback.length > 0 && (
                <ul className="mt-2 text-xs text-gray-600 space-y-1">
                  {passwordStrength.feedback.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <XCircle className="w-3 h-3 mr-1 text-gray-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <Input
          type={showPasswords.confirm ? "text" : "password"}
          name="confirmPassword"
          label="Confirm New Password"
          leftIcon={Lock}
          rightIcon={showPasswords.confirm ? EyeOff : Eye}
          placeholder="Confirm your new password"
          value={formData.confirmPassword}
          onChange={handleChange}
          onRightIconClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
          error={!!fieldErrors.confirmPassword}
          helperText={fieldErrors.confirmPassword}
          required
          disabled={isLoading}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
          className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Changing Password...
            </span>
          ) : (
            'Change Password'
          )}
        </button>
      </form>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          Password Security Tips
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Use at least 8 characters with a mix of letters, numbers, and symbols</li>
          <li>• Avoid using personal information or common words</li>
          <li>• Don't reuse passwords from other accounts</li>
          <li>• Consider using a password manager</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangePassword;
