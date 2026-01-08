const express = require('express');
const Category = require('../models/Category');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access denied' });

  // Expect token as 'Bearer <token>'
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Add a category
router.post('/', verifyToken, async (req, res) => {
  const { name, color, budget, month } = req.body;
  try {
    // Determine the month for this category
    let currentMonth;
    if (month) {
      // Use provided month (from selectedMonth in frontend)
      currentMonth = month;
    } else {
      // Default to current month if not provided
      const now = new Date();
      currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const newCategory = new Category({
      name,
      color,
      budget,
      userId: req.user.id,
      currentMonth,
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving category' });
  }
});

// Get all categories for user (optionally filtered by month)
// GET /categories?month=2024-12
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = { userId: req.user.id };
    
    // If month parameter is provided, filter by currentMonth field
    // For backward compatibility, also check createdAt if currentMonth doesn't exist or is empty
    if (req.query.month) {
      const [year, month] = req.query.month.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      
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
    }
    
    const categories = await Category.find(query).sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving categories' });
  }
});

// PATCH update spentAmount for a category (increment)
router.patch('/:id/spentAmount', verifyToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    if (category.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    category.spentAmount += amount;
    await category.save();

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Error updating spent amount' });
  }
});

// Update a category (with user ownership check)
router.put('/:id', verifyToken, async (req, res) => {
  const { name, color, budget } = req.body;
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    if (category.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    category.name = name;
    category.color = color;
    category.budget = budget;

    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Delete a category (with user ownership check)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    if (category.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    await category.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting category' });
  }
});

module.exports = router;
