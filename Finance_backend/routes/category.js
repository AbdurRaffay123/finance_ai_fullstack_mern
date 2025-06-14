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
  const { name, color, budget } = req.body;
  try {
    const newCategory = new Category({
      name,
      color,
      budget,
      userId: req.user.id,
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving category' });
  }
});

// Get all categories for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id });
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
