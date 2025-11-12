import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import CreateNewPassword from './pages/CreateNewPassword';
import AddTransaction from './pages/AddTransaction';
import ExpenseManagement from './pages/ExpenseManagement';
import BudgetSetup from './pages/BudgetSetup';
import BudgetManagement from './pages/BudgetManagement';
import SavingsGoal from './pages/SavingsGoal';
import AIInsights from './pages/AIInsights';
import Recommendations from './pages/Recommendations';
import Predictions from './pages/Predictions';
import GenerateReports from './pages/GenerateReports';
import ProfileSettings from './pages/ProfileSettings';
import Profile from './pages/Profile';
import Security from './pages/Security';
import MonthlySummary from './pages/MonthlySummary';
import CategoriesAnalysis from './pages/CategoriesAnalysis';
import TransactionHistory from './pages/TransactionHistory';
import Dashboard from './pages/Dashboard';
import './styles/global.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<CreateNewPassword />} />
        <Route path="/create-new-password" element={<CreateNewPassword />} />

      
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-transaction" element={<AddTransaction />} />
        <Route path="/expenses" element={<ExpenseManagement />} />
        <Route path="/budget" element={<BudgetSetup />} />
        <Route path="/budget-management" element={<BudgetManagement />} />
        <Route path="/savings" element={<SavingsGoal />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/reports" element={<GenerateReports />} />
        <Route path="/settings" element={<ProfileSettings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/security" element={<Security />} />
        <Route path="/monthly-summary" element={<MonthlySummary />} />
        <Route path="/categories-analysis" element={<CategoriesAnalysis />} />
        <Route path="/transaction-history" element={<TransactionHistory />} />
      </Routes>
    </Router>
  );
}

export default App;
