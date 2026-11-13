const Transaction = require('../models/Transaction');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

exports.getSummary = asyncHandler(async (req, res) => {
  const { month } = req.query; // YYYY-MM
  let matchQuery = { user: new mongoose.Types.ObjectId(req.user._id) };
  
  if (month) {
    const [year, m] = month.split('-');
    const startDate = new Date(year, m - 1, 1);
    const endDate = new Date(year, m, 0, 23, 59, 59, 999);
    matchQuery.date = { $gte: startDate, $lte: endDate };
  }

  const result = await Transaction.aggregate([
    { $match: matchQuery },
    { $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
    }}
  ]);

  let totalIncome = 0;
  let totalExpense = 0;
  let transactionCount = 0;

  result.forEach(r => {
    transactionCount += r.count;
    if (r._id === 'income') totalIncome += r.total;
    if (r._id === 'expense') totalExpense += r.total;
  });

  // All-time income & expense for overall balance
  const balanceResult = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
    { $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
    }}
  ]);

  let allTimeIncome = 0;
  let allTimeExpense = 0;
  let allTimeCount = 0;
  balanceResult.forEach(r => {
    allTimeCount += r.count || 0;
    if (r._id === 'income') allTimeIncome += r.total;
    if (r._id === 'expense') allTimeExpense += r.total;
  });
  
  const balance = allTimeIncome - allTimeExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;

  // Find latest transaction date for automatic month alignment
  const latestTx = await Transaction.findOne({ user: req.user._id }).sort({ date: -1 }).select('date');
  let latestDataMonth = null;
  if (latestTx && latestTx.date) {
    const d = new Date(latestTx.date);
    latestDataMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  res.status(200).json({
    success: true,
    data: {
      totalIncome,
      totalExpense,
      balance,
      savingsRate: Math.max(0, savingsRate),
      transactionCount,
      allTimeIncome,
      allTimeExpense,
      allTimeCount,
      latestDataMonth
    }
  });
});

exports.getCategorySplit = asyncHandler(async (req, res) => {
  const { month } = req.query; // YYYY-MM
  let matchQuery = { user: new mongoose.Types.ObjectId(req.user._id), type: 'expense' };
  
  if (month) {
    const [year, m] = month.split('-');
    const startDate = new Date(year, m - 1, 1);
    const endDate = new Date(year, m, 0, 23, 59, 59, 999);
    matchQuery.date = { $gte: startDate, $lte: endDate };
  }

  const result = await Transaction.aggregate([
    { $match: matchQuery },
    { $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
    }},
    { $sort: { total: -1 } },
    { $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
    }},
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }
  ]);

  const totalExpense = result.reduce((acc, curr) => acc + curr.total, 0);

  const data = result.map(r => ({
    category: r.category ? {
      _id: r.category._id,
      name: r.category.name,
      color: r.category.color,
      icon: r.category.icon
    } : {
      _id: 'uncategorized',
      name: 'Uncategorized',
      color: '#9ca3af',
      icon: 'help-circle'
    },
    total: r.total,
    count: r.count,
    percentage: totalExpense > 0 ? (r.total / totalExpense) * 100 : 0
  }));

  res.status(200).json({ success: true, data });
});

exports.getMonthlyTrend = asyncHandler(async (req, res) => {
  const monthsStr = req.query.months || 6;
  const months = parseInt(monthsStr, 10);
  const targetMonth = req.query.month; // YYYY-MM (optional)

  let baseDate = new Date();
  if (targetMonth && /^\d{4}-\d{2}$/.test(targetMonth)) {
    const [y, m] = targetMonth.split('-');
    baseDate = new Date(Number(y), Number(m) - 1, 1);
  } else {
    // If no target month, check latest transaction date
    const latestTx = await Transaction.findOne({ user: req.user._id }).sort({ date: -1 }).select('date');
    if (latestTx && latestTx.date) {
      const txD = new Date(latestTx.date);
      // If latest transaction is within the past or different year, use it as anchor
      baseDate = txD;
    }
  }

  const startMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() - months + 1, 1);
  const endMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const result = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user._id), date: { $gte: startMonth, $lte: endMonth } } },
    { $group: {
        _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
        },
        total: { $sum: '$amount' }
    }}
  ]);

  const trendMap = {};
  for (let i = 0; i < months; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
    trendMap[monthKey] = { month: monthKey, monthLabel, income: 0, expense: 0 };
  }

  result.forEach(r => {
    const monthKey = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
    if (trendMap[monthKey]) {
      if (r._id.type === 'income') trendMap[monthKey].income += r.total;
      if (r._id.type === 'expense') trendMap[monthKey].expense += r.total;
    }
  });

  const data = Object.values(trendMap).sort((a, b) => a.month.localeCompare(b.month));

  res.status(200).json({ success: true, data });
});

exports.getDashboard = asyncHandler(async (req, res) => {
  const { month } = req.query;
  const now = new Date();
  const selectedMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [year, m] = selectedMonth.split('-');
  const startDate = new Date(year, m - 1, 1);
  const endDate = new Date(year, m, 0, 23, 59, 59, 999);

  // Month totals
  const monthlyRes = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user._id), date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);
  let totalIncome = 0;
  let totalExpense = 0;
  let transactionCount = 0;
  monthlyRes.forEach(r => {
    transactionCount += r.count;
    if (r._id === 'income') totalIncome += r.total;
    if (r._id === 'expense') totalExpense += r.total;
  });

  // All time balance
  const balanceRes = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } }
  ]);
  let allTimeIncome = 0;
  let allTimeExpense = 0;
  balanceRes.forEach(r => {
    if (r._id === 'income') allTimeIncome += r.total;
    if (r._id === 'expense') allTimeExpense += r.total;
  });
  const balance = allTimeIncome - allTimeExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Recent transactions
  const recentTransactions = await Transaction.find({ user: req.user._id })
    .sort({ date: -1 })
    .limit(5)
    .populate('category', 'name color icon type');

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalIncome,
        totalExpense,
        balance,
        savingsRate,
        transactionCount,
        allTimeIncome,
        allTimeExpense
      },
      recentTransactions
    }
  });
});
