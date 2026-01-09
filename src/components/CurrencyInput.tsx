import React, { forwardRef, useState, useEffect } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertToPKR } from '../utils/currencyUtils';
import Input from './Input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  // Size variants
  size?: 'sm' | 'md' | 'lg';

  // Error state
  error?: boolean;

  // Container className
  containerClassName?: string;

  // Label
  label?: string;
  helperText?: string;

  // Currency value in PKR (base currency)
  valueInPKR?: number;

  // Show currency symbol
  showSymbol?: boolean;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(({
  size = 'md',
  error = false,
  containerClassName = '',
  label,
  helperText,
  valueInPKR,
  showSymbol = true,
  onChange,
  onBlur,
  ...props
}, ref) => {
  const { currentCurrency, formatCurrency, convertToCurrentCurrency } = useCurrency();
  
  // Track the raw input value (what user is typing)
  const [rawInputValue, setRawInputValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Initialize rawInputValue when component mounts
  useEffect(() => {
    if (valueInPKR !== undefined && valueInPKR !== null && valueInPKR !== 0) {
      const displayValue = convertToCurrentCurrency(valueInPKR);
      setRawInputValue(displayValue.toString());
    } else {
      setRawInputValue('');
    }
  }, []); // Only run on mount

  // Update rawInputValue when valueInPKR changes externally (but not while user is typing)
  useEffect(() => {
    if (!isFocused) {
      if (valueInPKR !== undefined && valueInPKR !== null && valueInPKR !== 0) {
        const displayValue = convertToCurrentCurrency(valueInPKR);
        setRawInputValue(displayValue.toString());
      } else {
        setRawInputValue('');
      }
    }
  }, [valueInPKR, isFocused, convertToCurrentCurrency]);

  // Handle input changes - allow free typing without auto-formatting
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValueStr = e.target.value;
    
    // Allow user to type freely (including partial numbers like "1", "1.", "1.5")
    setRawInputValue(inputValueStr);
    
    if (onChange) {
      // If input is empty, pass empty string
      if (inputValueStr.trim() === '') {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: '',
            name: e.target.name,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
        return;
      }
      
      // Parse the input value
      const inputValue = parseFloat(inputValueStr);
      
      // If not a valid number, don't convert (but still allow typing)
      if (isNaN(inputValue)) {
        return;
      }
      
      // Convert from current currency back to PKR
      const valueInPKR = convertToPKR(inputValue, currentCurrency.code);
      
      // Create a synthetic event with the PKR value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: valueInPKR.toString(),
          name: e.target.name,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  // Handle blur - format the value when user leaves the field
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    // Format the value on blur
    const inputValueStr = rawInputValue.trim();
    if (inputValueStr === '') {
      setRawInputValue('');
    } else {
      const inputValue = parseFloat(inputValueStr);
      if (!isNaN(inputValue)) {
        // Format to 2 decimal places on blur
        const formatted = inputValue.toFixed(2);
        setRawInputValue(formatted);
      }
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };

  // Handle focus - track that user is typing
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Determine what to display
  // While focused: show raw input (what user is typing)
  // While not focused: show formatted value or empty
  const displayValue = isFocused 
    ? rawInputValue 
    : (valueInPKR !== undefined && valueInPKR !== null && valueInPKR !== 0)
      ? convertToCurrentCurrency(valueInPKR).toFixed(2)
      : '';

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="decimal"
      size={size}
      error={error}
      containerClassName={containerClassName}
      label={label}
      helperText={helperText}
      prefix={showSymbol ? currentCurrency.symbol : undefined}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder="0.00"
      {...props}
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;
