const asyncHandler = require('../middleware/asyncHandler');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const budgetService = require('../services/budgetService');
const mongoose = require('mongoose');

exports.getBudgets = asyncHandler(async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ success: false, message: 'Month is required (YYYY-MM)' });

  const budgets = await Budget.find({ user: req.user._id, month }).populate('category', 'name color icon');

  const [year, m] = month.split('-');
  const startDate = new Date(year, m - 1, 1);
  const endDate = new Date(year, m, 0, 23, 59, 59, 999);

  const expenses = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user._id), type: 'expense', date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } }
  ]);

  const expenseMap = {};
  expenses.forEach(e => expenseMap[e._id.toString()] = e.total);

  const result = budgets.filter(b => b.category !== null).map(b => {
    const spent = expenseMap[b.category._id.toString()] || 0;
    return {
      _id: b._id,
      category: b.category,
      limit: b.limit,
      month: b.month,
      spent,
      progress: b.limit > 0 ? (spent / b.limit) * 100 : 0
    };
  });

  res.status(200).json({ success: true, data: result });
});

exports.recommendBudgets = asyncHandler(async (req, res) => {
  const recommendations = await budgetService.recommendBudgets(req.user._id, req.user.monthlyIncome || 0);
  res.status(200).json({ success: true, data: recommendations });
});

exports.saveBudgets = asyncHandler(async (req, res) => {
  const { month, budgets } = req.body; // budgets: [{category, limit}]
  if (!month || !budgets || !Array.isArray(budgets)) {
    return res.status(400).json({ success: false, message: 'Invalid data format' });
  }

  const results = [];
  for (const b of budgets) {
    if (!b.category || b.limit == null) continue;
    const updated = await Budget.findOneAndUpdate(
      { user: req.user._id, month, category: b.category },
      { limit: b.limit },
      { upsert: true, new: true }
    );
    results.push(updated);
  }

  res.status(200).json({ success: true, message: 'Budgets saved', data: results });
});
