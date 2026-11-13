const asyncHandler = require('../middleware/asyncHandler');
const statementParser = require('../services/statementParser');
const categorizer = require('../services/categorizer');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

exports.parseUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    const result = await statementParser.parseFile(req.file.buffer, req.file.originalname);
    res.status(200).json({
      success: true,
      data: {
        headers: result.headers,
        rows: result.rows,
        previewRows: result.rows.slice(0, 50),
        columnGuess: result.columnGuess,
        totalRows: result.totalRows
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

exports.importTransactions = asyncHandler(async (req, res) => {
  const { rows, mapping, overrides } = req.body;
  if (!rows || !mapping) {
    return res.status(400).json({ success: false, message: 'Rows and mapping are required' });
  }

  const { validRows, invalidRows } = statementParser.processRows(rows, mapping, overrides || {});

  if (validRows.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid transactions found to import', invalidRows });
  }

  // Find existing transactions for this user to check duplicates
  const existingTransactions = await Transaction.find({ user: req.user._id }).select('amount type note date');

  // Track match frequency count so legitimate multiple same-day identical transactions are preserved
  const existingCounts = new Map();
  for (const t of existingTransactions) {
    const dateStr = t.date ? new Date(t.date).toISOString().slice(0, 10) : '';
    const key = `${t.amount}_${t.type}_${(t.note || '').trim().toLowerCase()}_${dateStr}`;
    existingCounts.set(key, (existingCounts.get(key) || 0) + 1);
  }

  // Pre-fetch all categories for user + defaults ONCE (avoids N queries in loop)
  const allCategories = await Category.find({
    $or: [{ user: req.user._id }, { isDefault: true }]
  });
  const categoryMap = new Map(allCategories.map(c => [c._id.toString(), c]));
  const defaultExpenseOther = allCategories.find(c => c.type === 'expense' && c.name === 'Other');
  const defaultIncomeOther = allCategories.find(c => c.type === 'income' && c.name === 'Other Income');

  const userCatsExpense = allCategories.filter(c => c.type === 'expense' && c.user && c.user.toString() === req.user._id.toString());
  const defaultCatsExpense = allCategories.filter(c => c.type === 'expense' && (!c.user || c.isDefault));
  const userCatsIncome = allCategories.filter(c => c.type === 'income' && c.user && c.user.toString() === req.user._id.toString());
  const defaultCatsIncome = allCategories.filter(c => c.type === 'income' && (!c.user || c.isDefault));

  // In-memory cache for note categorization
  const noteCatCache = new Map();

  const toImport = [];
  let skipped = 0;
  let latestDate = null;

  for (const row of validRows) {
    const rowDateStr = row.date ? new Date(row.date).toISOString().slice(0, 10) : '';
    const key = `${row.amount}_${row.type}_${(row.note || '').trim().toLowerCase()}_${rowDateStr}`;

    const currentExistingCount = existingCounts.get(key) || 0;
    if (currentExistingCount > 0) {
      // One duplicate found in DB — decrement so any second legitimate occurrence in this batch can still be imported
      existingCounts.set(key, currentExistingCount - 1);
      skipped++;
      continue;
    }

    if (!latestDate || row.date > latestDate) {
      latestDate = row.date;
    }

    let catId = null;
    let catSource = 'uncategorized';

    if (row.category && categoryMap.has(String(row.category))) {
      catId = row.category;
      catSource = 'manual';
    } else {
      const cacheKey = `${row.type}___${(row.note || '').trim()}`;
      if (noteCatCache.has(cacheKey)) {
        const cached = noteCatCache.get(cacheKey);
        catId = cached.catId;
        catSource = cached.catSource;
      } else {
        const norm = categorizer.normalizeNote(row.note);
        const userCats = row.type === 'income' ? userCatsIncome : userCatsExpense;
        const defaultCats = row.type === 'income' ? defaultCatsIncome : defaultCatsExpense;
        const fallbackOther = row.type === 'income' ? defaultIncomeOther : defaultExpenseOther;

        let match = categorizer.findBestMatch(norm, userCats);
        if (!match) {
          match = categorizer.findBestMatch(norm, defaultCats);
        }

        if (match) {
          catId = match.category._id;
          catSource = 'rule';
        } else {
          catId = fallbackOther?._id || null;
          catSource = 'uncategorized';
        }
        noteCatCache.set(cacheKey, { catId, catSource });
      }
    }

    toImport.push({
      user: req.user._id,
      amount: row.amount,
      type: row.type,
      date: row.date,
      note: row.note,
      category: catId,
      categorySource: catSource,
      source: 'upload'
    });
  }

  if (toImport.length > 0) {
    await Transaction.insertMany(toImport);
  }

  // Determine the target month (YYYY-MM) so frontend can redirect to the data's month
  let targetMonth = null;
  if (latestDate) {
    const d = new Date(latestDate);
    targetMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  } else if (validRows.length > 0 && validRows[0].date) {
    const d = new Date(validRows[0].date);
    targetMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  res.status(200).json({
    success: true,
    data: {
      imported: toImport.length,
      skipped,
      invalid: invalidRows.length,
      total: validRows.length + invalidRows.length,
      targetMonth
    }
  });
});
