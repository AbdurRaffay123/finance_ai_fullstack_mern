# Budget Model Structure & Usage

## 📊 Model Design

### Database Schema (`UserBudget`)

The `UserBudget` model is designed to **save ALL months' budgets** entered by the user while ensuring only the **current month budget** is used in calculations and displays throughout the application.

#### Schema Fields:
```javascript
{
  userId: ObjectId,        // Reference to User (indexed, NOT unique)
  monthlyBudget: Number,   // Budget amount (min: 0)
  currentMonth: String,    // Format: "YYYY-MM" (e.g., "2024-12")
  createdAt: Date,         // When budget was first created
  updatedAt: Date          // When budget was last updated
}
```

#### Indexes:
1. **Compound Unique Index**: `{ userId: 1, currentMonth: 1 }`
   - Ensures one budget per user per month
   - Prevents duplicate budgets for the same month
   - Allows multiple budgets across different months

2. **Query Index**: `{ userId: 1, currentMonth: -1 }`
   - Efficient queries for budget history
   - Sorted by month (most recent first)

### Key Features:
- ✅ **Saves ALL months' budgets** - Every budget entered is stored permanently
- ✅ **One budget per month per user** - No duplicates allowed
- ✅ **Efficient queries** - Indexed for fast lookups
- ✅ **Historical tracking** - Complete budget history available

## 🎯 Budget Usage Strategy

### Current Month Budget Only (Used in Calculations)

These components **ONLY** use the current month budget:

1. **Dashboard** (`src/pages/Dashboard.tsx`)
   - Calls: `getBudget()` (no month parameter)
   - Usage: Displays current month budget and remaining budget
   - Purpose: Shows real-time budget status

2. **Predictions** (`src/pages/Predictions.tsx`)
   - Calls: `getBudget()` (no month parameter)
   - Usage: Used as income fallback in prediction model
   - Purpose: AI predictions based on current month budget

3. **AI Recommendations** (`src/pages/AIRecommendations.tsx`)
   - Calls: `getBudget()` (no month parameter)
   - Usage: Included in financial summary for AI analysis
   - Purpose: Recommendations based on current month budget

### All Months' Budgets (Used for History)

1. **Budget Management** (`src/pages/BudgetManagement.tsx`)
   - Calls: `getBudget(month)` - Can fetch any month
   - Calls: `getBudgetHistory(50)` - Fetches up to 50 months of history
   - Usage: View/edit budgets for any month, see complete history
   - Purpose: Historical budget management

## 🔌 API Endpoints

### GET `/api/budget`
- **Purpose**: Get current month budget (default) or specific month
- **Usage**: 
  - `GET /api/budget` → Returns current month budget
  - `GET /api/budget?month=2024-11` → Returns specific month budget
- **Used by**: Dashboard, Predictions, AI Recommendations (current month only)
- **Used by**: Budget Management (can specify any month)

### PUT `/api/budget`
- **Purpose**: Create or update budget for a month
- **Body**: `{ monthlyBudget: 5000, month: "2024-12" }`
- **Behavior**: 
  - If month not provided → defaults to current month
  - If budget exists for month → updates it
  - If budget doesn't exist → creates new one
- **Validation**: 
  - Past months ✅ Allowed
  - Current month ✅ Allowed
  - Future months ❌ Blocked

### GET `/api/budget/history`
- **Purpose**: Get ALL months' budgets for user
- **Query**: `?limit=50` (optional, default: 24)
- **Returns**: Array of all budgets sorted by month (most recent first)
- **Used by**: Budget Management page to show complete history

## 📋 Budget History Display

The Budget History section shows:
- ✅ **All months' budgets** entered by the user
- ✅ **Sorted by month** (most recent first)
- ✅ **Current month highlighted** (with special styling)
- ✅ **Past/Future labels** for each month
- ✅ **Budget amounts** in user's selected currency
- ✅ **Update dates** for each budget

## 🔒 Data Integrity

### Constraints:
1. **One budget per month**: Compound unique index prevents duplicates
2. **No future months**: Validation blocks future month budgets
3. **Permanent storage**: All budgets are saved and never deleted
4. **Current month default**: API defaults to current month when no month specified

### Best Practices:
- Always use `getBudget()` without parameters for Dashboard/Predictions/AI
- Use `getBudget(month)` only in Budget Management page
- Budget History shows all months, but calculations use current month only

## 📝 Example Usage

### Dashboard (Current Month Only)
```javascript
// Always gets current month budget
const budget = await getBudget();
// budget.monthlyBudget = current month budget only
```

### Budget Management (Any Month)
```javascript
// Get specific month budget
const budget = await getBudget("2024-11");

// Get all months' budgets
const history = await getBudgetHistory(50);
// history = array of all budgets sorted by month
```

### Predictions (Current Month Only)
```javascript
// Always uses current month budget
const budget = await getBudget();
const income = budget?.monthlyBudget || 0; // Fallback for income
```

## ✅ Summary

- **Model Structure**: Saves ALL months' budgets permanently
- **Current Month Usage**: Dashboard, Predictions, AI Recommendations use current month only
- **History Display**: Budget Management shows all months' budgets
- **Data Integrity**: One budget per month, no duplicates, no future months
- **Efficient Queries**: Indexed for fast lookups

