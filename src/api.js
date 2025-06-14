import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
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

export const getPredictions = (userData) => api.post('/predict', userData).then(res => res.data);

export default api;
