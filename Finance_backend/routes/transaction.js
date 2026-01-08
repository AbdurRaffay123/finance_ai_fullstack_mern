// routes/transaction.js

const express = require('express');
const Transaction = require('../models/Transaction');
const UserBudget = require('../models/UserBudget');
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
router.get('/dashboard-stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get selected month or default to current month
    let selectedMonth = req.query.month;
    if (!selectedMonth) {
      const currentDate = new Date();
      selectedMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    }
    
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
router.get('/category-breakdown', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get selected month or default to current month
    let selectedMonth = req.query.month;
    if (!selectedMonth) {
      const currentDate = new Date();
      selectedMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    }
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    // Group by category
    const categoryTotals = {};
    transactions.forEach(tx => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
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
    
    // Update fields
    if (amount !== undefined) transaction.amount = amount;
    if (category !== undefined) transaction.category = category;
    if (date !== undefined) transaction.date = new Date(date);
    if (description !== undefined) transaction.description = description;
    
    await transaction.save();
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
    
    await transaction.deleteOne();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ message: 'Error deleting transaction' });
  }
});

module.exports = router;
