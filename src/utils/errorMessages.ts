/**
 * Utility function to convert backend errors to user-friendly messages
 * Hides technical details and provides clear, actionable error messages
 */

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

export const getUserFriendlyError = (error: any, defaultMessage: string = 'Something went wrong. Please try again.'): string => {
  // If it's already a user-friendly string, return it
  if (typeof error === 'string') {
    return error;
  }

  const apiError = error as ApiError;

  // Check for specific error messages from backend
  if (apiError.response?.data?.message) {
    const backendMessage = apiError.response.data.message;
    
    // Map common backend errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      'Invalid credentials': 'The email or password you entered is incorrect. Please try again.',
      'User already exists': 'An account with this email already exists. Please use a different email or try logging in.',
      'Invalid email format': 'Please enter a valid email address.',
      'Password must be at least 6 characters long': 'Password must be at least 6 characters long.',
      'Email and password are required': 'Please fill in both email and password fields.',
      'User already exists': 'This email is already registered. Please log in instead.',
      'Server error. Please try again.': 'We encountered an issue. Please try again in a moment.',
      'Internal Server Error': 'Something went wrong on our end. Please try again later.',
      'Network Error': 'Unable to connect to the server. Please check your internet connection.',
      'timeout': 'The request took too long. Please try again.',
      'ECONNREFUSED': 'Unable to connect to the server. Please ensure the server is running.',
    };

    // Check if we have a mapping for this error
    for (const [key, friendlyMessage] of Object.entries(errorMappings)) {
      if (backendMessage.toLowerCase().includes(key.toLowerCase())) {
        return friendlyMessage;
      }
    }

    // Return the backend message if it's already user-friendly
    return backendMessage;
  }

  // Handle HTTP status codes
  if (apiError.response?.status) {
    const status = apiError.response.status;
    
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data. Please refresh and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Our server encountered an error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again in a moment.';
      default:
        return defaultMessage;
    }
  }

  // Handle network errors
  if (apiError.message) {
    if (apiError.message.includes('Network Error') || apiError.message.includes('ECONNREFUSED')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (apiError.message.includes('timeout')) {
      return 'The request took too long. Please try again.';
    }
  }

  // Default fallback
  return defaultMessage;
};

/**
 * Get a user-friendly error message for specific contexts
 */
export const getContextualError = (error: any, context: 'login' | 'signup' | 'forgotPassword' | 'resetPassword' | 'general'): string => {
  const defaultMessages: Record<string, string> = {
    login: 'Unable to sign in. Please check your email and password.',
    signup: 'Unable to create your account. Please try again.',
    forgotPassword: 'Unable to send password reset email. Please try again.',
    resetPassword: 'Unable to reset your password. Please try again.',
    general: 'Something went wrong. Please try again.',
  };

  const defaultMessage = defaultMessages[context] || defaultMessages.general;
  return getUserFriendlyError(error, defaultMessage);
};

