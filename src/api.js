import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

// FastAPI client for AI predictions
const fastApi = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// CRUD for categories
export const fetchCategories = () => api.get('/categories').then(res => res.data);
export const addCategory = (category) => api.post('/categories', category).then(res => res.data);
export const updateCategory = (id, category) => api.put(`/categories/${id}`, category).then(res => res.data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then(res => res.data);

// Patch update spentAmount (increment) for a category
export const updateCategorySpentAmount = (id, amount) =>
  api.patch(`/categories/${id}/spentAmount`, { amount }).then(res => res.data);


// CRUD for savings goals
export const fetchSavingsGoals = () => api.get('/savingsGoals').then(res => res.data);
export const addSavingsGoal = (goal) => api.post('/savingsGoals', goal).then(res => res.data);
export const updateSavingsGoal = (id, goal) => api.put(`/savingsGoals/${id}`, goal).then(res => res.data);
export const deleteSavingsGoal = (id) => api.delete(`/savingsGoals/${id}`).then(res => res.data);
// Patch update currentAmount for a specific savings goal
export const updateSavingsGoalCurrentAmount = (id, currentAmount) =>
  api.patch(`/savingsGoals/${id}/currentAmount`, { currentAmount }).then(res => res.data);

// Reports
export const fetchReports = () => api.get('/reports').then(res => res.data);
export const generateReport = (reportData) => api.post('/reports/generate', reportData).then(res => res.data);

// UserSettings APIs
export const fetchUserSettings = () => api.get('/userSettings').then(res => res.data);
export const updateUserSettings = (settings) => api.put('/userSettings', settings).then(res => res.data);
export const updateUserSecurity = (securityData) => api.put('/userSettings/security', securityData).then(res => res.data);
export const uploadProfilePhoto = (file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return api.post('/userSettings/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data);
};

// Transaction APIs
export const fetchTransactions = () => api.get('/transactions').then(res => res.data);
export const addTransaction = (transaction) => api.post('/transactions', transaction).then(res => res.data);
export const updateTransaction = (id, transaction) => api.put(`/transactions/${id}`, transaction).then(res => res.data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`).then(res => res.data);

// Dashboard analytics APIs
export const getDashboardStats = () => api.get('/transactions/dashboard-stats').then(res => res.data);
export const getMonthlySpending = () => api.get('/transactions/monthly-spending').then(res => res.data);
export const getCategoryBreakdown = () => api.get('/transactions/category-breakdown').then(res => res.data);

// Budget APIs
export const getBudget = () => api.get('/budget').then(res => res.data);
export const updateBudget = (budgetData) => api.put('/budget', budgetData).then(res => res.data);
export const getBudgetHistory = () => api.get('/budget/history').then(res => res.data);

// Prediction APIs - Uses Node.js backend which proxies to FastAPI
export const getPredictions = (userData) => api.post('/predict', userData).then(res => res.data);

// FastAPI direct access (if needed separately)
export const getPredictionsDirect = (userData) => fastApi.post('/predict', userData).then(res => res.data);

// AI Recommendations API
export const getAIRecommendations = (financialData) => 
  api.post('/recommendations', financialData).then(res => res.data);

// Password Reset APIs
export const forgotPassword = (email) => 
  api.post('/auth/forgot-password', { email }).then(res => res.data);

export const verifyOTP = (email, otp) => 
  api.post('/auth/verify-otp', { email, otp }).then(res => res.data);

export const resendOTP = (email) => 
  api.post('/auth/resend-otp', { email }).then(res => res.data);

export const resetPassword = (email, resetToken, newPassword) => 
  api.post('/auth/reset-password', { email, reset_token: resetToken, new_password: newPassword }).then(res => res.data);

export default api;
