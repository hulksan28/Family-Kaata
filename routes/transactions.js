const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// GET /api/transactions — list with filters
router.get('/', async (req, res) => {
  try {
    const { userId, type, category, startDate, endDate, limit, page } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('userId', 'name avatar color')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(filter)
    ]);

    res.json({ transactions, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/summary — aggregated dashboard data
router.get('/summary', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const matchStage = {};

    if (userId) matchStage.userId = new mongoose.Types.ObjectId(userId);
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Total income & expense
    const totals = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Monthly trends (last 12 months)
    const monthlyTrends = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Per-member breakdown
    const memberBreakdown = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { userId: '$userId', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          type: '$_id.type',
          total: 1,
          count: 1,
          userName: '$user.name',
          userAvatar: '$user.avatar',
          userColor: '$user.color'
        }
      }
    ]);

    // Top spending categories (top 5)
    const topExpenseCategories = await Transaction.aggregate([
      { $match: { ...matchStage, type: 'expense' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find(matchStage)
      .populate('userId', 'name avatar color')
      .sort({ date: -1, createdAt: -1 })
      .limit(10);

    // Daily spending for current month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dailySpending = await Transaction.aggregate([
      {
        $match: {
          ...matchStage,
          type: 'expense',
          date: { $gte: firstOfMonth, ...(matchStage.date || {}) }
        }
      },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      incomeCount: 0,
      expenseCount: 0
    };

    totals.forEach(t => {
      if (t._id === 'income') {
        summary.totalIncome = t.total;
        summary.incomeCount = t.count;
      } else {
        summary.totalExpense = t.total;
        summary.expenseCount = t.count;
      }
    });

    summary.balance = summary.totalIncome - summary.totalExpense;
    summary.totalTransactions = summary.incomeCount + summary.expenseCount;

    res.json({
      summary,
      categoryBreakdown,
      monthlyTrends,
      memberBreakdown,
      topExpenseCategories,
      recentTransactions,
      dailySpending
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions — create
router.post('/', async (req, res) => {
  try {
    const { userId, type, amount, currency, category, description, date } = req.body;
    const transaction = new Transaction({
      userId, type, amount, currency: currency || 'INR', category, description, date: date || new Date()
    });
    await transaction.save();
    const populated = await transaction.populate('userId', 'name avatar color');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/transactions/:id — update
router.put('/:id', async (req, res) => {
  try {
    const { userId, type, amount, currency, category, description, date } = req.body;
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { userId, type, amount, currency, category, description, date },
      { new: true, runValidators: true }
    ).populate('userId', 'name avatar color');
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/transactions/:id — delete
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
