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
// Render sets PORT automatically, but fallback to 5000 for local development
const port = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve reports folder statically so Excel files can be accessed via browser
app.use('/reports', express.static(path.join(__dirname, 'public', 'reports')));

// Route imports
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transaction');
const categoryRoutes = require('./routes/category');
const savingsGoalRoutes = require('./routes/savingsGoal');
const reportRoutes = require('./routes/report');
const budgetRoutes = require('./routes/budget');

// MongoDB Local Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/financeDB';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s for local
  socketTimeoutMS: 45000,
  connectTimeoutMS: 5000,
})
  .then(async () => {
    console.log("✅ MongoDB Local connected successfully");
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    
    // Ensure budget indexes are correct (prevent duplicate key errors)
    const ensureBudgetIndexes = require('./utils/ensureBudgetIndexes');
    await ensureBudgetIndexes();
  })
  .catch(err => {
    console.error("❌ MongoDB Local connection error:", err.message);
    console.error("   Please check:");
    console.error("   1. MongoDB is running: sudo systemctl status mongod");
    console.error("   2. Start MongoDB: sudo systemctl start mongod");
    console.error("   3. Connection string in .env file: mongodb://localhost:27017/financeDB");
    console.warn("⚠️  Server will continue running but database operations will fail");
  });

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB Local disconnected');
  console.log('🔄 Attempting to reconnect...');
  setTimeout(() => {
    mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000,
    }).catch(err => {
      console.error('❌ Reconnection failed:', err.message);
    });
  }, 5000);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB Local reconnected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Local error:', err.message);
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

// Register change password routes under /api/user
const changePasswordRoutes = require('./routes/changePassword');
app.use('/api/user', changePasswordRoutes);

// Use the prediction routes for handling POST requests
app.use('/api', predictionRoutes);

// Register recommendations routes
const recommendationsRoutes = require('./routes/recommendations');
app.use('/api/recommendations', recommendationsRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
