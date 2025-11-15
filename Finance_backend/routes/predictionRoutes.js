// routes/predictionRoutes.js

const express = require('express');
const axios = require('axios');
const UserInput = require('../models/userInputModel'); // Import the UserInput model
const router = express.Router();

// POST route for saving user input and getting predictions
router.post('/predict', async (req, res) => {
  const userInputData = req.body;

  try {
    // Validate required fields
    const requiredFields = ['Income', 'Groceries', 'Transport', 'Eating_Out', 'Entertainment', 'Utilities', 'Miscellaneous'];
    const missingFields = requiredFields.filter(field => !userInputData[field] || userInputData[field] === 0);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required expense data',
        missingFields,
        message: `The following required fields are missing or zero: ${missingFields.join(', ')}. Please add expenses in these categories.`
      });
    }

    // Validate all numeric fields are valid numbers
    const numericFields = ['Age', 'Income', 'Dependents', 'Desired_Savings', 'Loan_Repayment', 'Insurance', 'Rent', 
                          'Groceries', 'Education', 'Transport', 'Eating_Out', 'Utilities', 'Entertainment', 
                          'Healthcare', 'Miscellaneous', 'Disposable_Income', 'Desired_Savings_Percentage'];
    
    for (const field of numericFields) {
      if (userInputData[field] !== undefined && (isNaN(userInputData[field]) || userInputData[field] < 0)) {
        return res.status(400).json({ 
          error: 'Invalid data',
          message: `${field} must be a valid positive number.`
        });
      }
    }

    // Log the data being sent to FastAPI
    console.log('=== PREDICTION REQUEST ===');
    console.log('User input data:', JSON.stringify(userInputData, null, 2));
    
    // Validate data ranges (prevent extremely large values that might cause issues)
    const maxReasonableValue = 1000000000; // 1 billion
    const suspiciousFields = [];
    for (const [key, value] of Object.entries(userInputData)) {
      if (typeof value === 'number' && value > maxReasonableValue) {
        suspiciousFields.push(`${key}: ${value}`);
      }
    }
    if (suspiciousFields.length > 0) {
      console.warn('⚠️ WARNING: Suspiciously large values detected:', suspiciousFields);
    }
    
    // Save input data to MongoDB
    try {
      const userInput = new UserInput(userInputData);
      await userInput.save();
      console.log('User input saved to MongoDB');
    } catch (dbError) {
      console.error('Error saving to MongoDB (non-fatal):', dbError);
      // Continue even if DB save fails
    }

    // Call FastAPI to get predictions
    try {
      const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
      console.log(`Calling FastAPI at ${fastApiUrl}/predict`);
      const fastApiResponse = await axios.post(`${fastApiUrl}/predict`, userInputData, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('FastAPI response received:', fastApiResponse.data);
      
      // Send the prediction results back to the client
      return res.json(fastApiResponse.data);
    } catch (fastApiError) {
      console.error('=== FASTAPI ERROR ===');
      console.error('Error message:', fastApiError.message);
      console.error('Error code:', fastApiError.code);
      
      if (fastApiError.code === 'ECONNREFUSED' || fastApiError.code === 'ETIMEDOUT') {
        return res.status(503).json({ 
          error: 'Prediction service unavailable',
          message: 'FastAPI service is not running. Please start the FastAPI server on port 8000.',
          details: fastApiError.message
        });
      }
      
      if (fastApiError.response) {
        console.error('FastAPI response status:', fastApiError.response.status);
        console.error('FastAPI response data:', fastApiError.response.data);
        return res.status(fastApiError.response.status || 500).json({ 
          error: 'FastAPI error',
          message: fastApiError.response.data?.detail || fastApiError.response.data?.error || 'Error from prediction service',
          details: fastApiError.response.data
        });
      }
      
      throw fastApiError; // Re-throw to be caught by outer catch
    }
  } catch (err) {
    console.error('=== PREDICTION ROUTE ERROR ===');
    console.error('Error type:', err.constructor.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    if (err.response?.status === 400) {
      return res.status(400).json({ 
        error: 'Invalid input data',
        message: err.response.data?.detail || err.response.data?.error || 'Invalid input data',
        details: err.response.data
      });
    }
    
    res.status(500).json({ 
      error: 'Error processing prediction request',
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;
