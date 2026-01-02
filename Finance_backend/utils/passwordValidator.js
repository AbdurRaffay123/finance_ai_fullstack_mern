/**
 * Password Validation Utility
 * Implements security best practices for password validation
 */

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid, errors, and strength
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  const requirements = {
    minLength: 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  // Minimum length check
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  // Character variety checks
  if (!requirements.hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!requirements.hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!requirements.hasNumber) {
    errors.push('Password must contain at least one number');
  }

  if (!requirements.hasSpecialChar) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  // Calculate strength score (0-4)
  const strengthScore = Object.values(requirements).filter(Boolean).length - 1; // -1 because minLength is not boolean
  const strength = strengthScore <= 1 ? 'weak' : strengthScore <= 2 ? 'fair' : strengthScore <= 3 ? 'good' : 'strong';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: strengthScore,
    requirements,
  };
};

/**
 * Checks if new password is different from current password
 * @param {string} newPassword - New password
 * @param {string} currentPasswordHash - Current password hash
 * @returns {Promise<boolean>} True if passwords are different
 */
const isPasswordDifferent = async (newPassword, currentPasswordHash) => {
  const bcrypt = require('bcryptjs');
  const isMatch = await bcrypt.compare(newPassword, currentPasswordHash);
  return !isMatch; // Return true if passwords are different
};

/**
 * Checks if password matches common weak passwords
 * @param {string} password - Password to check
 * @returns {boolean} True if password is in common weak passwords list
 */
const isCommonPassword = (password) => {
  const commonPasswords = [
    'password',
    '12345678',
    'password123',
    'admin123',
    'qwerty123',
    'welcome123',
    'letmein',
    'monkey',
    'dragon',
    'master',
  ];

  return commonPasswords.includes(password.toLowerCase());
};

/**
 * Comprehensive password validation
 * @param {string} password - Password to validate
 * @param {string} currentPasswordHash - Current password hash (optional, for checking if same)
 * @returns {Promise<Object>} Complete validation result
 */
const validatePassword = async (password, currentPasswordHash = null) => {
  // Basic checks
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak',
      score: 0,
    };
  }

  // Check for common passwords
  if (isCommonPassword(password)) {
    return {
      isValid: false,
      errors: ['Password is too common. Please choose a more unique password.'],
      strength: 'weak',
      score: 0,
    };
  }

  // Check if password is same as current (if current hash provided)
  if (currentPasswordHash) {
    const isDifferent = await isPasswordDifferent(password, currentPasswordHash);
    if (!isDifferent) {
      return {
        isValid: false,
        errors: ['New password must be different from current password'],
        strength: 'weak',
        score: 0,
      };
    }
  }

  // Strength validation
  const strengthValidation = validatePasswordStrength(password);
  return strengthValidation;
};

module.exports = {
  validatePassword,
  validatePasswordStrength,
  isPasswordDifferent,
  isCommonPassword,
};
