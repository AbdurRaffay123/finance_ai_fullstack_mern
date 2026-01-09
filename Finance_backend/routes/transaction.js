// routes/transaction.js

const express = require('express');
const Transaction = require('../models/Transaction');
const UserBudget = require('../models/UserBudget');
const Category = require('../models/Category');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization'); // Get token from the header
  if (!token) return res.status(401).json({ message: 'Access denied, token missing' });

  // Remove the 'Bearer ' part of the token
  const tokenWithoutBearer = token.split(' ')[1]; // Extract token from 'Bearer <token>'

  // Verify the token
  jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('JWT verification failed:', err); // Log error for debugging
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user; // Attach user data from the token to the request object
    next(); // Proceed to the next middleware or route handler
  });
};

// Helper function to get month string from date (YYYY-MM format)
const getMonthFromDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Helper function to check if a month is current or previous (not future)
const isCurrentOrPreviousMonth = (monthString) => {
  const [year, month] = monthString.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, 1);
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Return true if selected month is current month or before
  return selectedDate <= currentMonth;
};

// Helper function to update category spentAmount based on transactions
// This recalculates spentAmount from all transactions for that category in that month
const updateCategorySpentFromTransactions = async (userId, categoryName, transactionMonth) => {
  try {
    // Only update for current or previous months
    if (!isCurrentOrPreviousMonth(transactionMonth)) {
      console.log('Skipping category update for future month:', transactionMonth);
      return;
    }

    // Get the start and end of the month
    const [year, month] = transactionMonth.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Find all transactions for this category in this month
    // Only count negative amounts (expenses), ignore positive amounts (income)
    const transactions = await Transaction.find({
      userId,
      category: { $regex: new RegExp(`^${categoryName}$`, 'i') }, // Case-insensitive match
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Calculate total spent (sum of absolute values of negative amounts)
    const totalSpent = transactions
      .filter(tx => tx.amount < 0) // Only expenses (negative amounts)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    // Find or create the category for this month
    let category = await Category.findOne({
      userId,
      name: { $regex: new RegExp(`^${categoryName}$`, 'i') }, // Case-insensitive match
      currentMonth: transactionMonth
    });

    if (!category) {
      // Category doesn't exist for this month
      // First, check if user has this category in any other month (user-created category)
      const existingCategoryInOtherMonth = await Category.findOne({
        userId,
        name: { $regex: new RegExp(`^${categoryName}$`, 'i') } // Case-insensitive match
      }).sort({ createdAt: -1 });

      if (existingCategoryInOtherMonth) {
        // User has this category in another month, create it for this month with same color
        category = new Category({
          name: existingCategoryInOtherMonth.name, // Use the exact name from existing category
          color: existingCategoryInOtherMonth.color,
          budget: 0,
          spentAmount: totalSpent,
          userId,
          currentMonth: transactionMonth,
        });
        await category.save();
        console.log('User-created category auto-created for this month from transaction:', { 
          name: category.name, 
          currentMonth: category.currentMonth,
          spentAmount: category.spentAmount 
        });
      } else {
        // Check if it's a default category
        const DEFAULT_CATEGORIES = [
          'Income', 'Groceries', 'Transport', 'Eating Out', 'Entertainment',
          'Utilities', 'Miscellaneous', 'Healthcare', 'Education', 'Insurance',
          'Rent', 'Loan Repayment'
        ];
        
        const isDefault = DEFAULT_CATEGORIES.some(
          dc => dc.toLowerCase() === categoryName.toLowerCase()
        );

        if (isDefault) {
          // Create default category
          const defaultColors = {
            'Income': '#10B981', 'Groceries': '#EF4444', 'Transport': '#3B82F6',
            'Eating Out': '#EC4899', 'Entertainment': '#8B5CF6', 'Utilities': '#F59E0B',
            'Miscellaneous': '#6B7280', 'Healthcare': '#14B8A6', 'Education': '#06B6D4',
            'Insurance': '#A855F7', 'Rent': '#F97316', 'Loan Repayment': '#DC2626'
          };

          // Find the exact default category name (case-sensitive match)
          const exactDefaultName = DEFAULT_CATEGORIES.find(
            dc => dc.toLowerCase() === categoryName.toLowerCase()
          );

          category = new Category({
            name: exactDefaultName || categoryName,
            color: defaultColors[exactDefaultName] || defaultColors[categoryName] || '#059669',
            budget: 0,
            spentAmount: totalSpent,
            userId,
            currentMonth: transactionMonth,
          });
          await category.save();
          console.log('Default category auto-created from transaction:', { 
            name: category.name, 
            currentMonth: category.currentMonth,
            spentAmount: category.spentAmount 
          });
        } else {
          // Unknown category - create it anyway so transactions can track it
          category = new Category({
            name: categoryName,
            color: '#059669', // Default green color
            budget: 0,
            spentAmount: totalSpent,
            userId,
            currentMonth: transactionMonth,
          });
          await category.save();
          console.log('New category auto-created from transaction:', { 
            name: category.name, 
            currentMonth: category.currentMonth,
            spentAmount: category.spentAmount 
          });
        }
      }
    } else {
      // Update existing category's spentAmount
      category.spentAmount = totalSpent;
      await category.save();
      console.log('Category spentAmount updated from transactions:', { 
        name: category.name, 
        currentMonth: category.currentMonth,
        spentAmount: category.spentAmount 
      });
    }
  } catch (err) {
    console.error('Error updating category spentAmount from transactions:', err);
    // Don't throw error, just log it (transaction should still succeed)
  }
};

// Add a transaction
router.post('/', verifyToken, async (req, res) => {
  const { amount, category, date, description } = req.body;

  console.log('=== POST /transactions ===');
  console.log('Request body:', req.body);
  console.log('Description received:', description);
  console.log('Description type:', typeof description);
  console.log('Description length:', description ? description.length : 0);

  try {
    let transactionDate;
    if (date) {
      // If date is provided, use it directly
      transactionDate = new Date(date);
    } else {
      // If no date provided, use current date
      transactionDate = new Date();
    }

    // Build transaction object
    const transactionData = {
      amount,
      category,
      date: transactionDate,
      userId: req.user.id, // The user is authenticated via JWT token
    };

    // Only add description if it exists and is not empty
    if (description && typeof description === 'string' && description.trim().length > 0) {
      transactionData.description = description.trim();
    }

    console.log('Creating transaction with data:', transactionData);

    const newTransaction = new Transaction(transactionData);

    await newTransaction.save();
    console.log('Transaction saved successfully:', newTransaction);
    console.log('Description in saved transaction:', newTransaction.description);
    
    // Update category spentAmount based on this transaction
    const transactionMonth = getMonthFromDate(transactionDate);
    await updateCategorySpentFromTransactions(req.user.id, category, transactionMonth);
    
    res.status(201).json(newTransaction); // Send the created transaction back in the response
  } catch (err) {
    console.error('Error saving transaction:', err); // Log error for debugging
    res.status(500).json({ message: 'Error saving transaction' });
  }
});

// Get all transactions for a user (optionally filtered by month)
// GET /transactions?month=2024-12
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = { userId: req.user.id };
    
    // If month parameter is provided, filter by that month
    if (req.query.month) {
      const [year, month] = req.query.month.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: startOfMonth, $lte: endOfMonth };
    }
    
    const transactions = await Transaction.find(query).sort({ date: -1 });
    console.log('=== GET /transactions ===');
    console.log('Month filter:', req.query.month || 'All months');
    console.log('Found transactions:', transactions.length);
    if (transactions.length > 0) {
      console.log('First transaction:', JSON.stringify(transactions[0], null, 2));
      console.log('First transaction description:', transactions[0].description);
    }
    res.json(transactions); // Send the transactions back in the response
  } catch (err) {
    console.error('Error retrieving transactions:', err); // Log error for debugging
    res.status(500).json({ message: 'Error retrieving transactions' });
  }
});

