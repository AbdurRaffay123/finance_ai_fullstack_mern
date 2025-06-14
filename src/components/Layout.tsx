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
    { path: '/trends', icon: TrendingUp, label: 'Trends' },
    { path: '/savings', icon: Target, label: 'Goals' },
    { path: '/overview', icon: LineChart, label: 'Overview' },
    { path: '/recommendations', icon: Brain, label: 'AI Insights' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <nav className="w-64 bg-white border-r border-gray-200 px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-emerald-600">FinanceAI</h1>
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2 text-sm rounded-lg ${
                  location.pathname === item.path
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-gray-600 hover:bg-gray-50'
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
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-red-500 w-full mt-4 rounded-lg"
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
