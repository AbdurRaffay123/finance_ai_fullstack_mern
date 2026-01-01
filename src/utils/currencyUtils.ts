import { CURRENCIES, Currency } from '../contexts/CurrencyContext';

/**
 * Currency conversion utilities for FinanceAI application
 * All financial data is stored in PKR (Pakistani Rupee) as the base currency
 */

/**
 * Convert amount from PKR to target currency
 * @param amountInPKR - Amount in Pakistani Rupees
 * @param targetCurrency - Target currency code
 * @returns Amount in target currency
 */
export const convertFromPKR = (amountInPKR: number, targetCurrency: string): number => {
  const currency = CURRENCIES[targetCurrency];
  if (!currency) {
    console.warn(`Unsupported currency: ${targetCurrency}, using PKR`);
    return amountInPKR;
  }

  if (targetCurrency === 'PKR') {
    return amountInPKR;
  }

  return amountInPKR / currency.rateToPKR;
};

/**
 * Convert amount from target currency to PKR
 * @param amount - Amount in target currency
 * @param sourceCurrency - Source currency code
 * @returns Amount in Pakistani Rupees
 */
export const convertToPKR = (amount: number, sourceCurrency: string): number => {
  const currency = CURRENCIES[sourceCurrency];
  if (!currency) {
    console.warn(`Unsupported currency: ${sourceCurrency}, assuming PKR`);
    return amount;
  }

  if (sourceCurrency === 'PKR') {
    return amount;
  }

  return amount * currency.rateToPKR;
};

/**
 * Convert amount between any two currencies
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Amount in target currency
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  // First convert to PKR (base currency)
  const amountInPKR = convertToPKR(amount, fromCurrency);

  // Then convert to target currency
  return convertFromPKR(amountInPKR, toCurrency);
};

/**
 * Format currency amount with proper localization
 * @param amount - Amount in the currency
 * @param currencyCode - Currency code
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatCurrencyAmount = (
  amount: number,
  currencyCode: string,
  options: {
    showSymbol?: boolean;
    decimals?: number;
    locale?: string;
  } = {}
): string => {
  const { showSymbol = true, decimals = 2, locale = 'en-US' } = options;

  const currency = CURRENCIES[currencyCode];
  if (!currency) {
    console.warn(`Unsupported currency: ${currencyCode}, using PKR`);
    return formatCurrencyAmount(amount, 'PKR', options);
  }

  const numAmount = Number(amount) || 0;
  const formattedAmount = numAmount.toFixed(decimals);

  if (showSymbol) {
    // Handle RTL symbols properly
    if (currencyCode === 'AED') {
      return `${formattedAmount} ${currency.symbol}`;
    }
    return `${currency.symbol}${formattedAmount}`;
  }

  return formattedAmount;
};

/**
 * Get currency information by code
 * @param currencyCode - Currency code
 * @returns Currency object or null if not found
 */
export const getCurrencyInfo = (currencyCode: string): Currency | null => {
  return CURRENCIES[currencyCode] || null;
};

/**
 * Get all supported currency codes
 * @returns Array of supported currency codes
 */
export const getSupportedCurrencies = (): string[] => {
  return Object.keys(CURRENCIES);
};

/**
 * Validate currency code
 * @param currencyCode - Currency code to validate
 * @returns True if currency is supported
 */
export const isValidCurrency = (currencyCode: string): boolean => {
  return currencyCode in CURRENCIES;
};

/**
 * Get exchange rate from PKR to target currency
 * @param targetCurrency - Target currency code
 * @returns Exchange rate (1 PKR = X target currency)
 */
export const getExchangeRateToPKR = (targetCurrency: string): number => {
  const currency = CURRENCIES[targetCurrency];
  return currency ? currency.rateToPKR : 1;
};

/**
 * Round amount to appropriate decimal places based on currency
 * @param amount - Amount to round
 * @param currencyCode - Currency code
 * @returns Rounded amount
 */
export const roundForCurrency = (amount: number, currencyCode: string): number => {
  // Most currencies use 2 decimal places
  // Some cryptocurrencies might use more, but for now we stick to 2
  const decimals = ['BTC', 'ETH'].includes(currencyCode) ? 8 : 2;

  return Number(amount.toFixed(decimals));
};

/**
 * Calculate percentage change with currency formatting
 * @param current - Current value
 * @param previous - Previous value
 * @returns Object with percentage and formatted string
 */
export const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) {
    return {
      percentage: current > 0 ? 100 : 0,
      formatted: current > 0 ? '+100.0%' : '0.0%',
      isIncrease: current > 0,
    };
  }

  const percentage = ((current - previous) / Math.abs(previous)) * 100;
  const isIncrease = percentage > 0;

  return {
    percentage: Math.abs(percentage),
    formatted: `${isIncrease ? '+' : '-'}${Math.abs(percentage).toFixed(1)}%`,
    isIncrease,
  };
};
