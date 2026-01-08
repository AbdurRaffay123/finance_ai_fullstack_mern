// routes/budget.js

const express = require('express');
const mongoose = require('mongoose');
const UserBudget = require('../models/UserBudget');
const jwt = require('jsonwebtoken');
const { validateMonthYear, getCurrentMonth, formatMonthYear } = require('../utils/budgetValidator');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access denied, token missing' });

  const tokenWithoutBearer = token.split(' ')[1];
  jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('JWT verification failed:', err);
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get budget for user (current month by default, or specific month if provided)
// GET /api/budget - Returns current month budget (used by Dashboard, Predictions, AI Recommendations)
// GET /api/budget?month=2024-12 - Returns budget for specific month (used by Budget Management page)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Default to current month if no month parameter provided
    // This ensures Dashboard, Predictions, and AI Recommendations always use current month budget
    const requestedMonth = req.query.month || getCurrentMonth();
    
    // Validate month format if provided
    if (req.query.month) {
      const validation = validateMonthYear(requestedMonth);
      if (!validation.isValid) {
        return res.status(400).json({ message: validation.error });
      }
    }
    
    // Find budget for requested month
    let budget = await UserBudget.findOne({ 
      userId: req.user.id,
      currentMonth: requestedMonth
    });
    
    // If no budget exists for requested month, return default (don't auto-create)
    // This allows users to see they need to create a budget for that month
    if (!budget) {
      return res.json({
        _id: null,
        userId: req.user.id,
        monthlyBudget: 0,
        currentMonth: requestedMonth,
        createdAt: null,
        updatedAt: null,
      });
    }
    
    res.json(budget);
  } catch (err) {
    console.error('Error retrieving budget:', err);
    res.status(500).json({ message: 'Error retrieving budget' });
  }
});

// Update or create monthly budget for a specific month
// PUT /api/budget
// Body: { monthlyBudget: 5000, month: "2024-12" } (month is optional, defaults to current month)
// Uses findOneAndUpdate with upsert for atomic create/update operation
router.put('/', verifyToken, async (req, res) => {
  try {
    const { monthlyBudget, month } = req.body;
    
    console.log('Budget update request:', {
      userId: req.user.id,
      monthlyBudget,
      month,
      body: req.body
    });
    
    // Validate budget amount
    if (monthlyBudget === undefined || monthlyBudget === null) {
      return res.status(400).json({ message: 'Budget amount is required' });
    }
    
    if (typeof monthlyBudget !== 'number' || monthlyBudget < 0) {
      return res.status(400).json({ message: 'Invalid budget amount. Must be a non-negative number.' });
    }
    
    // Determine target month (use provided month or default to current month)
    const targetMonth = month || getCurrentMonth();
    
    console.log('Target month:', targetMonth);
    
    // Validate month/year selection
    const monthValidation = validateMonthYear(targetMonth);
    if (!monthValidation.isValid) {
      console.log('Month validation failed:', monthValidation.error);
      return res.status(400).json({ 
        message: monthValidation.error,
        field: 'month'
      });
    }
    
    console.log('Month validation passed');
    
    // Convert userId to ObjectId if it's a string
    const userId = mongoose.Types.ObjectId.isValid(req.user.id) 
      ? new mongoose.Types.ObjectId(req.user.id) 
      : req.user.id;
    
    console.log('Using userId:', userId);
    
    // Use findOneAndUpdate with upsert: true for atomic create/update
    // This prevents race conditions and duplicate key errors
    const budget = await UserBudget.findOneAndUpdate(
      { 
        userId: userId,
        currentMonth: targetMonth
      },
      { 
        $set: { 
          monthlyBudget: monthlyBudget,
          updatedAt: new Date()
        },
        $setOnInsert: { 
          userId: userId,
          currentMonth: targetMonth,
          createdAt: new Date()
        }
      },
      { 
        new: true,           // Return the updated document
        upsert: true,        // Create if doesn't exist
        runValidators: true  // Run schema validators
      }
    );
    
    console.log('Budget saved successfully:', budget._id);
    res.json(budget);
  } catch (err) {
    console.error('Error updating budget:', err);
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack
    });
    
    // Provide more detailed error message
    let errorMessage = 'Error updating budget';
    if (err.code === 11000) {
      // Check if it's a duplicate key error
      if (err.keyPattern && err.keyPattern.userId && !err.keyPattern.currentMonth) {
        // This means there's a unique index on userId alone (should not happen)
        errorMessage = 'Database configuration error: Please contact support. Error: Duplicate user budget constraint.';
        console.error('⚠️  CRITICAL: Unique index on userId alone detected! Run fix_budget_indexes.js');
      } else {
        errorMessage = 'A budget already exists for this month. Please update the existing budget instead.';
      }
    } else if (err.name === 'ValidationError') {
      errorMessage = `Validation error: ${err.message}`;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get budget history (ALL budgets for user, sorted by month descending)
// GET /api/budget/history?limit=24 (optional limit, default: 24 to show more history)
// Returns all months' budgets entered by the user
router.get('/history', verifyToken, async (req, res) => {
  try {
    // Default to 24 months to show comprehensive history
    // User can request more by passing limit parameter
    const limit = parseInt(req.query.limit) || 24;
    
    // Fetch ALL budgets for this user, sorted by month (most recent first)
    // This shows the complete budget history across all months
    const budgets = await UserBudget.find({ userId: req.user.id })
      .sort({ currentMonth: -1 }) // Most recent month first
      .limit(limit);
    
    res.json(budgets);
  } catch (err) {
    console.error('Error retrieving budget history:', err);
    res.status(500).json({ message: 'Error retrieving budget history' });
  }
});

module.exports = router;
