const mongoose = require('mongoose');

// Category schema for Expense Management
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
  budget: { type: Number, required: true },
  spentAmount: { type: Number, default: 0 }, // NEW field to track spent amount
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentMonth: { 
    type: String, // Format: "YYYY-MM" (e.g., "2024-12")
    required: false, // Optional for backward compatibility
    comment: 'Month when category was created. Used for filtering categories by month.'
  },
}, { timestamps: true }); // Enable createdAt and updatedAt timestamps

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
