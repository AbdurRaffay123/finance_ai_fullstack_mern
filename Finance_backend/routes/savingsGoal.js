const express = require('express');
const router = express.Router();
const SavingsGoal = require('../models/SavingsGoal');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access denied' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Helper function to convert date to YYYY-MM format
const dateToMonthString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Helper function to get the first day of a month (YYYY-MM format)
const getFirstDayOfMonth = (monthString) => {
  const [year, month] = monthString.split('-').map(Number);
  return new Date(year, month - 1, 1);
};

// Helper function to get the first day of the next month (to exclude goals past deadline)
const getFirstDayOfNextMonth = (monthString) => {
  const [year, month] = monthString.split('-').map(Number);
  if (month === 12) {
    return new Date(year + 1, 0, 1);
  }
  return new Date(year, month, 1);
};

// GET all savings goals for logged-in user (optionally filtered by month)
// GET /savingsGoals?month=2024-12
// Goals persist from their creation month (currentMonth) until their deadline month (inclusive)
// Example: Goal created in Aug 2025 with deadline Jan 2026 appears in Aug 2025 - Jan 2026, but NOT in Feb 2026+
// If month=all or no month, returns all goals from current and previous months
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = { userId: req.user.id };
    
    const selectedMonth = req.query.month;
    const isAllMonths = !selectedMonth || selectedMonth === 'all';
    
    if (isAllMonths) {
      // Return all goals from current and previous months (not future)
      const now = new Date();
      const currentMonthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Filter goals where:
      // 1. Creation month (currentMonth) <= current month
      // 2. Deadline is in the future or current (not past)
      query.$and = [
        {
          $or: [
            // Goals with currentMonth: currentMonth <= currentMonthString
            {
              $and: [
                { currentMonth: { $exists: true, $ne: null, $ne: '' } },
                { currentMonth: { $lte: currentMonthString } }
              ]
            },
            // Backward compatibility: Goals without currentMonth - createdAt <= current month
            {
              $and: [
                {
                  $or: [
                    { currentMonth: { $exists: false } },
                    { currentMonth: null },
                    { currentMonth: '' }
                  ]
                },
                { createdAt: { $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) } }
              ]
            }
          ]
        },
        // Deadline must be >= current month start (not past)
        {
          deadline: { $gte: currentMonthStart }
        }
      ];
    } else if (req.query.month) {
      // If month parameter is provided, filter goals that should appear in this month
      // A goal appears if: creationMonth <= selectedMonth <= deadlineMonth
      const selectedMonth = req.query.month;
      const startOfSelectedMonth = getFirstDayOfMonth(selectedMonth);
      const startOfNextMonth = getFirstDayOfNextMonth(selectedMonth);
      
      console.log('=== GET /savingsGoals ===');
      console.log('Requested month:', selectedMonth);
      console.log('Selected month start:', startOfSelectedMonth);
      console.log('Next month start (exclusive):', startOfNextMonth);
      
      // Build query to find goals that should appear in the selected month
      // Goal appears if:
      // 1. Creation month (currentMonth or createdAt) <= selectedMonth
      // 2. Deadline month is in the future or current month (deadline >= start of selected month)
      //    AND deadline month < month after selected month (to exclude goals past their deadline month)
      // Example: Goal created Aug 2025, deadline Jan 2026 appears in Aug 2025 - Jan 2026, but NOT in Feb 2026+
      
      // Calculate deadline month string for comparison
      // We need to check if deadline falls within the selected month or before the month after selected month
      query.$and = [
        {
          $or: [
            // Goals with currentMonth: currentMonth <= selectedMonth (string comparison works lexicographically)
            {
              $and: [
                { currentMonth: { $exists: true, $ne: null, $ne: '' } },
                { currentMonth: { $lte: selectedMonth } }
              ]
            },
            // Backward compatibility: Goals without currentMonth - createdAt <= end of selected month
            {
              $and: [
                {
                  $or: [
                    { currentMonth: { $exists: false } },
                    { currentMonth: null },
                    { currentMonth: '' }
                  ]
                },
                { createdAt: { $lte: new Date(startOfNextMonth.getTime() - 1) } } // End of selected month
              ]
            }
          ]
        },
        // Deadline must be >= start of selected month (deadline is on or after selected month)
        // This ensures:
        // - Goals with deadlines in the selected month appear (deadline >= start of selected month)
        // - Goals with deadlines in future months appear (deadline >= start of selected month)
        // - Goals with deadlines before the selected month are excluded (deadline < start of selected month)
        // Example: Goal with deadline Jan 15, 2026:
        //   - Appears in Aug 2025 (Jan 15 >= Aug 1) ✓
        //   - Appears in Jan 2026 (Jan 15 >= Jan 1) ✓
        //   - Does NOT appear in Feb 2026 (Jan 15 < Feb 1) ✓
        {
          deadline: { 
            $gte: startOfSelectedMonth
          }
        }
      ];
      
      console.log('Query:', JSON.stringify(query, null, 2));
    }
    
    const goals = await SavingsGoal.find(query).sort({ deadline: 1 });
    console.log('Found goals:', goals.length);
    goals.forEach(goal => {
      const goalCreationMonth = goal.currentMonth || dateToMonthString(goal.createdAt || goal.deadline);
      const goalDeadlineMonth = dateToMonthString(goal.deadline);
      console.log(`  - ${goal.name}: creationMonth=${goalCreationMonth}, deadlineMonth=${goalDeadlineMonth}, deadline=${goal.deadline}`);
    });
    res.json(goals);
  } catch (err) {
    console.error('Error fetching savings goals:', err);
    res.status(500).json({ message: 'Failed to fetch savings goals' });
  }
});

