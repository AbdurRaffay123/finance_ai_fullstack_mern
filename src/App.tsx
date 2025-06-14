import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import CreateNewPassword from './pages/CreateNewPassword';
import AddTransaction from './pages/AddTransaction';
import ExpenseManagement from './pages/ExpenseManagement';
import BudgetSetup from './pages/BudgetSetup';
import SavingsGoal from './pages/SavingsGoal';
import FinancialOverview from './pages/FinancialOverview';
import Recommendations from './pages/Recommendations';
import SpendingTrends from './pages/SpendingTrends';
import GenerateReports from './pages/GenerateReports';
import ProfileSettings from './pages/ProfileSettings';
import MonthlySummary from './pages/MonthlySummary';
import CategoriesAnalysis from './pages/CategoriesAnalysis';
import TransactionHistory from './pages/TransactionHistory';
import Dashboard from './pages/Dashboard';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/create-new-password" element={<CreateNewPassword />} />

      
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/add-transaction" element={<AddTransaction />} />
        <Route path="/expenses" element={<ExpenseManagement />} />
        <Route path="/budget" element={<BudgetSetup />} />
        <Route path="/savings" element={<SavingsGoal />} />
        <Route path="/overview" element={<FinancialOverview />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/trends" element={<SpendingTrends />} />
        <Route path="/reports" element={<GenerateReports />} />
        <Route path="/settings" element={<ProfileSettings />} />
        <Route path="/monthly-summary" element={<MonthlySummary />} />
        <Route path="/categories-analysis" element={<CategoriesAnalysis />} />
        <Route path="/transaction-history" element={<TransactionHistory />} />
      </Routes>
    </Router>
  );
}

export default App;
