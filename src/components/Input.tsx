import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  // Icon props
  leftIcon?: LucideIcon | React.ReactNode;
  rightIcon?: LucideIcon | React.ReactNode;

  // Text prefix props
  prefix?: string;
  suffix?: string;

  // Size variants
  size?: 'sm' | 'md' | 'lg';

  // Error state
  error?: boolean;

  // Container className (for outer wrapper)
  containerClassName?: string;

  // Label
  label?: string;
  helperText?: string;

  // Right icon click handler
  onRightIconClick?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  leftIcon,
  rightIcon,
  prefix,
  suffix,
  size = 'md',
  error = false,
  containerClassName = '',
  label,
  helperText,
  onRightIconClick,
  className = '',
  id,
  value,
  ...props
}, ref) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'text-sm',
      input: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
      prefix: 'text-sm',
    },
    md: {
      container: 'text-base',
      input: 'px-3 py-2.5 text-base',
      icon: 'w-5 h-5',
      prefix: 'text-base',
    },
    lg: {
      container: 'text-lg',
      input: 'px-4 py-3 text-lg',
      icon: 'w-6 h-6',
      prefix: 'text-lg',
    },
  };

  const config = sizeConfig[size];

  // Check if input has a value (for hiding icons when typing)
  const hasValue = value !== undefined && value !== null && value !== '';
  const isPasswordField = props.type === 'password' || props.type === 'text' && rightIcon; // Password toggle should always show
  const showLeftIcon = leftIcon && !hasValue;
  const showRightIcon = rightIcon && (isPasswordField || !hasValue); // Always show for password toggle
  const showPrefix = prefix && !leftIcon && !hasValue;
  const showSuffix = suffix && !rightIcon && !hasValue;

  // Calculate padding based on icons and prefix/suffix
  // When value exists, icons are hidden, so use normal padding
  // Add extra padding when icons are shown to prevent placeholder overlap
  const getPaddingClasses = () => {
    let leftPadding = '';
    let rightPadding = '';

    if (showLeftIcon || showPrefix) {
      // Increased padding to prevent placeholder text from overlapping with icon
      leftPadding = size === 'sm' ? 'pl-10' : size === 'lg' ? 'pl-14' : 'pl-11';
    } else {
      leftPadding = size === 'sm' ? 'pl-3' : size === 'lg' ? 'pl-4' : 'pl-3';
    }

    if (showRightIcon || showSuffix) {
      // Increased padding to prevent placeholder text from overlapping with icon
      rightPadding = size === 'sm' ? 'pr-10' : size === 'lg' ? 'pr-14' : 'pr-11';
    } else {
      rightPadding = size === 'sm' ? 'pr-3' : size === 'lg' ? 'pr-4' : 'pr-3';
    }

    return `${leftPadding} ${rightPadding}`;
  };

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={containerClassName}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-primary-700 mb-1"
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon - Only show when input is empty */}
        {showLeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 transition-opacity duration-200">
            {React.isValidElement(leftIcon) ? (
              leftIcon
            ) : (
              React.createElement(leftIcon as LucideIcon, {
                className: `${config.icon} text-primary-400`,
              })
            )}
          </div>
        )}

        {/* Left Text Prefix - Only show when input is empty */}
        {showPrefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 transition-opacity duration-200">
            <span className={`${config.prefix} text-primary-400 font-medium`}>
              {prefix}
            </span>
          </div>
        )}

        {/* Input Element */}
        <input
          ref={ref}
          id={inputId}
          value={value}
          className={`
            block w-full rounded-lg border transition-all duration-200
            ${config.input}
            ${getPaddingClasses()}
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
            }
            focus:outline-none focus:ring-2
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            placeholder:text-gray-400
            ${(showLeftIcon || showPrefix) ? 'placeholder:pl-0' : ''}
            ${className}
          `}
          {...props}
        />

        {/* Right Text Suffix - Only show when input is empty */}
        {showSuffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10 transition-opacity duration-200">
            <span className={`${config.prefix} text-primary-400 font-medium`}>
              {suffix}
            </span>
          </div>
        )}

        {/* Right Icon - Always show for password toggle, otherwise hide when has value */}
        {rightIcon && showRightIcon && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 hover:text-primary-600 transition-colors"
            onClick={onRightIconClick}
            tabIndex={onRightIconClick ? 0 : -1}
          >
            {React.isValidElement(rightIcon) ? (
              rightIcon
            ) : (
              React.createElement(rightIcon as LucideIcon, {
                className: `${config.icon} text-primary-400`,
              })
            )}
          </button>
        )}
      </div>

      {/* Helper Text */}
      {helperText && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
