const mongoose = require('mongoose');

// Create transaction schema
const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;