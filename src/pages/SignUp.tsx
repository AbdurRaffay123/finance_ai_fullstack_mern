import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Input from '../components/Input';
import api from '../api';
import { getContextualError } from '../utils/errorMessages';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    try {
      // Send sign-up request to backend
      const response = await api.post('/auth/signup', {
        email: formData.email,
        password: formData.password,
      });

      // Save JWT token in localStorage upon successful sign-up
      localStorage.setItem('authToken', response.data.token);
      console.log('User signed up successfully');
      navigate('/dashboard');  // Redirect after successful sign-up
    } catch (error: any) {
      console.error('Error signing up:', error);
      const friendlyError = getContextualError(error, 'signup');
      setErrorMessage(friendlyError);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold gradient-text">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-primary-700">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 sm:px-10 animate-fadeIn">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Form fields */}
            <Input
              type="text"
              name="name"
              label="Full Name"
              leftIcon={User}
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />

            {/* Email */}
            <Input
              type="email"
              name="email"
              label="Email address"
              leftIcon={Mail}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            {/* Password */}
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              label="Password"
              leftIcon={Lock}
              rightIcon={showPassword ? EyeOff : Eye}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              onRightIconClick={() => setShowPassword(!showPassword)}
              required
            />

            {/* Confirm Password */}
            <Input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              label="Confirm Password"
              leftIcon={Lock}
              rightIcon={showConfirmPassword ? EyeOff : Eye}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
              required
            />

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full btn-primary py-3 text-sm font-medium"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
