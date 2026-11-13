const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');
const categorizer = require('../services/categorizer');

exports.getTransactions = asyncHandler(async (req, res) => {
  const {
    from, to, startDate, endDate, month, category, type,
    q, search, sort = '-date', page = 1, limit = 20
  } = req.query;
  const query = { user: req.user._id };

  if (month) {
    const [year, m] = month.split('-');
    const startOfMonth = new Date(year, m - 1, 1);
    const endOfMonth = new Date(year, m, 0, 23, 59, 59, 999);
    query.date = { $gte: startOfMonth, $lte: endOfMonth };
  } else {
    // Accept both from/to and startDate/endDate (frontend uses the latter)
    const dateFrom = from || startDate;
    const dateTo = to || endDate;
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
  }
  if (category) query.category = category;
  if (type) query.type = type;
  const searchTerm = search || q;
  if (searchTerm) query.note = { $regex: searchTerm, $options: 'i' };

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const transactions = await Transaction.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate('category', 'name color icon type');

  const total = await Transaction.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});

exports.getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id })
    .populate('category', 'name color icon type');
  
  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Transaction not found' });
  }

  res.status(200).json({ success: true, data: transaction });
});

exports.createTransaction = asyncHandler(async (req, res) => {
  const { amount, type, date, note, category } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount is required' });
  if (!type) return res.status(400).json({ success: false, message: 'Type is required' });
  
  let finalDate = date ? new Date(date) : new Date();
  if (finalDate > new Date()) return res.status(400).json({ success: false, message: 'Date cannot be in the future' });

  let categoryId = category;
  let categorySource = 'manual';

  if (!categoryId) {
    const autoCat = await categorizer.categorizeNote(note, type, req.user._id);
    categoryId = autoCat.categoryId;
    categorySource = autoCat.categorySource;
  }

  // Validate category belongs to user or is a default
  if (categoryId) {
    const validCat = await Category.findOne({ _id: categoryId, $or: [{ user: req.user._id }, { isDefault: true }] });
    if (!validCat) return res.status(400).json({ success: false, message: 'Invalid category' });
  }

  const transaction = await Transaction.create({
    user: req.user._id,
    amount,
    type,
    date: finalDate,
    note,
    category: categoryId,
    categorySource
  });

  const populated = await Transaction.findById(transaction._id).populate('category', 'name color icon type');

  res.status(201).json({ success: true, data: populated });
});

exports.updateTransaction = asyncHandler(async (req, res) => {
  const { amount, type, date, note, category } = req.body;
  const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });

  if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

  let shouldRecategorize = false;
  if (note !== undefined && note !== transaction.note && transaction.categorySource !== 'manual' && !category) {
    shouldRecategorize = true;
  }

  if (amount !== undefined) transaction.amount = amount;
  if (type) transaction.type = type;
  if (date) transaction.date = new Date(date);
  if (note !== undefined) transaction.note = note;
  
  if (category) {
    transaction.category = category;
    transaction.categorySource = 'manual';
  } else if (shouldRecategorize) {
    const autoCat = await categorizer.categorizeNote(transaction.note, transaction.type, req.user._id);
    transaction.category = autoCat.categoryId;
    transaction.categorySource = autoCat.categorySource;
  }

  if (transaction.category) {
    const validCat = await Category.findOne({ _id: transaction.category, $or: [{ user: req.user._id }, { isDefault: true }] });
    if (!validCat) return res.status(400).json({ success: false, message: 'Invalid category' });
  }

  await transaction.save();
  const populated = await Transaction.findById(transaction._id).populate('category', 'name color icon type');

  res.status(200).json({ success: true, data: populated });
});

exports.deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

  res.status(200).json({ success: true, message: 'Transaction deleted' });
});

exports.deleteAllTransactions = asyncHandler(async (req, res) => {
  const result = await Transaction.deleteMany({ user: req.user._id });
  res.status(200).json({
    success: true,
    message: `Deleted ${result.deletedCount} transactions`,
    data: { deleted: result.deletedCount }
  });
});

exports.suggestCategory = asyncHandler(async (req, res) => {
  const { note, type } = req.body;
  if (!type) return res.status(400).json({ success: false, message: 'Type is required' });

  const data = await categorizer.suggestCategory(note, type, req.user._id);
  res.status(200).json({ success: true, data });
});

