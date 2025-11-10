const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
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

    // Create PDF doc
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const fileName = `${Date.now()}-${reportName.replace(/\s+/g, '_')}.pdf`;
    const filePath = path.join(__dirname, '..', 'public', 'reports', fileName);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // PDF Header
    doc.fontSize(20).text('Financial Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Report Name: ${reportName}`);
    doc.text(`Report Type: ${reportType}`);
    doc.text(`Date Range: ${startDate} to ${endDate}`);
    if (categories && categories.length > 0) {
      doc.text(`Selected Categories: ${categories.join(', ')}`);
    } else {
      doc.text('Categories: All');
    }
    doc.moveDown();

    // Add comprehensive category information
    doc.fontSize(12).text('--- Expense Categories Overview ---');
    if (allCategories.length > 0) {
      allCategories.forEach((cat) => {
        doc.fontSize(10).text(`  • ${cat.name}: Budget $${cat.budget.toFixed(2)}, Spent $${(cat.spentAmount || 0).toFixed(2)}`);
      });
    } else {
      doc.fontSize(10).text('  No expense categories defined');
    }
    doc.moveDown();

    // Content by report type
    if (reportType === 'monthly') {
      const monthlyTotals = {};

      transactions.forEach(tx => {
        const month = tx.date.toISOString().slice(0,7); // YYYY-MM
        monthlyTotals[month] = (monthlyTotals[month] || 0) + tx.amount;
      });

      doc.fontSize(16).text('Monthly Summary:');
      Object.entries(monthlyTotals).forEach(([month, total]) => {
        doc.text(`${month}: $${total.toFixed(2)}`);
      });

    } else if (reportType === 'category') {
      const categoryTotals = {};

      transactions.forEach(tx => {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      });

      doc.fontSize(16).text('Category Analysis:');
      Object.entries(categoryTotals).forEach(([cat, total]) => {
        doc.text(`${cat}: $${total.toFixed(2)}`);
      });

    } else if (reportType === 'transactions') {
      doc.fontSize(16).text('Transaction History:');
      doc.moveDown();

      transactions.forEach(tx => {
        doc.fontSize(12).text(`${tx.date.toISOString().slice(0,10)} | ${tx.category} | $${tx.amount.toFixed(2)} | ${tx.description || '-'}`);
      });

    } else {
      doc.text('Unknown report type');
    }

    // Add Budget Information
    doc.moveDown();
    doc.fontSize(12).text('--- Budget Information ---');
    if (userBudgets.length > 0) {
      const budget = userBudgets[0];
      doc.fontSize(10).text(`  Monthly Budget: $${budget.monthlyBudget.toFixed(2)}`);
      doc.fontSize(10).text(`  Period: ${budget.currentMonth}`);
    } else {
      doc.fontSize(10).text('  No budget information available');
    }

    // Add Savings Goals Summary
    doc.moveDown();
    doc.fontSize(12).text('--- Savings Goals Summary ---');
    if (allSavingsGoals.length > 0) {
      allSavingsGoals.forEach((goal) => {
        const progress = goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : 0;
        doc.fontSize(10).text(`  • ${goal.name}: $${goal.currentAmount.toFixed(2)} / $${goal.targetAmount.toFixed(2)} (${progress}%)`);
      });
    } else {
      doc.fontSize(10).text('  No savings goals defined');
    }

    doc.end();

    writeStream.on('finish', async () => {
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
    });

    writeStream.on('error', (err) => {
      console.error('Error writing PDF file:', err);
      res.status(500).json({ message: 'Failed to generate report' });
    });

  } catch (err) {
    console.error('Report generation failed:', err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

module.exports = router;
