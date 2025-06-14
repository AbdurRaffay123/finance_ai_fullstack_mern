const mongoose = require('mongoose');

// Define schema for User Input
const userInputSchema = new mongoose.Schema({
  Age: Number,
  City_Tier: String,
  Dependents: Number,
  Desired_Savings: Number,
  Desired_Savings_Percentage: Number,
  Disposable_Income: Number,
  Eating_Out: Number,
  Education: Number,
  Entertainment: Number,
  Groceries: Number,
  Healthcare: Number,
  Income: Number,
  Insurance: Number,
  Loan_Repayment: Number,
  Miscellaneous: Number,
  Occupation: String,
  Rent: Number,
  Transport: Number,
  Utilities: Number,
}, {
  timestamps: true,  // To record the time of each entry
});

// Create model for the user input data
const UserInput = mongoose.model('UserInput', userInputSchema);

module.exports = UserInput;
