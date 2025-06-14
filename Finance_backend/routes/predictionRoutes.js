// routes/predictionRoutes.js

const express = require('express');
const axios = require('axios');
const UserInput = require('../models/userInputModel'); // Import the UserInput model
const router = express.Router();

// POST route for saving user input and getting predictions
router.post('/predict', async (req, res) => {
  const userInputData = req.body;

  try {
    // Save input data to MongoDB
    const userInput = new UserInput(userInputData);
    await userInput.save();

    // Call FastAPI to get predictions
    const fastApiResponse = await axios.post('http://localhost:8000/predict', userInputData);

    // Send the prediction results back to the client
    res.json(fastApiResponse.data);
  } catch (err) {
    console.error('Error during prediction request:', err);
    res.status(500).json({ error: 'Error processing prediction request.' });
  }
});

module.exports = router;
