/**
 * Budget Validation Utilities
 * Validates month/year selection and budget data
 */

/**
 * Format date to YYYY-MM format
 * @param {Date} date - Date object
 * @returns {string} Formatted month string (e.g., "2024-12")
 */
const formatMonthYear = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Parse YYYY-MM string to Date object
 * @param {string} monthString - Month string in format "YYYY-MM"
 * @returns {Date} Date object for the first day of that month
 */
const parseMonthYear = (monthString) => {
  const [year, month] = monthString.split('-').map(Number);
  return new Date(year, month - 1, 1);
};

/**
 * Get current month in YYYY-MM format
 * @returns {string} Current month string
 */
const getCurrentMonth = () => {
  return formatMonthYear(new Date());
};

/**
 * Validate month/year selection
 * @param {string} monthYear - Month string in format "YYYY-MM"
 * @returns {Object} Validation result with isValid, error message, and parsed date
 */
const validateMonthYear = (monthYear) => {
  // Check format
  if (!monthYear || typeof monthYear !== 'string') {
    return {
      isValid: false,
      error: 'Month/year is required',
      monthYear: null,
    };
  }

  // Validate format (YYYY-MM)
  const monthYearRegex = /^\d{4}-\d{2}$/;
  if (!monthYearRegex.test(monthYear)) {
    return {
      isValid: false,
      error: 'Invalid month/year format. Expected YYYY-MM (e.g., 2024-12)',
      monthYear: null,
    };
  }

  // Parse and validate date
  const [year, month] = monthYear.split('-').map(Number);
  
  if (year < 2000 || year > 2100) {
    return {
      isValid: false,
      error: 'Year must be between 2000 and 2100',
      monthYear: null,
    };
  }

  if (month < 1 || month > 12) {
    return {
      isValid: false,
      error: 'Month must be between 1 and 12',
      monthYear: null,
    };
  }

  const selectedDate = parseMonthYear(monthYear);
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Check if future month (not allowed)
  if (selectedDate > currentMonth) {
    return {
      isValid: false,
      error: 'Cannot create budget for future months. Only past and current months are allowed.',
      monthYear: null,
    };
  }

  return {
    isValid: true,
    error: null,
    monthYear,
    date: selectedDate,
  };
};

/**
 * Check if month is in the past
 * @param {string} monthYear - Month string in format "YYYY-MM"
 * @returns {boolean} True if month is in the past
 */
const isPastMonth = (monthYear) => {
  const selectedDate = parseMonthYear(monthYear);
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  return selectedDate < currentMonth;
};

/**
 * Check if month is current month
 * @param {string} monthYear - Month string in format "YYYY-MM"
 * @returns {boolean} True if month is current month
 */
const isCurrentMonth = (monthYear) => {
  return monthYear === getCurrentMonth();
};

/**
 * Check if month is in the future
 * @param {string} monthYear - Month string in format "YYYY-MM"
 * @returns {boolean} True if month is in the future
 */
const isFutureMonth = (monthYear) => {
  const selectedDate = parseMonthYear(monthYear);
  const currentDate = new Date();
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  return selectedDate > currentMonth;
};

/**
 * Get list of available months (past and current)
 * @param {number} monthsBack - Number of months to include (default: 12)
 * @returns {Array} Array of month strings in YYYY-MM format
 */
const getAvailableMonths = (monthsBack = 12) => {
  const months = [];
  const currentDate = new Date();
  
  for (let i = 0; i <= monthsBack; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push(formatMonthYear(date));
  }
  
  return months.reverse(); // Oldest first
};

module.exports = {
  formatMonthYear,
  parseMonthYear,
  getCurrentMonth,
  validateMonthYear,
  isPastMonth,
  isCurrentMonth,
  isFutureMonth,
  getAvailableMonths,
};
