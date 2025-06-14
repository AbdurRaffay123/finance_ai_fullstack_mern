const mongoose = require('mongoose');

// Category schema for Expense Management
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
  budget: { type: Number, required: true },
  spentAmount: { type: Number, default: 0 }, // NEW field to track spent amount
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
