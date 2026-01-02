/**
 * Frontend Password Strength Validation
 * Provides real-time password strength feedback
 */

export interface PasswordStrength {
  score: number; // 0-4
  strength: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  color: string;
}

/**
 * Calculate password strength on the frontend
 * @param password - Password to evaluate
 * @returns Password strength object
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password || password.length === 0) {
    return {
      score: 0,
      strength: 'weak',
      feedback: [],
      color: 'gray',
    };
  }

  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  let color = 'red';

  if (score <= 1) {
    strength = 'weak';
    color = 'red';
  } else if (score <= 2) {
    strength = 'fair';
    color = 'orange';
  } else if (score <= 3) {
    strength = 'good';
    color = 'blue';
  } else {
    strength = 'strong';
    color = 'green';
  }

  return {
    score,
    strength,
    feedback,
    color,
  };
};

/**
 * Get strength color for Tailwind classes
 */
export const getStrengthColor = (strength: string): string => {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'fair':
      return 'bg-orange-500';
    case 'good':
      return 'bg-blue-500';
    case 'strong':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};

/**
 * Get strength text color
 */
export const getStrengthTextColor = (strength: string): string => {
  switch (strength) {
    case 'weak':
      return 'text-red-600';
    case 'fair':
      return 'text-orange-600';
    case 'good':
      return 'text-blue-600';
    case 'strong':
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
};
