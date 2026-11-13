const asyncHandler = require('../middleware/asyncHandler');
const InsightCache = require('../models/InsightCache');
const aiService = require('../services/aiService');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const predictionService = require('../services/predictionService');

const getAnalyticsData = async (userId, month) => {
  const [year, m] = month.split('-');
  const startDate = new Date(year, m - 1, 1);
  const endDate = new Date(year, m, 0, 23, 59, 59, 999);

  // monthly totals
  const monthlyTotalsAggr = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } }
  ]);
  const monthlyTotals = { income: 0, expense: 0 };
  monthlyTotalsAggr.forEach(t => { monthlyTotals[t._id] = t.total; });

  // category split
  const categorySplitAggr = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), type: 'expense', date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }
  ]);

  const categorySplit = categorySplitAggr.map(c => ({
    name: c.category?.name || 'Uncategorized',
    total: c.total,
    percentage: monthlyTotals.expense > 0 ? (c.total / monthlyTotals.expense) * 100 : 0
  }));

  // previous months trend (last 3 months)
  const threeMonthsAgo = new Date(year, m - 3, 1);
  const prevMonthsAggr = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: threeMonthsAgo, $lte: endDate } } },
    { $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' }
    }}
  ]);
  const trendMap = {};
  for (let i = 0; i < 3; i++) {
    const d = new Date(year, m - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendMap[key] = { month: key, income: 0, expense: 0 };
  }
  prevMonthsAggr.forEach(r => {
    const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
    if (trendMap[key]) {
      trendMap[key][r._id.type] += r.total;
    }
  });
  const previousMonths = Object.values(trendMap).sort((a, b) => b.month.localeCompare(a.month)); // descending

  return { monthlyTotals, categorySplit, previousMonths };
};

exports.getInsights = asyncHandler(async (req, res) => {
  const { month } = req.query; // YYYY-MM
  if (!month) return res.status(400).json({ success: false, message: 'Month is required (YYYY-MM)' });

  let cache = await InsightCache.findOne({ user: req.user._id, month });
  
  // Use cache if generated within last 24h
  if (cache && (new Date() - cache.generatedAt < 24 * 60 * 60 * 1000)) {
    return res.status(200).json({ success: true, data: cache.insights });
  }

  const data = await getAnalyticsData(req.user._id, month);
  const insights = await aiService.generateInsights(data);

  if (cache) {
    cache.insights = insights;
    cache.generatedAt = new Date();
    await cache.save();
  } else {
    await InsightCache.create({ user: req.user._id, month, insights });
  }

  res.status(200).json({ success: true, data: insights });
});

exports.regenerateInsights = asyncHandler(async (req, res) => {
  const { month } = req.query; // YYYY-MM
  if (!month) return res.status(400).json({ success: false, message: 'Month is required (YYYY-MM)' });

  const data = await getAnalyticsData(req.user._id, month);
  const insights = await aiService.generateInsights(data);

  await InsightCache.findOneAndUpdate(
    { user: req.user._id, month },
    { insights, generatedAt: new Date() },
    { upsert: true, new: true }
  );

  res.status(200).json({ success: true, data: insights });
});

exports.getPrediction = asyncHandler(async (req, res) => {
  const result = await predictionService.predictExpenses(req.user._id);
  res.status(200).json({ success: true, data: result });
});
