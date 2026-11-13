const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const asyncHandler = require('../middleware/asyncHandler');
const categorizer = require('../services/categorizer');

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({
    $or: [{ user: req.user._id }, { isDefault: true }]
  });
  res.status(200).json({ success: true, data: categories });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, type, color, icon, keywords } = req.body;
  if (!name || !type) return res.status(400).json({ success: false, message: 'Name and type are required' });

  const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, type, $or: [{ user: req.user._id }, { isDefault: true }] });
  if (existing) return res.status(400).json({ success: false, message: 'Category already exists' });

  const category = await Category.create({
    name,
    type,
    color,
    icon,
    keywords,
    user: req.user._id,
    isDefault: false
  });

  res.status(201).json({ success: true, data: category });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { name, color, icon, keywords } = req.body;
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id, isDefault: false });

  if (!category) return res.status(404).json({ success: false, message: 'Custom category not found' });

  if (name) category.name = name;
  if (color) category.color = color;
  if (icon) category.icon = icon;
  if (keywords) category.keywords = keywords;

  await category.save();

  res.status(200).json({ success: true, data: category });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const { reassignTo } = req.query;
  const category = await Category.findOne({ _id: req.params.id, user: req.user._id, isDefault: false });

  if (!category) return res.status(404).json({ success: false, message: 'Custom category not found' });

  const txCount = await Transaction.countDocuments({ category: category._id, user: req.user._id });
  
  if (txCount > 0) {
    if (!reassignTo) {
      return res.status(400).json({ success: false, message: 'Category is in use. Please provide reassignTo parameter.' });
    }
    const newCat = await Category.findOne({ _id: reassignTo, $or: [{ user: req.user._id }, { isDefault: true }] });
    if (!newCat) return res.status(400).json({ success: false, message: 'Reassign category not found' });
    
    await Transaction.updateMany({ category: category._id, user: req.user._id }, { category: reassignTo, categorySource: 'manual' });
  }

    // Clean up orphaned budgets for this category
    const Budget = require('../models/Budget');
    await Budget.deleteMany({ category: category._id, user: req.user._id });

  await Category.deleteOne({ _id: category._id });

  res.status(200).json({ success: true, message: 'Category deleted' });
});

exports.recategorize = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id, categorySource: 'uncategorized' });
  let count = 0;

  for (const tx of transactions) {
    const autoCat = await categorizer.categorizeNote(tx.note, tx.type, req.user._id);
    if (autoCat.categorySource === 'rule') {
      tx.category = autoCat.categoryId;
      tx.categorySource = 'rule';
      await tx.save();
      count++;
    }
  }

  res.status(200).json({ success: true, message: `Recategorized ${count} transactions`, data: { count } });
});
