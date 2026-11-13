const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

async function predictExpenses(userId) {
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  
  // Aggregate expenses for the last 6 months grouped by category and month
  const result = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), type: 'expense', date: { $gte: startMonth } } },
    { $group: {
        _id: {
            category: '$category',
            year: { $year: '$date' },
            month: { $month: '$date' }
        },
        total: { $sum: '$amount' }
    }},
    { $lookup: { from: 'categories', localField: '_id.category', foreignField: '_id', as: 'categoryDoc' } },
    { $unwind: '$categoryDoc' }
  ]);

  // Organize data: { categoryId: { name, monthlyData: { "YYYY-MM": total } } }
  const catData = {};
  result.forEach(r => {
    const catId = r._id.category.toString();
    if (!catData[catId]) {
      catData[catId] = { name: r.categoryDoc.name, totals: [] };
    }
    const monthStr = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
    catData[catId].totals.push({ month: monthStr, amount: r.total });
  });

  const byCategory = [];
  let overallPredicted = 0;

  for (const catId in catData) {
    const data = catData[catId];
    // Sort totals by month string ascending
    data.totals.sort((a, b) => a.month.localeCompare(b.month));
    
    // Grab the last up to 3 months for WMA
    const recent = data.totals.slice(-3);
    
    let predicted = 0;
    let confidence = 'low';
    
    if (recent.length === 3) {
      predicted = recent[0].amount * 0.2 + recent[1].amount * 0.3 + recent[2].amount * 0.5;
      confidence = 'high';
    } else if (recent.length === 2) {
      predicted = recent[0].amount * 0.4 + recent[1].amount * 0.6;
      confidence = 'medium';
    } else if (recent.length === 1) {
      predicted = recent[0].amount;
    }

    // Basic trend slope over available months
    let trend = 0;
    if (recent.length > 1) {
      const first = recent[0].amount;
      const last = recent[recent.length - 1].amount;
      trend = last - first;
    }

    if (predicted > 0) {
      byCategory.push({
        categoryId: catId,
        name: data.name,
        predicted: Math.round(predicted),
        trend,
        confidence
      });
      overallPredicted += predicted;
    }
  }

  return {
    totalPredicted: Math.round(overallPredicted),
    byCategory: byCategory.sort((a,b) => b.predicted - a.predicted),
    confidence: byCategory.some(c => c.confidence === 'high') ? 'high' : (byCategory.length > 0 ? 'medium' : 'low'),
    method: 'Weighted Moving Average'
  };
}

module.exports = { predictExpenses };
