import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Currency types and configuration
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rateToPKR: number; // Exchange rate to PKR (base currency)
}

export const CURRENCIES: Record<string, Currency> = {
  PKR: {
    code: 'PKR',
    symbol: 'Rs',
    name: 'Pakistani Rupee',
    rateToPKR: 1,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rateToPKR: 283, // 1 USD = 283 PKR
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rateToPKR: 305, // 1 EUR = 305 PKR
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rateToPKR: 360, // 1 GBP = 360 PKR
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'Dirham',
    rateToPKR: 77, // 1 AED = 77 PKR
  },
};

interface CurrencyContextType {
  currentCurrency: Currency;
  setCurrency: (currencyCode: string) => void;
  formatCurrency: (amount: number, options?: { showSymbol?: boolean; decimals?: number }) => string;
  convertToCurrentCurrency: (amountInPKR: number) => number;
  convertFromCurrentCurrency: (amount: number) => number;
  currencyCodes: string[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  // Default to PKR as requested
  const [currentCurrency, setCurrentCurrencyState] = useState<Currency>(CURRENCIES.PKR);

  // Load currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('userCurrency');
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      setCurrentCurrencyState(CURRENCIES[savedCurrency]);
    }
  }, []);

  const setCurrency = (currencyCode: string) => {
    if (CURRENCIES[currencyCode]) {
      const newCurrency = CURRENCIES[currencyCode];
      setCurrentCurrencyState(newCurrency);
      localStorage.setItem('userCurrency', currencyCode);
    }
  };

  /**
   * Convert amount from PKR to current currency
   * @param amountInPKR - Amount in Pakistani Rupees (base currency)
   * @returns Amount in current currency
   */
  const convertToCurrentCurrency = (amountInPKR: number): number => {
    if (currentCurrency.code === 'PKR') {
      return amountInPKR;
    }
    return amountInPKR / currentCurrency.rateToPKR;
  };

  /**
   * Convert amount from current currency to PKR
   * @param amount - Amount in current currency
   * @returns Amount in Pakistani Rupees
   */
  const convertFromCurrentCurrency = (amount: number): number => {
    if (currentCurrency.code === 'PKR') {
      return amount;
    }
    return amount * currentCurrency.rateToPKR;
  };

  /**
   * Format currency amount with proper symbol and decimals
   * @param amount - Amount in current currency
   * @param options - Formatting options
   * @returns Formatted currency string
   */
  const formatCurrency = (
    amount: number,
    options: { showSymbol?: boolean; decimals?: number } = {}
  ): string => {
    const { showSymbol = true, decimals = 2 } = options;

    // Ensure amount is a valid number
    const numAmount = Number(amount) || 0;

    // Format with specified decimal places
    const formattedAmount = numAmount.toFixed(decimals);

    if (showSymbol) {
      return `${currentCurrency.symbol}${formattedAmount}`;
    }

    return formattedAmount;
  };

  const value: CurrencyContextType = {
    currentCurrency,
    setCurrency,
    formatCurrency,
    convertToCurrentCurrency,
    convertFromCurrentCurrency,
    currencyCodes: Object.keys(CURRENCIES),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

/**
 * Hook to use currency context
 * @returns Currency context with all utilities
 */
export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

// Export currencies for external use
export { CURRENCIES as SUPPORTED_CURRENCIES };
