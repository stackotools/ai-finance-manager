const mongoose = require('mongoose');
const Category = require('../models/Category');
const db = require('../config/db');

const seedCategories = async () => {
  try {
    const defaultExists = await Category.findOne({ isDefault: true });
    if (defaultExists) {
      console.log('Default categories already seeded.');
      return;
    }

    const defaultCategories = [
      { name: 'Food', type: 'expense', color: '#EF4444', icon: 'utensils', keywords: ['zomato', 'swiggy', 'dominos', 'pizza', 'mcdonald', 'kfc', 'restaurant', 'cafe', 'starbucks', 'dunzo', 'burger', 'biryani', 'food', 'canteen', 'mess', 'chai', 'tea stall', 'bakery', 'snack', 'snacks', 'lunch', 'dinner'], isDefault: true, user: null },
      { name: 'Groceries', type: 'expense', color: '#22C55E', icon: 'shopping-cart', keywords: ['bigbasket', 'blinkit', 'zepto', 'grofers', 'dmart', 'reliance fresh', 'instamart', 'grocery', 'vegetables', 'fruits', 'supermarket', 'groceries'], isDefault: true, user: null },
      { name: 'Travel', type: 'expense', color: '#3B82F6', icon: 'car', keywords: ['uber', 'ola', 'rapido', 'irctc', 'redbus', 'makemytrip', 'goibibo', 'indigo', 'petrol', 'fuel', 'hp', 'iocl', 'metro', 'fastag', 'cab', 'auto', 'flight', 'train', 'bus', 'ride', 'ticket'], isDefault: true, user: null },
      { name: 'Shopping', type: 'expense', color: '#A855F7', icon: 'bag', keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'croma', 'shopping', 'mall', 't-shirt', 'clothes', 'earphones'], isDefault: true, user: null },
      { name: 'Bills & Utilities', type: 'expense', color: '#F59E0B', icon: 'zap', keywords: ['electricity', 'jio', 'airtel', 'vi', 'bsnl', 'broadband', 'gas', 'water bill', 'recharge', 'dth', 'tata power', 'wifi', 'internet', 'phone bill', 'mobile', 'billpay', 'bses'], isDefault: true, user: null },
      { name: 'Entertainment', type: 'expense', color: '#EC4899', icon: 'film', keywords: ['netflix', 'hotstar', 'prime video', 'spotify', 'bookmyshow', 'youtube premium', 'gaming', 'movie', 'theatre', 'concert', 'pvr cinemas', 'subscription'], isDefault: true, user: null },
      { name: 'Health', type: 'expense', color: '#14B8A6', icon: 'heart', keywords: ['apollo', 'pharmacy', 'medplus', '1mg', 'netmeds', 'hospital', 'clinic', 'lab', 'doctor', 'medical', 'medicine', 'health', 'practo', 'consult'], isDefault: true, user: null },
      { name: 'Education', type: 'expense', color: '#6366F1', icon: 'book', keywords: ['udemy', 'coursera', 'byju', 'unacademy', 'school', 'college', 'tuition', 'books', 'course', 'coaching', 'exam', 'xerox', 'print', 'notes', 'stationery', 'exam fee', 'university', 'semester'], isDefault: true, user: null },
      { name: 'Rent', type: 'expense', color: '#78716C', icon: 'home', keywords: ['rent', 'landlord', 'housing society', 'maintenance', 'pg', 'hostel', 'room rent'], isDefault: true, user: null },
      { name: 'Investments', type: 'expense', color: '#0EA5E9', icon: 'trending-up', keywords: ['zerodha', 'groww', 'upstox', 'sip', 'mutual fund', 'lic', 'ppf', 'nps', 'investment', 'stocks', 'shares', 'emi', 'loan', 'home loan', 'hdfc home loan'], isDefault: true, user: null },
      { name: 'Other', type: 'expense', color: '#6B7280', icon: 'more-horizontal', keywords: ['atm', 'wdl', 'cash', 'atm-wdl', 'gift shop', 'diwali gift'], isDefault: true, user: null },
      { name: 'Salary', type: 'income', color: '#10B981', icon: 'briefcase', keywords: ['salary', 'payroll', 'credited by employer', 'wages', 'stipend'], isDefault: true, user: null },
      { name: 'Freelance', type: 'income', color: '#8B5CF6', icon: 'laptop', keywords: ['freelance', 'consulting', 'contract', 'gig', 'project payment', 'tutoring', 'tutoring fee'], isDefault: true, user: null },
      { name: 'Other Income', type: 'income', color: '#6B7280', icon: 'plus-circle', keywords: ['interest', 'dividend', 'refund', 'cashback', 'reward', 'pocket money', 'split', 'shared bill', 'trip money back', 'gift split', 'scholarship', 'merit scholarship', 'savings interest'], isDefault: true, user: null }
    ];

    await Category.insertMany(defaultCategories);
    console.log('Default categories seeded successfully.');
  } catch (error) {
    console.error(`Error seeding categories: ${error.message}`);
  }
};

if (require.main === module) {
  (async () => {
    await db.connect();
    await seedCategories();
    process.exit(0);
  })();
} else {
  module.exports = seedCategories;
}
