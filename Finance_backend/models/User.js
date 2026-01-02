const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create user schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordUpdatedAt: { type: Date, default: null }, // Track when password was last changed
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

// Password hashing before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  // Use 12 salt rounds for better security (industry standard)
  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  
  // Update passwordUpdatedAt timestamp when password changes
  if (this.isNew || this.isModified('password')) {
    this.passwordUpdatedAt = new Date();
  }
  
  next();
});

// Method to compare password during login
userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to check if password was recently changed (for security purposes)
userSchema.methods.isPasswordRecentlyChanged = function (days = 0) {
  if (!this.passwordUpdatedAt) return false;
  const daysSinceChange = (Date.now() - this.passwordUpdatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceChange <= days;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
