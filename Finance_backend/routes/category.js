const express = require('express');
const Category = require('../models/Category');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Default expense categories that should appear for all months
// These match the categories shown in the Expense Management UI
// Note: Names are stored with spaces (e.g., "Eating Out") but prediction system uses underscores (e.g., "Eating_Out")
const DEFAULT_CATEGORIES = [
  { name: 'Income', color: '#10B981' }, // Green for income
  { name: 'Groceries', color: '#EF4444' }, // Red for groceries
  { name: 'Transport', color: '#3B82F6' }, // Blue for transport
  { name: 'Eating Out', color: '#EC4899' }, // Pink for eating out (stored as "Eating Out", dropdown shows "Eating_Out")
  { name: 'Entertainment', color: '#8B5CF6' }, // Purple for entertainment
  { name: 'Utilities', color: '#F59E0B' }, // Orange for utilities
  { name: 'Miscellaneous', color: '#6B7280' }, // Gray for miscellaneous
  { name: 'Healthcare', color: '#14B8A6' }, // Teal for healthcare
  { name: 'Education', color: '#06B6D4' }, // Cyan for education
  { name: 'Insurance', color: '#A855F7' }, // Purple for insurance
  { name: 'Rent', color: '#F97316' }, // Orange for rent
  { name: 'Loan Repayment', color: '#DC2626' }, // Dark red for loan repayment (stored as "Loan Repayment", dropdown shows "Loan_Repayment")
];

// Helper function to check if a month is current or previous (not future)
const isCurrentOrPreviousMonth = (monthString) => {
  const [year, month] = monthString.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, 1);
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Return true if selected month is current month or before
  return selectedDate <= currentMonth;
};

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

// Add a category (creates only for the specified month)
router.post('/', verifyToken, async (req, res) => {
  const { name, color, budget, month } = req.body;
  try {
    // Determine the month for this category
    let currentMonth;
    if (month) {
      currentMonth = month;
    } else {
      // Default to current month if not provided
      const now = new Date();
      currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    
    // Validate month is current or previous (not future)
    if (!isCurrentOrPreviousMonth(currentMonth)) {
      return res.status(400).json({ 
        message: 'Categories can only be created for current and previous months' 
      });
    }
    
    // Check if category already exists for this month
    const existingCategory = await Category.findOne({
      userId: req.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      currentMonth: currentMonth
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Category already exists for this month' 
      });
    }

    const newCategory = new Category({
      name,
      color: color || DEFAULT_CATEGORIES.find(dc => dc.name.toLowerCase() === name.toLowerCase())?.color || '#059669',
      budget: budget || 0,
      spentAmount: 0,
      userId: req.user.id,
      currentMonth,
    });

    await newCategory.save();
    console.log('Category created:', { name: newCategory.name, currentMonth: newCategory.currentMonth });
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error saving category:', error);
    res.status(500).json({ message: 'Error saving category' });
  }
});

