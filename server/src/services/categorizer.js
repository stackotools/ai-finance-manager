const Category = require('../models/Category');
const env = require('../config/env');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Normalize a transaction note for matching
 */
function normalizeNote(note) {
  if (!note) return '';
  let normalized = note.toLowerCase().trim();
  // Strip common banking channel prefixes
  normalized = normalized.replace(/\b(upi|imps|neft|rtgs|ach|pos|billpay|atm-wdl|int\.pd)\b[\s\/\-]*/gi, ' ');
  // Strip numeric or alphanumeric reference codes with numbers, preserving English words
  normalized = normalized.replace(/\b[0-9]{6,}\b/gi, ' ');
  normalized = normalized.replace(/\b(?=[a-z0-9]*[0-9])[a-z0-9]{8,}\b/gi, ' ');
  // Replace symbols with spaces
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

/**
 * Match a normalized note against category keywords
 */
function findBestMatch(normalizedNote, categories) {
  let bestMatch = null;
  let longestKeyword = 0;

  for (const category of categories) {
    if (!category.keywords) continue;
    for (const keyword of category.keywords) {
      if (keyword && normalizedNote.includes(keyword) && keyword.length > longestKeyword) {
        bestMatch = { category, matchedKeyword: keyword };
        longestKeyword = keyword.length;
      }
    }
  }
  return bestMatch;
}

/**
 * Use Gemini AI to categorize an unknown transaction note
 */
async function aiClassifyNote(note, type, categoryList) {
  if (!env.GEMINI_API_KEY || !note || categoryList.length === 0) return null;

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL || 'gemini-3.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: `You are an Indian banking and UPI transaction categorizer.
Given a transaction note and a list of valid category names, choose the single best matching category.
If none apply, return "Other".
Respond ONLY with JSON: { "categoryName": "string" }`
    });

    const categoryNames = categoryList.map(c => c.name);
    const prompt = `Transaction description: "${note}"\nType: ${type}\nAllowed Categories: ${JSON.stringify(categoryNames)}`;

    const res = await model.generateContent(prompt);
    const parsed = JSON.parse(res.response.text());

    if (parsed && parsed.categoryName) {
      const match = categoryList.find(c => c.name.toLowerCase() === parsed.categoryName.toLowerCase());
      if (match) return match;
    }
  } catch (err) {
    // Silently fall back to rule-based
  }
  return null;
}

/**
 * Categorize a single transaction note
 */
async function categorizeNote(note, type, userId) {
  const categories = await Category.find({
    $or: [{ user: userId }, { isDefault: true }]
  });
  const typeCategories = categories.filter(c => c.type === type);
  const normalizedNote = normalizeNote(note);

  if (!normalizedNote) {
    const other = typeCategories.find(c => c.name === 'Other' || c.name === 'Other Income');
    return { categoryId: other?._id, categorySource: 'uncategorized' };
  }

  // 1. Check user custom categories keyword match
  const userCategories = typeCategories.filter(c => c.user && c.user.toString() === userId.toString());
  const defaultCategories = typeCategories.filter(c => !c.user || c.isDefault);

  let match = findBestMatch(normalizedNote, userCategories);
  if (!match) {
    match = findBestMatch(normalizedNote, defaultCategories);
  }

  if (match) {
    return { categoryId: match.category._id, categorySource: 'rule' };
  }

  // 2. Fall back to Gemini AI if API key is present
  if (env.GEMINI_API_KEY) {
    const aiCategory = await aiClassifyNote(note, type, typeCategories);
    if (aiCategory && aiCategory.name !== 'Other' && aiCategory.name !== 'Other Income') {
      return { categoryId: aiCategory._id, categorySource: 'ai' };
    }
  }

  // 3. Fallback to Other
  const other = typeCategories.find(c => c.name === 'Other' || c.name === 'Other Income');
  return { categoryId: other?._id, categorySource: 'uncategorized' };
}

/**
 * Categorize multiple notes in bulk
 */
async function categorizeNotes(notes, type, userId) {
  const categories = await Category.find({
    $or: [{ user: userId }, { isDefault: true }]
  });
  const typeCategories = categories.filter(c => c.type === type);
  const userCategories = typeCategories.filter(c => c.user && c.user.toString() === userId.toString());
  const defaultCategories = typeCategories.filter(c => !c.user || c.isDefault);
  const other = typeCategories.find(c => c.name === 'Other' || c.name === 'Other Income');

  return notes.map(note => {
    const normalizedNote = normalizeNote(note);
    if (!normalizedNote) {
      return { note, categoryId: other?._id, categorySource: 'uncategorized' };
    }
    let match = findBestMatch(normalizedNote, userCategories);
    if (!match) match = findBestMatch(normalizedNote, defaultCategories);
    if (match) {
      return { note, categoryId: match.category._id, categorySource: 'rule' };
    }
    return { note, categoryId: other?._id, categorySource: 'uncategorized' };
  });
}

/**
 * Suggest category for UI auto-suggest
 */
async function suggestCategory(note, type, userId) {
  const result = await categorizeNote(note, type, userId);
  if (result.categoryId) {
    const category = await Category.findById(result.categoryId);
    return { category, categoryId: result.categoryId, source: result.categorySource };
  }
  return { category: null, categoryId: null, source: 'uncategorized' };
}

module.exports = { normalizeNote, categorizeNote, categorizeNotes, suggestCategory, findBestMatch };
