import React, { forwardRef } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
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
      // Convert the input value back to PKR for storage
      const inputValue = parseFloat(e.target.value) || 0;
      // Create a synthetic event with the PKR value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: inputValue.toString(),
          name: e.target.name,
        },
      };
      onChange(syntheticEvent);
    }
  };

  // Format the display value
  const formattedDisplayValue = displayValue !== undefined
    ? displayValue.toFixed(2)
    : props.value as string;

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
