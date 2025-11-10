const mongoose = require('mongoose');

// Create user budget schema
const userBudgetSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  monthlyBudget: { 
    type: Number, 
    required: true,
    min: 0
  },
  currentMonth: {
    type: String, // Format: "YYYY-MM" (e.g., "2024-12")
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
userBudgetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const UserBudget = mongoose.model('UserBudget', userBudgetSchema);
module.exports = UserBudget;
