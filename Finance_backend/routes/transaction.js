// routes/transaction.js

const express = require('express');
const Transaction = require('../models/Transaction');
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
  const { amount, category } = req.body;

  try {
    const newTransaction = new Transaction({
      amount,
      category,
      userId: req.user.id, // The user is authenticated via JWT token
    });

    await newTransaction.save();
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
    res.json(transactions); // Send the transactions back in the response
  } catch (err) {
    console.error('Error retrieving transactions:', err); // Log error for debugging
    res.status(500).json({ message: 'Error retrieving transactions' });
  }
});

module.exports = router;
