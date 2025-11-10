import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Target,
  LineChart,
  FileText,
  Settings,
  LogOut,
  Brain,
  DollarSign,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/create-new-password', '/'].includes(location.pathname);

  // Logout functionality
  const handleLogout = () => {
    // Clear the JWT token from localStorage to log the user out
    localStorage.removeItem('authToken');
    navigate('/login'); // Redirect to login page
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/expenses', icon: Wallet, label: 'Expenses' },
    { path: '/budget-management', icon: DollarSign, label: 'Budget' },
    { path: '/savings', icon: Target, label: 'Goals' },
    { path: '/recommendations', icon: Brain, label: 'AI Insights' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gradient-soft">
      <nav className="w-64 bg-white border-r border-primary-200 px-4 py-6" style={{boxShadow: '0 2px 8px 0 rgba(53, 80, 112, 0.08)'}}>
        <div className="mb-8">
          <Link to="/dashboard" className="cursor-pointer">
            <h1 className="text-2xl font-bold gradient-text">FinanceAI</h1>
          </Link>
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-gradient-primary text-white'
                    : 'text-primary-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-sm text-accent-600 hover:bg-accent-50 hover:text-accent-700 w-full mt-4 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
