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

// GET all savings goals for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ userId: req.user.id }).sort({ deadline: 1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch savings goals' });
  }
});

// POST create new savings goal
router.post('/', verifyToken, async (req, res) => {
  const { name, targetAmount, currentAmount, deadline, category } = req.body;
  if (!name || !targetAmount || !deadline || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const newGoal = new SavingsGoal({
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline,
      category,
      userId: req.user.id,
    });
    await newGoal.save();
    res.status(201).json(newGoal);
  } catch (err) {
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
