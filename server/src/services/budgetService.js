const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

async function recommendBudgets(userId, monthlyIncome) {
  const needsKeywords = ['rent', 'groceries', 'bills', 'utilities', 'health', 'education'];
  const wantsKeywords = ['food', 'shopping', 'entertainment', 'travel'];
  
  const categories = await Category.find({
    $or: [{ user: userId }, { isDefault: true }]
  });

  const recommended = [];
  
  for (const cat of categories) {
    if (cat.type !== 'expense') continue;
    const name = cat.name.toLowerCase();
    
    let classification = 'want';
    if (needsKeywords.some(k => name.includes(k))) classification = 'need';
    else if (name.includes('investment') || name.includes('saving')) classification = 'saving';

    let limit = 0;
    if (monthlyIncome > 0) {
      // 50/30/20 loose mapping -> simplified recommendation
      if (classification === 'need') limit = (monthlyIncome * 0.5) / 5; // spread across Needs
      if (classification === 'want') limit = (monthlyIncome * 0.3) / 5; // spread across Wants
      if (classification === 'saving') limit = (monthlyIncome * 0.2); // total saving
    } else {
      limit = 5000; // default generic limit
    }

    recommended.push({
      category: cat._id,
      categoryId: cat._id,
      name: cat.name,
      categoryName: cat.name,
      classification,
      suggestedLimit: Math.round(limit),
      limit: Math.round(limit)
    });
  }

  return { recommendations: recommended };
}

module.exports = { recommendBudgets };