// POST create new savings goal
router.post('/', verifyToken, async (req, res) => {
  const { name, targetAmount, currentAmount, deadline, category, month } = req.body;
  if (!name || !targetAmount || !deadline || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    // Determine the month for this goal
    // Priority: 1) Provided month (selectedMonth from frontend), 2) Current month
    // NOTE: We use selectedMonth, NOT deadline month, because the user selects which month to create the goal for
    let currentMonth;
    if (month) {
      // Use provided month (from selectedMonth in frontend) - this is the month the user is viewing
      currentMonth = month;
      console.log('Creating goal with provided month:', currentMonth);
    } else {
      // Default to current month if not provided (shouldn't happen if frontend passes selectedMonth)
      const now = new Date();
      currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      console.log('Creating goal with default (current) month:', currentMonth);
    }

    const newGoal = new SavingsGoal({
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline,
      category,
      userId: req.user.id,
      currentMonth,
    });
    await newGoal.save();
    console.log('Goal created:', { name: newGoal.name, currentMonth: newGoal.currentMonth, deadline: newGoal.deadline });
    res.status(201).json(newGoal);
  } catch (err) {
    console.error('Error creating savings goal:', err);
    res.status(500).json({ message: 'Failed to create savings goal' });
  }
});

// PATCH update only currentAmount (saved amount) for a goal
router.patch('/:id/currentAmount', verifyToken, async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    const { currentAmount } = req.body;
    if (currentAmount === undefined)
      return res.status(400).json({ message: 'currentAmount is required' });

    goal.currentAmount = currentAmount;
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update saved amount' });
  }
});

// PUT update savings goal (full update)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    const { name, targetAmount, currentAmount, deadline, category } = req.body;

    goal.name = name ?? goal.name;
    goal.targetAmount = targetAmount ?? goal.targetAmount;
    goal.currentAmount = currentAmount ?? goal.currentAmount;
    goal.deadline = deadline ?? goal.deadline;
    goal.category = category ?? goal.category;

    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update savings goal' });
  }
});

// DELETE savings goal
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    await goal.deleteOne();
    res.json({ message: 'Savings goal deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete savings goal' });
  }
});

module.exports = router;
