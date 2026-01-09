import React from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, ChevronDown } from 'lucide-react';
import { useMonth } from '../contexts/MonthContext';

interface MonthSelectorProps {
  className?: string;
  showLabel?: boolean;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const location = useLocation();
  const { selectedMonth, setSelectedMonth, getCurrentMonth, formatMonthDisplay, isCurrentMonth } = useMonth();
  
  // Check if we're on Dashboard page
  const isDashboard = location.pathname === '/dashboard';

  // Generate list of available months (current month and previous 12 months)
  const getAvailableMonths = (): string[] => {
    const months: string[] = [];
    const now = new Date();
    
    // Add current month and previous 12 months (13 months total)
    for (let i = 0; i < 13; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }
    
    return months;
  };

  const availableMonths = getAvailableMonths();
  const currentMonth = getCurrentMonth();
  
  // Handle "All" selection - only allow on Dashboard
  const handleMonthChange = (value: string) => {
    if (value === 'all') {
      if (isDashboard) {
        setSelectedMonth('all');
      } else {
        // If not on Dashboard, reset to current month
        setSelectedMonth(getCurrentMonth());
      }
    } else {
      setSelectedMonth(value);
    }
  };
  
  // Reset "all" to current month if not on Dashboard
  React.useEffect(() => {
    if (!isDashboard && selectedMonth === 'all') {
      setSelectedMonth(getCurrentMonth());
    }
  }, [isDashboard, selectedMonth, setSelectedMonth]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">Viewing:</span>
        </div>
      )}
      <div className="relative">
        <select
          value={selectedMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="appearance-none bg-white border border-primary-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-primary-900 hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer transition-colors"
        >
          {/* Show "All" option only on Dashboard */}
          {isDashboard && (
            <option value="all">All Months</option>
          )}
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {formatMonthDisplay(month)}
              {isCurrentMonth(month) ? ' (Current)' : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-600 pointer-events-none" />
      </div>
      {selectedMonth === 'all' && isDashboard ? (
        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
          All Months
        </span>
      ) : isCurrentMonth(selectedMonth) && selectedMonth !== 'all' ? (
        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
          Current Month
        </span>
      ) : null}
    </div>
  );
};

export default MonthSelector;



