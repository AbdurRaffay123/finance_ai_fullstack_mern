// routes/budget.js

const express = require('express');
const UserBudget = require('../models/UserBudget');
const jwt = require('jsonwebtoken');

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

// Get current month budget for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    
    let budget = await UserBudget.findOne({ userId: req.user.id });
    
    // If no budget exists or it's a new month, create/update budget
    if (!budget || budget.currentMonth !== currentMonth) {
      if (!budget) {
        // Create new budget with default value
        budget = new UserBudget({
          userId: req.user.id,
          monthlyBudget: 0, // Default budget
          currentMonth: currentMonth
        });
        await budget.save();
      } else {
        // Update existing budget for new month
        budget.currentMonth = currentMonth;
        await budget.save();
      }
    }
    
    res.json(budget);
  } catch (err) {
    console.error('Error retrieving budget:', err);
    res.status(500).json({ message: 'Error retrieving budget' });
  }
});

// Update monthly budget
router.put('/', verifyToken, async (req, res) => {
  try {
    const { monthlyBudget } = req.body;
    
    if (!monthlyBudget || monthlyBudget < 0) {
      return res.status(400).json({ message: 'Invalid budget amount' });
    }
    
    const currentDate = new Date();
    const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    
    let budget = await UserBudget.findOne({ userId: req.user.id });
    
    if (!budget) {
      // Create new budget
      budget = new UserBudget({
        userId: req.user.id,
        monthlyBudget: monthlyBudget,
        currentMonth: currentMonth
      });
    } else {
      // Update existing budget
      budget.monthlyBudget = monthlyBudget;
      budget.currentMonth = currentMonth;
    }
    
    await budget.save();
    res.json(budget);
  } catch (err) {
    console.error('Error updating budget:', err);
    res.status(500).json({ message: 'Error updating budget' });
  }
});

// Get budget history (previous months)
router.get('/history', verifyToken, async (req, res) => {
  try {
    const budgets = await UserBudget.find({ userId: req.user.id })
      .sort({ currentMonth: -1 })
      .limit(12); // Last 12 months
    
    res.json(budgets);
  } catch (err) {
    console.error('Error retrieving budget history:', err);
    res.status(500).json({ message: 'Error retrieving budget history' });
  }
});

module.exports = router;
