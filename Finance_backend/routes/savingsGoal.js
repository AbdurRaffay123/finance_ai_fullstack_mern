const express = require('express');
const router = express.Router();
const SavingsGoal = require('../models/SavingsGoal');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access denied' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// GET all savings goals for logged-in user (optionally filtered by month)
// GET /savingsGoals?month=2024-12
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = { userId: req.user.id };
    
    // If month parameter is provided, filter by currentMonth field
    // For backward compatibility, also check createdAt if currentMonth doesn't exist or is empty
    if (req.query.month) {
      const [year, month] = req.query.month.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      
      console.log('=== GET /savingsGoals ===');
      console.log('Requested month:', req.query.month);
      console.log('Date range:', startOfMonth, 'to', endOfMonth);
      
      // Filter by currentMonth if it exists and matches, otherwise fall back to createdAt
      query.$or = [
        { currentMonth: req.query.month },
        { 
          $or: [
            { currentMonth: { $exists: false } },
            { currentMonth: null },
            { currentMonth: '' }
          ],
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      ];
      
      console.log('Query:', JSON.stringify(query, null, 2));
    }
    
    const goals = await SavingsGoal.find(query).sort({ deadline: 1 });
    console.log('Found goals:', goals.length);
    goals.forEach(goal => {
      console.log(`  - ${goal.name}: currentMonth=${goal.currentMonth}, createdAt=${goal.createdAt}`);
    });
    res.json(goals);
  } catch (err) {
    console.error('Error fetching savings goals:', err);
    res.status(500).json({ message: 'Failed to fetch savings goals' });
  }
});

// POST create new savings goal
router.post('/', verifyToken, async (req, res) => {
  const { name, targetAmount, currentAmount, deadline, category, month } = req.body;
  if (!name || !targetAmount || !deadline || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    // Determine the month for this goal
    // Priority: 1) Provided month (selectedMonth from frontend), 2) Current month
    // NOTE: We use selectedMonth, NOT deadline month, because the user selects which month to create the goal for
    let currentMonth;
    if (month) {
      // Use provided month (from selectedMonth in frontend) - this is the month the user is viewing
      currentMonth = month;
      console.log('Creating goal with provided month:', currentMonth);
    } else {
      // Default to current month if not provided (shouldn't happen if frontend passes selectedMonth)
      const now = new Date();
      currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      console.log('Creating goal with default (current) month:', currentMonth);
    }

    const newGoal = new SavingsGoal({
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline,
      category,
      userId: req.user.id,
      currentMonth,
    });
    await newGoal.save();
    console.log('Goal created:', { name: newGoal.name, currentMonth: newGoal.currentMonth, deadline: newGoal.deadline });
    res.status(201).json(newGoal);
  } catch (err) {
    console.error('Error creating savings goal:', err);
    res.status(500).json({ message: 'Failed to create savings goal' });
  }
});

// PATCH update only currentAmount (saved amount) for a goal
router.patch('/:id/currentAmount', verifyToken, async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    const { currentAmount } = req.body;
    if (currentAmount === undefined)
      return res.status(400).json({ message: 'currentAmount is required' });

    goal.currentAmount = currentAmount;
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update saved amount' });
  }
});

// PUT update savings goal (full update)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    const { name, targetAmount, currentAmount, deadline, category } = req.body;

    goal.name = name ?? goal.name;
    goal.targetAmount = targetAmount ?? goal.targetAmount;
    goal.currentAmount = currentAmount ?? goal.currentAmount;
    goal.deadline = deadline ?? goal.deadline;
    goal.category = category ?? goal.category;

    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update savings goal' });
  }
});

// DELETE savings goal
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    await goal.deleteOne();
    res.json({ message: 'Savings goal deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete savings goal' });
  }
});

module.exports = router;
