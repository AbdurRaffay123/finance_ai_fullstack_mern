const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, sendPasswordResetSuccessEmail } = require('../utils/email');

const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  try {
  const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Normalize email (lowercase)
    const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

  // Create a new user
    const user = new User({ email: normalizedEmail, password });
  await user.save();

  // Create JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ 
      token,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
  const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Normalize email (lowercase)
    const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

  // Compare password
  const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

  // Create JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ 
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/**
 * POST /auth/check-email
 * Checks if email exists in database (for frontend validation)
 * Returns specific response to allow frontend validation
 */
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        exists: false,
        valid: false,
        message: 'Please enter a valid email address.' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({ 
        exists: false,
        valid: true,
        message: 'No account found with this email address. Please check your email or sign up.' 
      });
    }

    return res.status(200).json({ 
      exists: true,
      valid: true,
      message: 'Email verified. Proceeding to send OTP.' 
    });
  } catch (error) {
    console.error('Error in check-email:', error);
    res.status(500).json({ 
      exists: false,
      valid: false,
      message: 'Unable to verify email. Please try again.' 
    });
  }
});

/**
 * POST /auth/forgot-password
 * Initiates password reset flow by sending OTP to user's email
 * Now expects email to be pre-validated by frontend
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: true, 
        message: 'If an account exists, an OTP was sent to your email.' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // Always return generic success message (security: prevent email enumeration)
    const genericResponse = {
      success: true,
      message: 'If an account exists, an OTP was sent to your email. Please check your inbox and spam folder.'
    };

    // If user doesn't exist, return generic response immediately
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
      return res.status(200).json(genericResponse);
    }

    // Invalidate any existing unused OTPs for this user
    await PasswordReset.updateMany(
      { userId: user._id, used: false },
      { used: true }
    );

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash the OTP before storing
    const otpHash = await PasswordReset.hashOTP(otp);

    // Set expiry to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Create password reset record
    const passwordReset = new PasswordReset({
      userId: user._id,
      sentToEmail: normalizedEmail,
      otpHash: otpHash,
      expiresAt: expiresAt,
      attemptsLeft: 5,
      resendCount: 0
    });

    await passwordReset.save();

    // Send OTP email (fire and forget - don't wait for email to complete)
    sendOTPEmail(normalizedEmail, otp).catch(err => {
      console.error(`Failed to send OTP email to ${normalizedEmail}:`, err.message);
      // Don't fail the request if email fails - user can request resend
    });

    console.log(`OTP generated for user ${user._id} (${normalizedEmail})`);

    // Return generic success message
    res.status(200).json(genericResponse);

  } catch (error) {
    console.error('Error in forgot-password:', error);
    // Still return generic success to prevent information leakage
    res.status(200).json({
      success: true,
      message: 'If an account exists, an OTP was sent to your email. Please check your inbox and spam folder.'
    });
  }
});

/**
 * POST /auth/verify-otp
 * Verifies the OTP and issues a reset token
 * Security: Limits attempts, validates expiry, returns friendly errors
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required.' 
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP format. Please enter a 6-digit code.' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid code or expired. Please request a new code.' 
      });
    }

    // Find latest non-used password reset record
    const passwordReset = await PasswordReset.findOne({
      userId: user._id,
      used: false
    }).sort({ createdAt: -1 });

    if (!passwordReset) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid code or expired. Please request a new code.' 
      });
    }

    // Check if expired
    if (passwordReset.isExpired()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code has expired. Please request a new code.' 
      });
    }

    // Check attempts
    if (passwordReset.attemptsLeft <= 0) {
      // Mark as used to prevent further attempts
      passwordReset.used = true;
      await passwordReset.save();
      return res.status(400).json({ 
        success: false, 
        message: 'Too many failed attempts. Please request a new code.' 
      });
    }

    // Verify OTP
    const isValid = await passwordReset.verifyOTP(otp);

    if (!isValid) {
      // Decrement attempts
      const attemptsLeft = await passwordReset.decrementAttempts();
      
      if (attemptsLeft <= 0) {
        passwordReset.used = true;
        await passwordReset.save();
        return res.status(400).json({ 
          success: false, 
          message: 'Too many failed attempts. Please request a new code.' 
        });
      }

      return res.status(400).json({ 
        success: false, 
        message: `Invalid code. You have ${attemptsLeft} attempt(s) left.` 
      });
    }

    // OTP is valid - mark as used and generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await PasswordReset.hashResetToken(resetToken);

    // Set reset token expiry to 15 minutes
    const resetTokenExpiresAt = new Date();
    resetTokenExpiresAt.setMinutes(resetTokenExpiresAt.getMinutes() + 15);

    passwordReset.used = true;
    passwordReset.resetTokenHash = resetTokenHash;
    passwordReset.resetTokenExpiresAt = resetTokenExpiresAt;
    await passwordReset.save();

    console.log(`OTP verified successfully for user ${user._id}`);

    // Return reset token (only time it's sent in plaintext)
    res.status(200).json({
      success: true,
      reset_token: resetToken,
      message: 'OTP verified successfully. You can now reset your password.'
    });

  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

/**
 * POST /auth/resend-otp
 * Resends OTP with rate limiting (max 3 per hour)
 * Security: Returns generic success message
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: true, 
        message: 'If an account exists, an OTP was sent to your email.' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });

    // Generic response (prevent email enumeration)
    const genericResponse = {
      success: true,
      message: 'If an account exists, an OTP was sent to your email. Please check your inbox and spam folder.'
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Check resend rate limit (max 3 resends in last 60 minutes)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentResends = await PasswordReset.countDocuments({
      userId: user._id,
      createdAt: { $gte: oneHourAgo },
      resendCount: { $gt: 0 }
    });

    if (recentResends >= 3) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many resend requests. Please wait before requesting again.' 
      });
    }

    // Invalidate existing unused OTPs
    await PasswordReset.updateMany(
      { userId: user._id, used: false },
      { used: true }
    );

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await PasswordReset.hashOTP(otp);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Create new password reset record
    const passwordReset = new PasswordReset({
      userId: user._id,
      sentToEmail: normalizedEmail,
      otpHash: otpHash,
      expiresAt: expiresAt,
      attemptsLeft: 5,
      resendCount: 1,
      lastResendAt: new Date()
    });

    await passwordReset.save();

    // Send OTP email
    sendOTPEmail(normalizedEmail, otp).catch(err => {
      console.error(`Failed to send resend OTP email to ${normalizedEmail}:`, err.message);
    });

    console.log(`OTP resent for user ${user._id} (${normalizedEmail})`);

    res.status(200).json(genericResponse);

  } catch (error) {
    console.error('Error in resend-otp:', error);
    res.status(200).json({
      success: true,
      message: 'If an account exists, an OTP was sent to your email. Please check your inbox and spam folder.'
    });
  }
});

/**
 * POST /auth/reset-password
 * Resets user password using reset token
 * Security: Validates token, updates password, invalidates all resets
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, reset_token, new_password } = req.body;

    // Validate input
    if (!email || !reset_token || !new_password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, reset token, and new password are required.' 
      });
    }

    // Validate password strength (min 6 characters)
    if (new_password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long.' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset token or expired.' 
      });
    }

    // Find password reset record with valid reset token
    const passwordReset = await PasswordReset.findOne({
      userId: user._id,
      used: true, // OTP must have been used (verified)
      resetTokenHash: { $ne: null }
    }).sort({ updatedAt: -1 });

    if (!passwordReset) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset token or expired.' 
      });
    }

    // Verify reset token
    const isValidToken = await passwordReset.verifyResetToken(reset_token);
    if (!isValidToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset token or expired.' 
      });
    }

    // Check if reset token is expired
    if (passwordReset.isResetTokenExpired()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token has expired. Please request a new password reset.' 
      });
    }

    // Update user password (User model will hash it automatically via pre-save hook)
    user.password = new_password;
    await user.save();

    // Invalidate all password reset records for this user (security: one-time use)
    await PasswordReset.updateMany(
      { userId: user._id },
      { 
        used: true,
        resetTokenHash: null,
        resetTokenExpiresAt: null
      }
    );

    // Send confirmation email
    sendPasswordResetSuccessEmail(normalizedEmail).catch(err => {
      console.error(`Failed to send password reset confirmation email:`, err.message);
    });

    console.log(`Password reset successful for user ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again.' 
    });
  }
});

module.exports = router;
