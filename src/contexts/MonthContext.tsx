import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MonthContextType {
  selectedMonth: string; // Format: "YYYY-MM"
  setSelectedMonth: (month: string) => void;
  getCurrentMonth: () => string;
  formatMonthDisplay: (month: string) => string;
  isCurrentMonth: (month: string) => boolean;
}

const MonthContext = createContext<MonthContextType | undefined>(undefined);

interface MonthProviderProps {
  children: ReactNode;
}

export const MonthProvider: React.FC<MonthProviderProps> = ({ children }) => {
  // Get current month in YYYY-MM format
  const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Initialize with current month
  const [selectedMonth, setSelectedMonthState] = useState<string>(getCurrentMonth());

  // Load saved month from localStorage on mount
  useEffect(() => {
    const savedMonth = localStorage.getItem('selectedMonth');
    if (savedMonth) {
      // Allow "all" or valid month format
      if (savedMonth === 'all' || /^\d{4}-\d{2}$/.test(savedMonth)) {
        setSelectedMonthState(savedMonth);
      }
    }
  }, []);

  const setSelectedMonth = (month: string) => {
    setSelectedMonthState(month);
    localStorage.setItem('selectedMonth', month);
  };

  const formatMonthDisplay = (month: string): string => {
    if (!month) return '';
    if (month === 'all') return 'All Months';
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1, 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const isCurrentMonth = (month: string): boolean => {
    return month === getCurrentMonth();
  };

  const value: MonthContextType = {
    selectedMonth,
    setSelectedMonth,
    getCurrentMonth,
    formatMonthDisplay,
    isCurrentMonth,
  };

  return (
    <MonthContext.Provider value={value}>
      {children}
    </MonthContext.Provider>
  );
};

/**
 * Hook to use month context
 * @returns Month context with all utilities
 */
export const useMonth = (): MonthContextType => {
  const context = useContext(MonthContext);
  if (context === undefined) {
    throw new Error('useMonth must be used within a MonthProvider');
  }
  return context;
};



