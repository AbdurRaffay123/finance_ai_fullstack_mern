# Input Component System

## 🎯 Problem Solved

**Global UI Issue**: Input fields with icons/prefixes (email, lock, currency symbols) were overlapping with user-typed text, causing poor UX and accessibility issues.

### ❌ Before (Broken)
```tsx
<div className="relative">
  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2" />
  <input className="pl-10 pr-3 py-2" /> {/* Text overlaps with icon */}
</div>
```

### ✅ After (Fixed)
```tsx
<Input leftIcon={Mail} placeholder="you@example.com" />
```

## 🏗️ Solution Architecture

### 1. **Reusable Input Component** (`Input.tsx`)
- Handles left/right icons automatically
- Supports text prefixes/suffixes
- Proper spacing calculations
- Accessibility compliant
- Size variants (sm, md, lg)

### 2. **Currency Input Component** (`CurrencyInput.tsx`)
- Integrates with currency context
- Automatic currency conversion
- Symbol display
- PKR base currency support

### 3. **CSS Fix** (`global.css`)
- Removed conflicting padding from `.input-focus`
- Now handled by component logic

## 📖 Usage Examples

### Basic Email Input
```tsx
import { Input } from '../components';
import { Mail } from 'lucide-react';

<Input
  type="email"
  label="Email address"
  leftIcon={Mail}
  placeholder="you@example.com"
  value={email}
  onChange={handleChange}
/>
```

### Password with Toggle
```tsx
<Input
  type={showPassword ? "text" : "password"}
  label="Password"
  leftIcon={Lock}
  rightIcon={showPassword ? EyeOff : Eye}
  placeholder="••••••••"
  value={password}
  onChange={handleChange}
  onRightIconClick={() => setShowPassword(!showPassword)}
/>
```

### Currency Input
```tsx
import { CurrencyInput } from '../components';

<CurrencyInput
  label="Amount"
  valueInPKR={amountInPKR}
  placeholder="0.00"
  onChange={(e) => setAmountInPKR(Number(e.target.value))}
/>
```

### Text Input with Prefix
```tsx
<Input
  type="text"
  label="Phone"
  prefix="+1"
  placeholder="(555) 000-0000"
  value={phone}
  onChange={handleChange}
/>
```

## 🔧 Props API

### Input Props
```tsx
interface InputProps {
  // Core input props
  type?: string;
  value?: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;

  // Icon props
  leftIcon?: LucideIcon | ReactNode;
  rightIcon?: LucideIcon | ReactNode;

  // Text props
  prefix?: string;
  suffix?: string;

  // Styling
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  containerClassName?: string;

  // Labels
  label?: string;
  helperText?: string;

  // Events
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRightIconClick?: () => void;

  // Rest of HTML input props
  ...React.InputHTMLAttributes<HTMLInputElement>
}
```

### CurrencyInput Props
```tsx
interface CurrencyInputProps extends Omit<InputProps, 'type' | 'value'> {
  valueInPKR?: number; // Amount in base currency (PKR)
  showSymbol?: boolean; // Show currency symbol (default: true)
}
```

## 🎨 Size Variants

### Small (`size="sm"`)
- Icon: `w-4 h-4`
- Padding: `pl-9 pr-9` (with icons)
- Text: `text-sm`

### Medium (`size="md"`) - Default
- Icon: `w-5 h-5`
- Padding: `pl-10 pr-10` (with icons)
- Text: `text-base`

### Large (`size="lg"`)
- Icon: `w-6 h-6`
- Padding: `pl-12 pr-12` (with icons)
- Text: `text-lg`

## 🚀 Migration Guide

### Replace Old Inputs
```tsx
// ❌ Old (overlapping)
<div className="relative">
  <Mail className="absolute inset-y-0 left-0 pl-3" />
  <input className="pl-10 input-focus" />
</div>

// ✅ New (proper spacing)
<Input leftIcon={Mail} className="input-focus" />
```

### Update Imports
```tsx
// Single import
import { Input, CurrencyInput } from '../components';

// Or individual
import Input from '../components/Input';
import CurrencyInput from '../components/CurrencyInput';
```

## 🎯 Key Features

### ✅ **No Overlap Ever**
- Dynamic padding calculation
- Icon positioned with `pointer-events-none`
- Text starts after proper spacing

### ✅ **Accessibility**
- Proper `aria-label` support
- Keyboard navigation for right icons
- Screen reader friendly

### ✅ **Responsive**
- Mobile and desktop optimized
- Touch-friendly sizing

### ✅ **Flexible**
- Left/right icons
- Text prefixes/suffixes
- Multiple sizes
- Error states

### ✅ **Currency Integration**
- Automatic conversion
- Symbol display
- Context-aware formatting

## 🔍 Technical Implementation

### Padding Calculation Logic
```tsx
const getPaddingClasses = () => {
  const hasLeft = leftIcon || prefix;
  const hasRight = rightIcon || suffix;

  return `
    ${hasLeft ? 'pl-10' : 'pl-3'}  // sm: pl-9, lg: pl-12
    ${hasRight ? 'pr-10' : 'pr-3'} // sm: pr-9, lg: pr-12
  `;
};
```

### Icon Positioning
```tsx
// Left icons positioned with proper spacing
<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
  <Icon className="icon-size text-primary-400" />
</div>

// Right icons are clickable buttons
<button className="absolute inset-y-0 right-0 pr-3 flex items-center z-10">
  <Icon className="icon-size text-primary-400 hover:text-primary-600" />
</button>
```

## 🎉 Result

- **Zero overlap** across all input fields
- **Consistent UX** throughout the application
- **Easy to use** component API
- **Scalable** for future input types
- **Production-ready** code quality
