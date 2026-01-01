import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Input from '../components/Input';
import api from '../api';
import { getContextualError } from '../utils/errorMessages';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // Clear previous errors

    try {
      // Send POST request to the backend login API
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      // Store the JWT token in localStorage
      localStorage.setItem('authToken', response.data.token);  // Corrected token key

      // Redirect to the dashboard
      navigate('/dashboard');
    } catch (error: any) {
      const friendlyError = getContextualError(error, 'login');
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-primary-700">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 sm:px-10 animate-fadeIn">
          <form className="space-y-6" onSubmit={handleSubmit}>
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

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}

            <div className="text-sm text-right">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                className="w-full btn-primary py-3 text-sm font-medium"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;