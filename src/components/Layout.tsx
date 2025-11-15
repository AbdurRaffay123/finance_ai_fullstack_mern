import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Brain,
  DollarSign,
  Target,
  FileText,
  Plus,
  History,
  Menu,
  X,
  ChevronDown,
  User,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import LogoutModal from './LogoutModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [transactionsDropdownOpen, setTransactionsDropdownOpen] = useState(false);
  const [financeDropdownOpen, setFinanceDropdownOpen] = useState(false);
  const [aiInsightsDropdownOpen, setAiInsightsDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const transactionsRef = useRef<HTMLDivElement>(null);
  const financeRef = useRef<HTMLDivElement>(null);
  const aiInsightsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const isAuthPage = ['/login', '/signup', '/forgot-password', '/create-new-password', '/verify-otp', '/reset-password', '/'].includes(location.pathname);

  // Logout functionality
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('authToken');
    setShowLogoutModal(false);
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (transactionsRef.current && !transactionsRef.current.contains(event.target as Node)) {
        setTransactionsDropdownOpen(false);
      }
      if (financeRef.current && !financeRef.current.contains(event.target as Node)) {
        setFinanceDropdownOpen(false);
      }
      if (aiInsightsRef.current && !aiInsightsRef.current.contains(event.target as Node)) {
        setAiInsightsDropdownOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  const isActive = (path: string) => location.pathname === path;
  const isTransactionsActive = isActive('/add-transaction') || isActive('/transaction-history');
  const isFinanceActive = isActive('/budget-management') || isActive('/savings') || isActive('/reports');
  const isAIInsightsActive = isActive('/recommendations') || isActive('/predictions');
  const isSettingsActive = isActive('/profile') || isActive('/security');

  return (
    <div className="flex flex-col h-screen bg-gradient-soft">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-primary-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/dashboard" className="cursor-pointer">
          <h1 className="text-2xl font-bold gradient-text">FinanceAI</h1>
              </Link>
        </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1 md:flex-1 md:justify-center">
              {/* Dashboard */}
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/dashboard')
                    ? 'bg-gradient-primary text-white'
                    : 'text-primary-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                <div className="flex items-center">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </div>
              </Link>

              {/* Transactions Dropdown */}
              <div className="relative" ref={transactionsRef}>
                <button
                  onClick={() => {
                    setTransactionsDropdownOpen(!transactionsDropdownOpen);
                    setFinanceDropdownOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    isTransactionsActive
                      ? 'bg-gradient-primary text-white'
                      : 'text-primary-700 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  Transactions
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${transactionsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {transactionsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-primary-200 py-1 z-50">
                    <Link
                      to="/add-transaction"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive('/add-transaction')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </Link>
                    <Link
                      to="/transaction-history"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive('/transaction-history')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      <History className="w-4 h-4 mr-2" />
                      View History
                    </Link>
                  </div>
                )}
              </div>

              {/* Finance Dropdown */}
              <div className="relative" ref={financeRef}>
                <button
                  onClick={() => {
                    setFinanceDropdownOpen(!financeDropdownOpen);
                    setTransactionsDropdownOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    isFinanceActive
                      ? 'bg-gradient-primary text-white'
                      : 'text-primary-700 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  Finance
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${financeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {financeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-primary-200 py-1 z-50">
                    <Link
                      to="/budget-management"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive('/budget-management')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Budget
                    </Link>
                    <Link
                      to="/savings"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive('/savings')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Goals
                    </Link>
                    <Link
                      to="/reports"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive('/reports')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Reports
                    </Link>
                  </div>
                )}
              </div>

              {/* AI Insights Dropdown */}
              <div className="relative" ref={aiInsightsRef}>
                <button
                  onClick={() => {
                    setAiInsightsDropdownOpen(!aiInsightsDropdownOpen);
                    setTransactionsDropdownOpen(false);
                    setFinanceDropdownOpen(false);
                    setSettingsDropdownOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    isAIInsightsActive
                      ? 'bg-gradient-primary text-white'
                      : 'text-primary-700 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  AI Insights
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${aiInsightsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {aiInsightsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-primary-200 py-1 z-50">
                    <Link
                      to="/recommendations"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive('/recommendations')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Recommendations
                    </Link>
                    <Link
                      to="/predictions"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive('/predictions')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Predictions
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Settings & Logout */}
            <div className="hidden md:flex md:items-center md:space-x-2">
              {/* Settings Dropdown */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => {
                    setSettingsDropdownOpen(!settingsDropdownOpen);
                    setTransactionsDropdownOpen(false);
                    setFinanceDropdownOpen(false);
                    setAiInsightsDropdownOpen(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                    isSettingsActive
                      ? 'bg-gradient-primary text-white'
                      : 'text-primary-700 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${settingsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {settingsDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-primary-200 py-1 z-50">
                    <Link
                      to="/profile"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive('/profile')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/security"
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive('/security')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Security
                    </Link>
                  </div>
                )}
              </div>
          <button
            onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-accent-600 hover:bg-accent-50 hover:text-accent-700 transition-all duration-200 flex items-center"
          >
                <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
              <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
              />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              <Link
                to="/dashboard"
                className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'bg-gradient-primary text-white'
                    : 'text-primary-700 hover:bg-primary-50'
                }`}
              >
                <div className="flex items-center">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </div>
              </Link>

              {/* Mobile Transactions */}
              <div className="px-4 py-2">
                <div className="text-xs font-semibold text-primary-500 uppercase mb-1">Transactions</div>
                <Link
                  to="/add-transaction"
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    isActive('/add-transaction')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                  </div>
                </Link>
                <Link
                  to="/transaction-history"
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    isActive('/transaction-history')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    View History
                  </div>
                </Link>
              </div>

              {/* Mobile Finance */}
              <div className="px-4 py-2">
                <div className="text-xs font-semibold text-primary-500 uppercase mb-1">Finance</div>
                <Link
                  to="/budget-management"
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    isActive('/budget-management')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Budget
                  </div>
                </Link>
                <Link
                  to="/savings"
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    isActive('/savings')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Goals
                  </div>
                </Link>
                <Link
                  to="/reports"
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    isActive('/reports')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Reports
                  </div>
                </Link>
              </div>

              {/* Mobile AI Insights */}
              <div className="px-4 py-2">
                <div className="text-xs font-semibold text-primary-500 uppercase mb-1">AI Insights</div>
                <Link
                  to="/recommendations"
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    isActive('/recommendations')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Recommendations
                  </div>
                </Link>
                <Link
                  to="/predictions"
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    isActive('/predictions')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Predictions
                  </div>
                </Link>
              </div>

              {/* Mobile Settings */}
              <div className="px-4 py-2">
                <div className="text-xs font-semibold text-primary-500 uppercase mb-1">Settings</div>
                <Link
                  to="/profile"
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    isActive('/profile')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </div>
                </Link>
                <Link
                  to="/security"
                  className={`block px-4 py-2 rounded-lg text-sm ${
                    isActive('/security')
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Security
                  </div>
                </Link>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-accent-600 hover:bg-accent-50 transition-colors flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
              <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
              />
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
