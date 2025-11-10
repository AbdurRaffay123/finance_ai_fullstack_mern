const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const SavingsGoal = require('./models/SavingsGoal');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function createFreshTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing test user and their data
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      await Transaction.deleteMany({ userId: existingUser._id });
      await SavingsGoal.deleteMany({ userId: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
      console.log('Deleted existing test user and data');
    }

    // Create new test user
    const newUser = new User({
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User'
    });

    await newUser.save();
    console.log('Created new test user:', newUser._id);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    );

    console.log(`JWT Token (7 days): ${token}`);

    // Create sample transactions with different dates
    const sampleTransactions = [
      {
        amount: 100,
        category: 'Food',
        date: new Date('2024-01-15'),
        userId: newUser._id
      },
      {
        amount: 50,
        category: 'Transport',
        date: new Date('2024-02-20'),
        userId: newUser._id
      },
      {
        amount: 200,
        category: 'Utilities',
        date: new Date('2024-03-10'),
        userId: newUser._id
      }
    ];

    for (const transactionData of sampleTransactions) {
      const transaction = new Transaction(transactionData);
      await transaction.save();
      console.log(`Created transaction: ${transaction.category} - $${transaction.amount} - ${transaction.date.toISOString().split('T')[0]}`);
    }

    // Create sample savings goals
    const sampleGoals = [
      {
        name: 'Emergency Fund',
        targetAmount: 5000,
        currentAmount: 1500,
        deadline: new Date('2024-12-31'),
        category: 'emergency',
        userId: newUser._id
      },
      {
        name: 'Vacation',
        targetAmount: 2000,
        currentAmount: 800,
        deadline: new Date('2024-06-30'),
        category: 'vacation',
        userId: newUser._id
      }
    ];

    for (const goalData of sampleGoals) {
      const goal = new SavingsGoal(goalData);
      await goal.save();
      console.log(`Created savings goal: ${goal.name}`);
    }

    console.log('\n=== TEST USER CREATED ===');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log(`JWT Token: ${token}`);
    console.log('Sample transactions created with different dates');
    console.log('========================\n');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createFreshTestUser();

