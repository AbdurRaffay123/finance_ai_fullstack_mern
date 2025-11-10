const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * PasswordReset Schema
 * Stores OTP and reset token information for password reset flow
 * Security: OTPs and reset tokens are hashed before storage
 */
const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sentToEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  // Hashed OTP (6-digit numeric) - never store plaintext
  otpHash: {
    type: String,
    required: true
  },
  // OTP expiry time (10 minutes from creation)
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  },
  // Whether this OTP has been used successfully
  used: {
    type: Boolean,
    default: false,
    index: true
  },
  // Number of verification attempts remaining (starts at 5)
  attemptsLeft: {
    type: Number,
    default: 5,
    min: 0
  },
  // Count of resend requests (for rate limiting)
  resendCount: {
    type: Number,
    default: 0
  },
  // Hashed reset token (issued after successful OTP verification)
  resetTokenHash: {
    type: String,
    default: null
  },
  // Reset token expiry (15 minutes from OTP verification)
  resetTokenExpiresAt: {
    type: Date,
    default: null
  },
  // Timestamp of last resend (for rate limiting)
  lastResendAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for finding active (non-used, non-expired) resets
passwordResetSchema.index({ userId: 1, used: 1, expiresAt: 1 });

// Index for finding resets by email and resend tracking
passwordResetSchema.index({ sentToEmail: 1, createdAt: -1 });

/**
 * Static method to hash an OTP
 * Uses bcrypt with salt rounds for security
 */
passwordResetSchema.statics.hashOTP = async function(otp) {
  return await bcrypt.hash(otp.toString(), 10);
};

/**
 * Instance method to verify an OTP
 * Compares provided OTP with stored hash
 */
passwordResetSchema.methods.verifyOTP = async function(otp) {
  return await bcrypt.compare(otp.toString(), this.otpHash);
};

/**
 * Static method to hash a reset token
 */
passwordResetSchema.statics.hashResetToken = async function(token) {
  return await bcrypt.hash(token, 10);
};

/**
 * Instance method to verify a reset token
 */
passwordResetSchema.methods.verifyResetToken = async function(token) {
  if (!this.resetTokenHash) return false;
  return await bcrypt.compare(token, this.resetTokenHash);
};

/**
 * Instance method to check if OTP is expired
 */
passwordResetSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

/**
 * Instance method to check if reset token is expired
 */
passwordResetSchema.methods.isResetTokenExpired = function() {
  if (!this.resetTokenExpiresAt) return true;
  return new Date() > this.resetTokenExpiresAt;
};

/**
 * Instance method to decrement attempts (atomic update)
 */
passwordResetSchema.methods.decrementAttempts = async function() {
  if (this.attemptsLeft > 0) {
    this.attemptsLeft -= 1;
    await this.save();
  }
  return this.attemptsLeft;
};

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;

