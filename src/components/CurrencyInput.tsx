import React, { forwardRef } from 'react';
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
  ...props
}, ref) => {
  const { currentCurrency, formatCurrency, convertToCurrentCurrency } = useCurrency();

  // Convert PKR value to current currency for display
  const displayValue = valueInPKR !== undefined ? convertToCurrentCurrency(valueInPKR) : undefined;

  // Handle input changes by converting back to PKR
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      // Get the input value (in current currency)
      const inputValueStr = e.target.value.trim();
      
      // If input is empty, pass empty string (parent component should handle as undefined)
      if (inputValueStr === '') {
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
      
      const inputValue = parseFloat(inputValueStr);
      
      // If not a valid number, don't convert
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

  // Format the display value
  // If valueInPKR is undefined, 0, or null, show empty string (not "0.00")
  // This allows the placeholder "0.00" to be visible
  const formattedDisplayValue = (valueInPKR !== undefined && valueInPKR !== null && valueInPKR !== 0)
    ? convertToCurrentCurrency(valueInPKR).toFixed(2)
    : (props.value !== undefined ? props.value : '');

  return (
    <Input
      ref={ref}
      type="number"
      step="0.01"
      min="0"
      size={size}
      error={error}
      containerClassName={containerClassName}
      label={label}
      helperText={helperText}
      prefix={showSymbol ? currentCurrency.symbol : undefined}
      value={formattedDisplayValue}
      onChange={handleChange}
      placeholder="0.00"
      {...props}
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;
