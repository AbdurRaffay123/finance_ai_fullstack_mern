const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const SavingsGoal = require('../models/SavingsGoal');
const UserBudget = require('../models/UserBudget');

// JWT auth middleware
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

// GET all reports for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// POST generate report dynamically from transactions
router.post('/generate', verifyToken, async (req, res) => {
  const { reportName, reportType, startDate, endDate, categories } = req.body;

  if (!reportName || !reportType || !startDate || !endDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Build query for transactions for logged-in user in date range and categories
    const query = {
      userId: req.user.id,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (categories && categories.length > 0) {
      query.category = { $in: categories };
    }

    const transactions = await Transaction.find(query).sort({ date: 1 });

    // Fetch all related data for comprehensive report
    const [allCategories, allSavingsGoals, userBudgets] = await Promise.all([
      Category.find({ userId: req.user.id }),
      SavingsGoal.find({ userId: req.user.id }),
      UserBudget.find({ userId: req.user.id }).sort({ currentMonth: -1 }).limit(1),
    ]);

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create Summary Sheet
    const summaryData = [
      ['Financial Report'],
      [''],
      ['Report Name:', reportName],
      ['Report Type:', reportType],
      ['Date Range:', `${startDate} to ${endDate}`],
      ['Categories:', categories && categories.length > 0 ? categories.join(', ') : 'All'],
      [''],
      ['--- Expense Categories Overview ---'],
    ];

    if (allCategories.length > 0) {
      summaryData.push(['Category Name', 'Budget', 'Spent Amount']);
      allCategories.forEach((cat) => {
        summaryData.push([cat.name, cat.budget || 0, cat.spentAmount || 0]);
      });
    } else {
      summaryData.push(['No expense categories defined']);
    }

    summaryData.push(['']);
    summaryData.push(['--- Budget Information ---']);
    if (userBudgets.length > 0) {
      const budget = userBudgets[0];
      summaryData.push(['Monthly Budget:', budget.monthlyBudget || 0]);
      summaryData.push(['Period:', budget.currentMonth || 'N/A']);
    } else {
      summaryData.push(['No budget information available']);
    }

    summaryData.push(['']);
    summaryData.push(['--- Savings Goals Summary ---']);
    if (allSavingsGoals.length > 0) {
      summaryData.push(['Goal Name', 'Current Amount', 'Target Amount', 'Progress %']);
      allSavingsGoals.forEach((goal) => {
        const progress = goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : 0;
        summaryData.push([goal.name, goal.currentAmount, goal.targetAmount, `${progress}%`]);
      });
    } else {
      summaryData.push(['No savings goals defined']);
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Create report-specific sheets based on type
    if (reportType === 'monthly') {
      const monthlyTotals = {};
      transactions.forEach(tx => {
        const month = tx.date.toISOString().slice(0, 7); // YYYY-MM
        monthlyTotals[month] = (monthlyTotals[month] || 0) + tx.amount;
      });

      const monthlyData = [['Month', 'Total Amount']];
      Object.entries(monthlyTotals).forEach(([month, total]) => {
        monthlyData.push([month, total]);
      });

      const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Summary');

    } else if (reportType === 'category') {
      const categoryTotals = {};
      transactions.forEach(tx => {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      });

      const categoryData = [['Category', 'Total Amount']];
      Object.entries(categoryTotals).forEach(([cat, total]) => {
        categoryData.push([cat, total]);
      });

      const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
      XLSX.utils.book_append_sheet(workbook, categorySheet, 'Category Analysis');

    } else if (reportType === 'transactions') {
      const transactionData = [
        ['Date', 'Category', 'Amount', 'Description']
      ];

      transactions.forEach(tx => {
        transactionData.push([
          tx.date.toISOString().slice(0, 10),
          tx.category,
          tx.amount,
          tx.description || '-'
        ]);
      });

      const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData);
      XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transaction History');
    }

    // Generate file name and path - ALWAYS Excel format
    const fileName = `${Date.now()}-${reportName.replace(/\s+/g, '_')}.xlsx`;
    const filePath = path.join(__dirname, '..', 'public', 'reports', fileName);

    // Ensure directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Write Excel file
    XLSX.writeFile(workbook, filePath);

    // Save report record to database
    const report = new Report({
      userId: req.user.id,
      name: reportName,
      type: reportType,
      fileUrl: `/reports/${fileName}`,
      status: 'completed',
      date: new Date(),
    });

    await report.save();

    res.status(201).json({ fileUrl: report.fileUrl });

  } catch (err) {
    console.error('Report generation failed:', err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

module.exports = router;
