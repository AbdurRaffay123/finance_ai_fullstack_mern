const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 }, // renamed from savedAmount
  deadline: { type: Date, required: true },
  category: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentMonth: { 
    type: String, // Format: "YYYY-MM" (e.g., "2024-12")
    required: false, // Optional for backward compatibility
    comment: 'Month when goal was created. Used for filtering goals by month.'
  },
}, { timestamps: true });

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);

module.exports = SavingsGoal;
