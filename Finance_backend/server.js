const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const predictionRoutes = require('./routes/predictionRoutes'); // Import the prediction routes

// Import userSettings routes
const userSettingsRoutes = require('./routes/userSettings');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve reports folder statically so PDFs can be accessed via browser
app.use('/reports', express.static(path.join(__dirname, 'public', 'reports')));

// Route imports
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transaction');
const categoryRoutes = require('./routes/category');
const savingsGoalRoutes = require('./routes/savingsGoal');
const reportRoutes = require('./routes/report');
const budgetRoutes = require('./routes/budget');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/savingsGoals', savingsGoalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/budget', budgetRoutes);

// Static folder for uploaded profile photos
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Register userSettings routes under /api/userSettings
app.use('/api/userSettings', userSettingsRoutes);

// Use the prediction routes for handling POST requests
app.use('/api', predictionRoutes);

// Register recommendations routes
const recommendationsRoutes = require('./routes/recommendations');
app.use('/api/recommendations', recommendationsRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