// Get all categories for user (optionally filtered by month)
// GET /categories?month=2024-12
// Returns all default categories + user-created categories for the selected month
// Default categories show budget=0/spentAmount=0 if not set for that month
// If month=all or no month, aggregates data from all previous months + current month
router.get('/', verifyToken, async (req, res) => {
  try {
    const selectedMonth = req.query.month;
    const isAllMonths = !selectedMonth || selectedMonth === 'all';
    
    if (isAllMonths) {
      // Aggregate categories from all previous months + current month
      const now = new Date();
      const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get all categories from current and previous months only
      const allCategories = await Category.find({ userId: req.user.id });
      
      // Filter to only include categories from current and previous months
      const validCategories = allCategories.filter(cat => {
        if (!cat.currentMonth) return false;
        const [year, month] = cat.currentMonth.split('-').map(Number);
        const categoryDate = new Date(year, month - 1, 1);
        return categoryDate <= currentMonthStart;
      });
      
      // Aggregate by category name (sum budget and spentAmount)
      const categoryMap = new Map();
      
      validCategories.forEach(cat => {
        const key = cat.name.toLowerCase();
        if (!categoryMap.has(key)) {
          categoryMap.set(key, {
            name: cat.name,
            color: cat.color,
            budget: 0,
            spentAmount: 0,
            userId: cat.userId,
            currentMonth: 'all',
            isDefault: DEFAULT_CATEGORIES.some(dc => dc.name.toLowerCase() === key)
          });
        }
        const aggregated = categoryMap.get(key);
        aggregated.budget += cat.budget || 0;
        aggregated.spentAmount += cat.spentAmount || 0;
      });
      
      // Build result array with all default categories + aggregated user categories
      const result = [];
      
      // Add all default categories (with aggregated data if exists)
      for (const defaultCat of DEFAULT_CATEGORIES) {
        const aggregated = categoryMap.get(defaultCat.name.toLowerCase());
        if (aggregated) {
          result.push({
            _id: `all-${defaultCat.name.toLowerCase().replace(/\s+/g, '-')}`,
            ...aggregated
          });
        } else {
          // Default category with no data, show with 0 values
          result.push({
            _id: `all-${defaultCat.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: defaultCat.name,
            color: defaultCat.color,
            budget: 0,
            spentAmount: 0,
            userId: req.user.id,
            currentMonth: 'all',
            isDefault: true
          });
        }
      }
      
      // Add any user-created categories that are not in the default list
      categoryMap.forEach((aggregated, key) => {
        const isDefault = DEFAULT_CATEGORIES.some(
          dc => dc.name.toLowerCase() === key
        );
        if (!isDefault) {
          result.push({
            _id: `all-${key.replace(/\s+/g, '-')}`,
            ...aggregated
          });
        }
      });
      
      console.log('Total aggregated categories returned:', result.length);
      res.json(result);
      return;
    }
    
    // Single month logic (existing code)
    // If month is provided, validate it's current or previous (not future)
    if (selectedMonth && !isCurrentOrPreviousMonth(selectedMonth)) {
      return res.status(400).json({ 
        message: 'Categories can only be viewed for current and previous months' 
      });
    }
    
    // If no month provided, use current month
    const monthToUse = selectedMonth || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    })();
    
    console.log('=== GET /categories ===');
    console.log('Requested month:', monthToUse);
    
    // Get all user-created categories for this month
    const userCategories = await Category.find({
      userId: req.user.id,
      currentMonth: monthToUse
    }).sort({ createdAt: -1 });
    
    console.log('Found user categories:', userCategories.length);
    
    // Create a map of user categories by name for quick lookup
    const userCategoryMap = new Map();
    userCategories.forEach(cat => {
      userCategoryMap.set(cat.name.toLowerCase(), cat);
    });
    
    // Build result array with all default categories + user-created categories
    const result = [];
    
    // Add all default categories
    for (const defaultCat of DEFAULT_CATEGORIES) {
      const userCat = userCategoryMap.get(defaultCat.name.toLowerCase());
      
      if (userCat) {
        // User has created this category for this month, use their version
        result.push(userCat);
      } else {
        // Default category doesn't exist for this month, create a virtual one with 0 values
        // Check if user has this category name in any month to get their preferred color
        const existingCat = await Category.findOne({
          userId: req.user.id,
          name: { $regex: new RegExp(`^${defaultCat.name}$`, 'i') }
        }).sort({ createdAt: -1 });
        
        result.push({
          _id: `default-${defaultCat.name.toLowerCase().replace(/\s+/g, '-')}-${monthToUse}`,
          name: defaultCat.name,
          color: existingCat?.color || defaultCat.color,
          budget: 0,
          spentAmount: 0,
          userId: req.user.id,
          currentMonth: monthToUse,
          isDefault: true, // Flag to indicate this is a default category
          createdAt: null,
          updatedAt: null
        });
      }
    }
    
    // Add any user-created categories that are not in the default list
    userCategories.forEach(cat => {
      const isDefault = DEFAULT_CATEGORIES.some(
        dc => dc.name.toLowerCase() === cat.name.toLowerCase()
      );
      if (!isDefault) {
        result.push(cat);
      }
    });
    
    console.log('Total categories returned:', result.length);
    res.json(result);
  } catch (err) {
    console.error('Error retrieving categories:', err);
    res.status(500).json({ message: 'Error retrieving categories' });
  }
});

// PATCH update spentAmount for a category (increment, month-specific)
router.patch('/:id/spentAmount', verifyToken, async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);
    
    // If category not found, it might be a default category (virtual)
    // In this case, we need to create it first
    if (!category) {
      const { name, month } = req.body;
      
      if (!name || !month) {
        return res.status(400).json({ 
          message: 'Category name and month required to create default category' 
        });
      }
      
      // Validate month is current or previous
      if (!isCurrentOrPreviousMonth(month)) {
        return res.status(400).json({ 
          message: 'Spent amount can only be added for current and previous months' 
        });
      }
      
      // Create the category for this month
      category = new Category({
        name,
        color: DEFAULT_CATEGORIES.find(dc => dc.name.toLowerCase() === name.toLowerCase())?.color || '#059669',
        budget: 0,
        spentAmount: 0,
        userId: req.user.id,
        currentMonth: month,
      });
    }
    
    if (category.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    // Increment spent amount (month-specific)
    category.spentAmount = (category.spentAmount || 0) + amount;
    await category.save();

    console.log('Spent amount updated:', { 
      name: category.name, 
      currentMonth: category.currentMonth, 
      spentAmount: category.spentAmount 
    });
    res.json(category);
  } catch (err) {
    console.error('Error updating spent amount:', err);
    res.status(500).json({ message: 'Error updating spent amount' });
  }
});

// Update a category (updates only the specific month)
// If category doesn't exist for that month, creates it
router.put('/:id', verifyToken, async (req, res) => {
  const { name, color, budget, month } = req.body;
  try {
    let category = await Category.findById(req.params.id);
    
    // If category not found, it might be a default category (virtual)
    // Check if we need to create it for the specified month
    if (!category) {
      const selectedMonth = month || (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      })();
      
      // Validate month is current or previous
      if (!isCurrentOrPreviousMonth(selectedMonth)) {
        return res.status(400).json({ 
          message: 'Categories can only be updated for current and previous months' 
        });
      }
      
      // Try to find by name and month
      category = await Category.findOne({
        userId: req.user.id,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        currentMonth: selectedMonth
      });
      
      // If still not found, create new category for this month
      if (!category) {
        category = new Category({
          name,
          color: color || DEFAULT_CATEGORIES.find(dc => dc.name.toLowerCase() === name.toLowerCase())?.color || '#059669',
          budget: budget || 0,
          spentAmount: 0,
          userId: req.user.id,
          currentMonth: selectedMonth,
        });
        await category.save();
        console.log('Category created during update:', { name: category.name, currentMonth: category.currentMonth });
        return res.json(category);
      }
    }
    
    // Verify ownership
    if (category.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });
    
    // Update only the fields provided (month-specific update)
    if (name !== undefined) category.name = name;
    if (color !== undefined) category.color = color;
    if (budget !== undefined) category.budget = budget;

    await category.save();
    console.log('Category updated:', { name: category.name, currentMonth: category.currentMonth, budget: category.budget });
    res.json(category);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Delete a category (deletes only from the specific month)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      // If it's a default category (virtual), return success (nothing to delete)
      if (req.params.id.startsWith('default-')) {
        return res.json({ message: 'Default category cannot be deleted' });
      }
      return res.status(404).json({ message: 'Category not found' });
    }
    
    if (category.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });
    
    // Check if it's a default category - if so, just reset values instead of deleting
    const isDefault = DEFAULT_CATEGORIES.some(
      dc => dc.name.toLowerCase() === category.name.toLowerCase()
    );
    
    if (isDefault) {
      // Reset default category to 0 values instead of deleting
      category.budget = 0;
      category.spentAmount = 0;
      await category.save();
      console.log('Default category reset:', { name: category.name, currentMonth: category.currentMonth });
      return res.json({ message: 'Default category reset to zero', category });
    }

    // Delete user-created category (only for this month)
    await category.deleteOne();
    console.log('Category deleted:', { name: category.name, currentMonth: category.currentMonth });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

module.exports = router;
