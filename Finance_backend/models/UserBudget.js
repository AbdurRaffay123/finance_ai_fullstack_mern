const mongoose = require('mongoose');

/**
 * UserBudget Model
 * 
 * Stores monthly budgets for users. Each user can have multiple budgets (one per month).
 * 
 * Key Features:
 * - Saves ALL months' budgets entered by the user
 * - One budget per user per month (enforced by compound unique index)
 * - Efficient queries by userId and month
 * 
 * Usage:
 * - Dashboard, Predictions, AI Recommendations: Use current month budget only
 * - Budget Management: Can view/edit budgets for any month
 * - Budget History: Shows all months' budgets
 */
const userBudgetSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // Indexed but NOT unique (allows multiple budgets per user for different months)
  },
  monthlyBudget: { 
    type: Number, 
    required: true,
    min: 0
  },
  currentMonth: {
    type: String, // Format: "YYYY-MM" (e.g., "2024-12")
    required: true,
    index: true, // Indexed for efficient queries
    comment: 'Month identifier in YYYY-MM format. Allows storing budgets for multiple months.'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound unique index: One budget per user per month
// This ensures users can have multiple budgets (one per month) but not duplicates
// Example: User can have budget for "2024-11", "2024-12", "2025-01", etc.
userBudgetSchema.index({ userId: 1, currentMonth: 1 }, { unique: true });

// Index for efficient month-based queries (most recent first)
// Used by Budget History to fetch all budgets sorted by month
userBudgetSchema.index({ userId: 1, currentMonth: -1 });

// Update the updatedAt field before saving
userBudgetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const UserBudget = mongoose.model('UserBudget', userBudgetSchema);
module.exports = UserBudget;
