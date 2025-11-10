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

// Get all transactions for a user
router.get('/', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id });
    console.log('=== GET /transactions ===');
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

// Get dashboard statistics
router.get('/dashboard-stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current month transactions
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get last month transactions for comparison
    const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    
    const [currentMonthTransactions, lastMonthTransactions, allTransactions] = await Promise.all([
      Transaction.find({ 
        userId, 
        date: { $gte: startOfMonth, $lte: endOfMonth } 
      }),
      Transaction.find({ 
        userId, 
        date: { $gte: lastMonthStart, $lte: lastMonthEnd } 
      }),
      Transaction.find({ userId })
    ]);
    
    // Calculate current month spending
    const currentMonthSpending = currentMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const lastMonthSpending = lastMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Get user's monthly budget
    const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    
    let budget = await UserBudget.findOne({ userId });
    if (!budget || budget.currentMonth !== currentMonth) {
      if (!budget) {
        // Create default budget if none exists
        budget = new UserBudget({
          userId,
          monthlyBudget: 5000, // Default budget
          currentMonth: currentMonth
        });
        await budget.save();
      } else {
        // Update budget for new month
        budget.currentMonth = currentMonth;
        await budget.save();
      }
    }
    
    // Calculate total balance (monthly budget - current month expenses)
    const currentMonthExpenses = currentMonthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalBalance = Math.max(0, budget.monthlyBudget - currentMonthExpenses);
    
    // Calculate percentage changes
    const spendingChange = lastMonthSpending > 0 
      ? ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100 
      : 0;
    
    res.json({
      totalBalance: Math.max(0, totalBalance),
      monthlySpending: currentMonthSpending,
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

// Get category breakdown for pie chart
router.get('/category-breakdown', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
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
