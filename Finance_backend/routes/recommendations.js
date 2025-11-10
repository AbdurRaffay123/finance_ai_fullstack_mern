// routes/recommendations.js

const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    console.log('No Authorization header found');
    return res.status(401).json({ message: 'Access denied, token missing' });
  }

  const tokenWithoutBearer = token.split(' ')[1];
  if (!tokenWithoutBearer) {
    console.log('Token format invalid');
    return res.status(401).json({ message: 'Invalid token format' });
  }

  jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('JWT verification failed:', err);
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// POST route to get AI recommendations using LLM (Grok or similar)
router.post('/', verifyToken, async (req, res) => {
  console.log('=== POST /api/recommendations called ===');
  try {
    const { transactions, categories, budget, savingsGoals } = req.body;
    console.log('Received data:', {
      transactions: transactions?.length || 0,
      categories: categories?.length || 0,
      budget: budget ? 'present' : 'missing',
      savingsGoals: savingsGoals?.length || 0,
    });

    // Prepare financial summary for LLM
    const financialSummary = {
      totalTransactions: transactions?.length || 0,
      totalSpending: transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
      // Expenses data - from categories collection
      expenses: categories?.map(cat => ({
        name: cat.name,
        budget: cat.budget || 0,
        spent: cat.spentAmount || 0,
        remaining: (cat.budget || 0) - (cat.spentAmount || 0),
        utilizationPercent: cat.budget > 0 ? ((cat.spentAmount || 0) / cat.budget) * 100 : 0,
      })) || [],
      monthlyBudget: budget?.monthlyBudget || 0,
      savingsGoals: savingsGoals?.map(goal => ({
        name: goal.name,
        target: goal.targetAmount,
        current: goal.currentAmount || 0,
        deadline: goal.deadline,
        progress: goal.targetAmount > 0 ? ((goal.currentAmount || 0) / goal.targetAmount) * 100 : 0,
      })) || [],
    };

    // Calculate spending by category from transactions
    const categorySpending = {};
    transactions?.forEach(tx => {
      categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;
    });

    // Calculate total expenses (sum of all category spentAmount)
    const totalExpenses = financialSummary.expenses.reduce((sum, exp) => sum + exp.spent, 0);
    const totalExpenseBudget = financialSummary.expenses.reduce((sum, exp) => sum + exp.budget, 0);

    // Build comprehensive prompt for LLM with focus on expenses
    const prompt = `You are a financial advisor and money-saving expert. Analyze the following financial data from the user's expense tracking system and provide 5-7 specific, actionable recommendations to help save money and optimize finances.

**COMPLETE FINANCIAL OVERVIEW:**

General Spending:
- Total Transactions: ${financialSummary.totalTransactions}
- Total Transaction Spending: $${financialSummary.totalSpending.toFixed(2)}
- Monthly Budget (Overall): $${financialSummary.monthlyBudget.toFixed(2)}
${financialSummary.monthlyBudget > 0 ? `- Overall Budget Utilization: ${((financialSummary.totalSpending / financialSummary.monthlyBudget) * 100).toFixed(1)}%` : ''}

**EXPENSES TRACKING SYSTEM (From Expense Categories):**
- Total Expense Budget: $${totalExpenseBudget.toFixed(2)}
- Total Expenses Spent: $${totalExpenses.toFixed(2)}
- Total Remaining in Expense Budget: $${(totalExpenseBudget - totalExpenses).toFixed(2)}
${totalExpenseBudget > 0 ? `- Overall Expense Budget Utilization: ${((totalExpenses / totalExpenseBudget) * 100).toFixed(1)}%` : ''}

**DETAILED EXPENSE BREAKDOWN BY CATEGORY:**
${financialSummary.expenses.length > 0 
  ? financialSummary.expenses
      .sort((a, b) => b.spent - a.spent) // Sort by spent amount
      .map(exp => {
        const status = exp.utilizationPercent > 100 ? '🔴 OVER BUDGET' 
                     : exp.utilizationPercent > 80 ? '🟡 NEAR LIMIT' 
                     : '🟢 OK';
        return `${status} ${exp.name}: Budget $${exp.budget.toFixed(2)}, Spent $${exp.spent.toFixed(2)}, Remaining $${exp.remaining.toFixed(2)} (${exp.utilizationPercent.toFixed(1)}% used)`;
      }).join('\n')
  : '- No expense categories configured'}

**TRANSACTION SPENDING BY CATEGORY (From Transaction Records):**
${Object.entries(categorySpending).length > 0 
  ? Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => {
        const percentage = financialSummary.totalSpending > 0 
          ? ((amount / financialSummary.totalSpending) * 100).toFixed(1) 
          : '0';
        return `- ${cat}: $${amount.toFixed(2)} (${percentage}% of transaction spending)`;
      }).join('\n')
  : '- No transaction category data available'}

**SAVINGS GOALS:**
${financialSummary.savingsGoals.length > 0
  ? financialSummary.savingsGoals.map(goal => {
      const deadline = new Date(goal.deadline);
      const now = new Date();
      const monthsLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24 * 30));
      const needed = goal.target - goal.current;
      const monthlyNeeded = monthsLeft > 0 ? needed / monthsLeft : needed;
      return `- ${goal.name}: $${goal.current.toFixed(2)} / $${goal.target.toFixed(2)} (${goal.progress.toFixed(1)}% complete) - Need $${needed.toFixed(2)} more, $${monthlyNeeded.toFixed(2)}/month - Deadline: ${deadline.toLocaleDateString()} (${monthsLeft} months left)`;
    }).join('\n')
  : '- No savings goals set'}

Provide recommendations in this format:
1. Specific actionable advice (e.g., "Reduce spending on [Category] by X%")
2. Savings goal adjustments if needed
3. Budget optimization suggestions
4. Cost-cutting opportunities
5. Any red flags or concerns

IMPORTANT: Provide between 4 to 8 recommendations (randomly vary the count). Make each recommendation practical, specific, and focused on helping the user save money effectively.`;

    // Call Google Gemini API
    // Google Gemini API endpoint
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'AIzaSyBDk_8YxVZ34yupux-KLY2if9EOof8yF8o';
    // Gemini API endpoint - using v1beta for chat completions
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    console.log('Using Google Gemini API');
    console.log('API Key configured:', GEMINI_API_KEY ? 'Yes (length: ' + GEMINI_API_KEY.length + ')' : 'No');
    console.log('API Key starts with:', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 6) + '...' : 'N/A');
    
    // Validate API key format (Google API keys start with AIzaSy)
    if (!GEMINI_API_KEY || !GEMINI_API_KEY.startsWith('AIzaSy')) {
      console.error('Invalid API key format. Google API keys should start with "AIzaSy"');
      throw new Error('Invalid API key format');
    }

    try {
      console.log('Sending request to Google Gemini API...');
      console.log('Request details:', {
        url: GEMINI_API_URL.split('?')[0] + '?key=***',
        model: 'gemini-pro',
        keyLength: GEMINI_API_KEY.length
      });
      
      // Google Gemini API uses different format
      // Build the prompt with system instructions
      const fullPrompt = `You are a financial advisor and money-saving expert. Provide practical, actionable financial recommendations in a friendly, helpful tone. Format your response as a numbered list (1., 2., 3., etc.) with each recommendation on a new line.

${prompt}`;

      const llmResponse = await axios.post(
        GEMINI_API_URL,
        {
          contents: [
            {
              parts: [
                {
                  text: fullPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
            topP: 0.8,
            topK: 40
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
          validateStatus: function (status) {
            // Don't throw on 4xx/5xx, let us handle it
            return status < 600;
          }
        }
      );

      // Check for API errors in response
      if (llmResponse.status >= 400) {
        const errorMsg = llmResponse.data?.error?.message || JSON.stringify(llmResponse.data?.error) || 'Unknown API error';
        console.error('Google Gemini API returned error status:', llmResponse.status);
        console.error('Error message:', errorMsg);
        
        if (llmResponse.status === 401 || llmResponse.status === 403) {
          throw new Error(`API Key Authentication Failed: ${errorMsg}. Please verify your API key at https://makersuite.google.com/app/apikey`);
        }
        
        throw new Error(`Google Gemini API Error (${llmResponse.status}): ${errorMsg}`);
      }

      // Parse Google Gemini API response
      const llmContent = llmResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                        llmResponse.data?.text || 
                        '';
      
      console.log('Google Gemini API Response received, length:', llmContent ? llmContent.length : 0);
      
      if (llmContent && llmContent.length > 0) {
        // Extract recommendations (split by numbered list or bullet points)
        let recommendations = llmContent
          .split(/\d+\.|\n[-•]|\n\*|\n-|\n•/)
          .map(rec => rec.trim())
          .filter(rec => {
            const trimmed = rec.trim();
            return trimmed.length > 20 && 
                   !trimmed.toLowerCase().includes('provide recommendations') &&
                   !trimmed.toLowerCase().includes('here are') &&
                   !trimmed.toLowerCase().includes('based on') &&
                   !trimmed.toLowerCase().startsWith('format') &&
                   !trimmed.toLowerCase().startsWith('make each');
          })
          .map(rec => rec.replace(/^\d+\.?\s*/, '').trim()) // Remove leading numbers
          .filter(rec => rec.length > 0); // Remove empty strings

        // Randomly select between 4-8 recommendations
        const minRecommendations = 4;
        const maxRecommendations = 8;
        const targetCount = Math.floor(Math.random() * (maxRecommendations - minRecommendations + 1)) + minRecommendations;
        
        console.log('Extracted recommendations count:', recommendations.length);
        console.log('Target count (4-8):', targetCount);

        if (recommendations.length > 0) {
          // If we have more recommendations than target, randomly sample
          if (recommendations.length > targetCount) {
            // Shuffle and take targetCount
            const shuffled = recommendations.sort(() => Math.random() - 0.5);
            recommendations = shuffled.slice(0, targetCount);
          } else if (recommendations.length < minRecommendations) {
            // If we have fewer than minimum, take all we have
            console.log(`Warning: Only ${recommendations.length} recommendations extracted, minimum is ${minRecommendations}`);
          }

          // Ensure we have at least 4, but not more than 8
          const finalCount = Math.min(Math.max(recommendations.length, minRecommendations), maxRecommendations);
          recommendations = recommendations.slice(0, finalCount);

          console.log('Final recommendations count:', recommendations.length);
          return res.json({ recommendations });
        }
      }

      // If parsing fails, use fallback
      console.log('Failed to extract recommendations from response, using fallback');
      throw new Error('Failed to parse LLM response');
    } catch (llmError) {
      console.error('Google Gemini API Error:', llmError.response?.data || llmError.message);
      console.error('Error details:', {
        status: llmError.response?.status,
        statusText: llmError.response?.statusText,
        data: llmError.response?.data,
        message: llmError.message,
      });
      // Fallback to generated recommendations
      const fallbackRecommendations = generateFallbackRecommendations(financialSummary, categorySpending, totalExpenses, totalExpenseBudget);
      res.json({ recommendations: fallbackRecommendations });
    }
  } catch (err) {
    console.error('Error processing recommendations:', err);
    res.status(500).json({ message: 'Error generating recommendations' });
  }
});

// Generate fallback recommendations when LLM is not available
function generateFallbackRecommendations(financialSummary, categorySpending, totalExpenses = 0, totalExpenseBudget = 0) {
  const recommendations = [];

  // Analyze EXPENSES (from categories) - prioritize over-budget categories
  const overBudgetExpenses = financialSummary.expenses.filter(exp => exp.utilizationPercent > 100);
  const nearLimitExpenses = financialSummary.expenses.filter(exp => exp.utilizationPercent > 80 && exp.utilizationPercent <= 100);

  // Over-budget expenses (highest priority)
  overBudgetExpenses.forEach(exp => {
    const overage = exp.spent - exp.budget;
    recommendations.push(
      `🔴 URGENT: "${exp.name}" expense category is ${exp.utilizationPercent.toFixed(1)}% over budget ($${overage.toFixed(2)} over). Reduce spending immediately.`
    );
  });

  // Near-limit expenses
  nearLimitExpenses.forEach(exp => {
    recommendations.push(
      `🟡 WARNING: "${exp.name}" expense category is at ${exp.utilizationPercent.toFixed(1)}% of budget ($${exp.remaining.toFixed(2)} remaining). Monitor closely.`
    );
  });

  // Analyze category spending from transactions
  const topSpendingCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (topSpendingCategories.length > 0) {
    topSpendingCategories.forEach(([category, amount]) => {
      // Only add if not already covered by expenses analysis
      const expenseMatch = financialSummary.expenses.find(exp => 
        exp.name.toLowerCase().includes(category.toLowerCase()) || 
        category.toLowerCase().includes(exp.name.toLowerCase())
      );
      if (!expenseMatch) {
        recommendations.push(
          `💡 Consider reducing your spending on "${category}" category by 15-20%. Current spending: $${amount.toFixed(2)}`
        );
      }
    });
  }

  // Analyze overall budget vs spending
  if (financialSummary.totalSpending > financialSummary.monthlyBudget * 0.9) {
    recommendations.push(
      `⚠️ Your overall spending ($${financialSummary.totalSpending.toFixed(2)}) is at ${((financialSummary.totalSpending / financialSummary.monthlyBudget) * 100).toFixed(1)}% of monthly budget. Consider reviewing discretionary expenses.`
    );
  }

  // Analyze expense budget utilization
  const calcTotalExpenses = financialSummary.expenses.length > 0 
    ? financialSummary.expenses.reduce((sum, exp) => sum + exp.spent, 0)
    : totalExpenses;
  const calcTotalExpenseBudget = financialSummary.expenses.length > 0
    ? financialSummary.expenses.reduce((sum, exp) => sum + exp.budget, 0)
    : totalExpenseBudget;
  if (calcTotalExpenseBudget > 0 && (calcTotalExpenses / calcTotalExpenseBudget) > 0.9) {
    recommendations.push(
      `📊 Your expense tracking system shows ${((calcTotalExpenses / calcTotalExpenseBudget) * 100).toFixed(1)}% utilization across all categories. Review expense budgets.`
    );
  }

  // Analyze savings goals
  financialSummary.savingsGoals.forEach(goal => {
    const monthsUntilDeadline = Math.ceil(
      (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24 * 30)
    );
    const needed = goal.target - goal.current;
    const monthlyNeeded = monthsUntilDeadline > 0 ? needed / monthsUntilDeadline : needed;
    
    if (goal.progress < 50 && monthsUntilDeadline < 6) {
      recommendations.push(
        `🎯 Your "${goal.name}" savings goal (${goal.progress.toFixed(1)}% complete) needs $${monthlyNeeded.toFixed(2)}/month to meet deadline. Consider adjusting timeline or increasing contributions.`
      );
    }
  });

    // Generic recommendations pool to fill if needed
    const genericRecommendations = [
      '💰 Review your recurring subscriptions - cancel any unused services to save money monthly.',
      '📊 Try meal planning to reduce food waste and grocery costs.',
      '🚗 Consider carpooling or using public transport a few days a week to save on transportation costs.',
      '💳 Use cashback credit cards or rewards programs for purchases you make regularly.',
      '🏠 Negotiate with service providers (internet, phone, insurance) for better rates.',
      '🍕 Limit eating out to 2-3 times per week and cook more meals at home.',
      '📱 Use budgeting apps to track spending and identify areas for improvement.',
      '🛒 Create a shopping list before grocery trips to avoid impulse purchases.',
      '⚡ Reduce utility bills by using energy-efficient appliances and LED bulbs.',
      '📚 Invest time in financial education to make better money decisions.',
    ];

    // Randomly select between 4-8 recommendations
    const minRecommendations = 4;
    const maxRecommendations = 8;
    const targetCount = Math.floor(Math.random() * (maxRecommendations - minRecommendations + 1)) + minRecommendations;

    // If we have fewer recommendations than target, add from generic pool
    if (recommendations.length < targetCount) {
      const needed = targetCount - recommendations.length;
      const shuffledGeneric = genericRecommendations
        .filter(rec => !recommendations.some(existing => existing.includes(rec.substring(0, 20))))
        .sort(() => Math.random() - 0.5);
      
      recommendations.push(...shuffledGeneric.slice(0, needed));
    }

    // Ensure we return between 4-8 recommendations
    const finalCount = Math.min(Math.max(recommendations.length, minRecommendations), maxRecommendations);
    return recommendations.slice(0, finalCount);
}

module.exports = router;

