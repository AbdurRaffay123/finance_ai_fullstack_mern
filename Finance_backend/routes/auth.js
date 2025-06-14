const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });

  // Create a new user
  const user = new User({ email, password });
  await user.save();

  // Create JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.status(201).json({ token });
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  // Compare password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  // Create JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({ token });
});

module.exports = router;
