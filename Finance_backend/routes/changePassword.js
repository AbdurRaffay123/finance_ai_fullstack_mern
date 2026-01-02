const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validatePassword } = require('../utils/passwordValidator');

// JWT middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. Invalid token format.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = decoded;
    next();
  });
};

/**
 * PUT /api/user/change-password
 * Secure password change endpoint
 * 
 * Security Features:
 * - JWT authentication required
 * - Current password verification
 * - Password strength validation
 * - Prevents password reuse
 * - Bcrypt hashing (12 salt rounds)
 * - Rate limiting recommended (implement at server level)
 */
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Input validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: 'All fields are required',
        errors: {
          currentPassword: !currentPassword ? 'Current password is required' : null,
          newPassword: !newPassword ? 'New password is required' : null,
          confirmPassword: !confirmPassword ? 'Please confirm your new password' : null,
        },
      });
    }

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: 'Current password is incorrect',
        errors: {
          currentPassword: 'The password you entered does not match your current password',
        },
      });
    }

    // Check if new password matches confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
        errors: {
          confirmPassword: 'New password and confirmation password do not match',
        },
      });
    }

    // Validate new password strength
    const passwordValidation = await validatePassword(newPassword, user.password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        message: 'Password does not meet security requirements',
        errors: {
          newPassword: passwordValidation.errors,
        },
        strength: passwordValidation.strength,
        score: passwordValidation.score,
      });
    }

    // Update password (hashing handled by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Success response (do not expose sensitive information)
    res.status(200).json({
      message: 'Password changed successfully',
      success: true,
      passwordUpdatedAt: user.passwordUpdatedAt,
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      message: 'An error occurred while changing your password. Please try again later.',
    });
  }
});

module.exports = router;