// Get dashboard statistics (optionally filtered by month)
// GET /transactions/dashboard-stats?month=2024-12
// If no month parameter, returns all-time statistics
router.get('/dashboard-stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get selected month or "all" for all-time stats
    let selectedMonth = req.query.month;
    const isAllMonths = !selectedMonth || selectedMonth === 'all';
    
    if (isAllMonths) {
      // Aggregate data from all previous months + current month (not future months)
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Get all transactions from current and previous months only (not future)
      const allTransactions = await Transaction.find({ 
        userId,
        date: { $lte: endOfCurrentMonth } // Only up to end of current month
      });
      
      // Calculate total spending (sum of all negative amounts)
      const totalSpending = allTransactions
        .filter(tx => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      // Get all budgets for current and previous months only
      const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const allBudgets = await UserBudget.find({ userId });
      
      // Filter budgets to only include current and previous months
      const validBudgets = allBudgets.filter(budget => {
        if (!budget.currentMonth) return false;
        const [year, month] = budget.currentMonth.split('-').map(Number);
        const budgetDate = new Date(year, month - 1, 1);
        return budgetDate <= currentMonthStart;
      });
      
      const totalBudget = validBudgets.reduce((sum, budget) => sum + budget.monthlyBudget, 0);
      
      // Calculate total balance
      const totalBalance = Math.max(0, totalBudget - totalSpending);
      
      // Get previous period for comparison (last 30 days vs previous 30 days)
      const last30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last30DaysEnd = now;
      const prev30DaysStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const prev30DaysEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const [last30DaysTransactions, prev30DaysTransactions] = await Promise.all([
        Transaction.find({ 
          userId, 
          date: { $gte: last30DaysStart, $lte: last30DaysEnd } 
        }),
        Transaction.find({ 
          userId, 
          date: { $gte: prev30DaysStart, $lte: prev30DaysEnd } 
        })
      ]);
      
      const last30DaysSpending = last30DaysTransactions
        .filter(tx => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      const prev30DaysSpending = prev30DaysTransactions
        .filter(tx => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
      const spendingChange = prev30DaysSpending > 0 
        ? ((last30DaysSpending - prev30DaysSpending) / prev30DaysSpending) * 100 
        : 0;
      
      res.json({
        totalBalance: totalBalance,
        monthlySpending: totalSpending, // Total spending from all previous + current months
        spendingChange: Math.round(spendingChange * 100) / 100,
        totalTransactions: allTransactions.length
      });
    } else {
      // Month-specific statistics (existing logic)
      const [year, month] = selectedMonth.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      
      // Get previous month for comparison
      const prevMonthStart = new Date(year, month - 2, 1);
      const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
      
      const [selectedMonthTransactions, prevMonthTransactions, allTransactions] = await Promise.all([
        Transaction.find({ 
          userId, 
          date: { $gte: startOfMonth, $lte: endOfMonth } 
        }),
        Transaction.find({ 
          userId, 
          date: { $gte: prevMonthStart, $lte: prevMonthEnd } 
        }),
        Transaction.find({ userId })
      ]);
      
      // Calculate selected month spending
      const selectedMonthSpending = selectedMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const prevMonthSpending = prevMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      // Get user's monthly budget for selected month
      let budget = await UserBudget.findOne({ userId, currentMonth: selectedMonth });
      if (!budget) {
        budget = {
          monthlyBudget: 0,
          currentMonth: selectedMonth
        };
      }
      
      // Calculate total balance (monthly budget - selected month expenses)
      const totalBalance = Math.max(0, budget.monthlyBudget - selectedMonthSpending);
      
      // Calculate percentage changes
      const spendingChange = prevMonthSpending > 0 
        ? ((selectedMonthSpending - prevMonthSpending) / prevMonthSpending) * 100 
        : 0;
      
      res.json({
        totalBalance: Math.max(0, totalBalance),
        monthlySpending: selectedMonthSpending,
        spendingChange: Math.round(spendingChange * 100) / 100,
        totalTransactions: allTransactions.length
      });
    }
  } catch (err) {
    console.error('Error retrieving dashboard stats:', err);
    res.status(500).json({ message: 'Error retrieving dashboard statistics' });
  }
});

// Get monthly spending data for charts
router.get('/monthly-spending', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    
    // Get last 6 months of data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const transactions = await Transaction.find({
        userId,
        date: { $gte: monthStart, $lte: monthEnd }
      });
      
      const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      monthlyData.push({
        name: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        amount: totalAmount
      });
    }
    
    res.json(monthlyData);
  } catch (err) {
    console.error('Error retrieving monthly spending:', err);
    res.status(500).json({ message: 'Error retrieving monthly spending data' });
  }
});

