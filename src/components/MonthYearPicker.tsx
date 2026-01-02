import React from 'react';
import { Calendar } from 'lucide-react';
import Input from './Input';

interface MonthYearPickerProps {
  value: string; // Format: "YYYY-MM"
  onChange: (monthYear: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  maxMonthsBack?: number; // Maximum months in the past (default: 12)
  className?: string;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  label,
  error,
  disabled = false,
  maxMonthsBack = 12,
  className = '',
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Calculate max date (current month)
  const maxDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  
  // Calculate min date (maxMonthsBack months ago)
  const minDateObj = new Date(currentYear, currentMonth - maxMonthsBack - 1, 1);
  const minYear = minDateObj.getFullYear();
  const minMonth = minDateObj.getMonth() + 1;
  const minDate = `${minYear}-${String(minMonth).padStart(2, '0')}`;

  const formatDisplayValue = () => {
    if (!value) return '';
    const [year, month] = value.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue) {
      // Convert from "YYYY-MM" format (HTML5 month input format)
      onChange(inputValue);
    }
  };

  return (
    <div className={className}>
      <Input
        type="month"
        label={label}
        leftIcon={Calendar}
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        error={!!error}
        min={minDate}
        max={maxDate}
        className=""
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {value && (
        <p className="mt-1 text-xs text-gray-500">
          {formatDisplayValue()}
          {value === maxDate ? ' (Current month)' : ' (Past month)'}
        </p>
      )}
    </div>
  );
};

export default MonthYearPicker;