// Get category breakdown for pie chart (optionally filtered by month)
// GET /transactions/category-breakdown?month=2024-12
// If no month parameter, returns all-time category breakdown
router.get('/category-breakdown', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get selected month or "all" for all-time stats
    let selectedMonth = req.query.month;
    const isAllMonths = !selectedMonth || selectedMonth === 'all';
    
    let transactions;
    if (isAllMonths) {
      // Get all transactions from current and previous months only (not future)
      const now = new Date();
      const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      transactions = await Transaction.find({ 
        userId,
        date: { $lte: endOfCurrentMonth } // Only up to end of current month
      });
    } else {
      // Get transactions for specific month
      const [year, month] = selectedMonth.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      
      transactions = await Transaction.find({
        userId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });
    }
    
    // Group by category (only count negative amounts for expenses)
    const categoryTotals = {};
    transactions.forEach(tx => {
      if (tx.amount < 0) { // Only count expenses
        const categoryName = tx.category;
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Math.abs(tx.amount);
      }
    });
    
    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value
    }));
    
    res.json(categoryData);
  } catch (err) {
    console.error('Error retrieving category breakdown:', err);
    res.status(500).json({ message: 'Error retrieving category breakdown' });
  }
});

// Update a transaction
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { amount, category, date, description } = req.body;
    
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Check if the transaction belongs to the user
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Store old values for category update
    const oldCategory = transaction.category;
    const oldDate = transaction.date;
    const oldMonth = getMonthFromDate(oldDate);
    
    // Update fields
    if (amount !== undefined) transaction.amount = amount;
    if (category !== undefined) transaction.category = category;
    if (date !== undefined) transaction.date = new Date(date);
    if (description !== undefined) transaction.description = description;
    
    await transaction.save();
    
    // Update category spentAmount for both old and new category/month
    const newMonth = getMonthFromDate(transaction.date);
    const newCategory = transaction.category;
    
    // Update old category/month (in case category or month changed)
    if (oldCategory && oldMonth) {
      await updateCategorySpentFromTransactions(req.user.id, oldCategory, oldMonth);
    }
    
    // Update new category/month
    if (newCategory && newMonth) {
      await updateCategorySpentFromTransactions(req.user.id, newCategory, newMonth);
    }
    
    res.json(transaction);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ message: 'Error updating transaction' });
  }
});

// Delete a transaction
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Check if the transaction belongs to the user
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Store category and month before deleting
    const categoryName = transaction.category;
    const transactionMonth = getMonthFromDate(transaction.date);
    
    await transaction.deleteOne();
    
    // Update category spentAmount after deletion
    if (categoryName && transactionMonth) {
      await updateCategorySpentFromTransactions(req.user.id, categoryName, transactionMonth);
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ message: 'Error deleting transaction' });
  }
});

module.exports = router;
