const mongoose = require('mongoose');
const env = require('../config/env');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const formatINR = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (d) => d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

/**
 * Build a comprehensive financial snapshot of the user's real transactions.
 */
async function buildContext(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const curStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const curEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    allTimeAgg,
    currentAgg,
    categoriesAllTime,
    categoriesCurrent,
    biggestExpense,
    topMerchants,
    monthlyAgg,
    recent,
    totalCount,
    latestTx
  ] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: uid } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: { user: uid, date: { $gte: curStart, $lte: curEnd } } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: { user: uid, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } }
    ]),
    Transaction.aggregate([
      { $match: { user: uid, type: 'expense', date: { $gte: curStart, $lte: curEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } }
    ]),
    Transaction.findOne({ user: uid, type: 'expense' }).sort({ amount: -1 }).populate('category', 'name'),
    Transaction.aggregate([
      { $match: { user: uid, type: 'expense' } },
      { $group: { _id: '$note', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]),
    Transaction.aggregate([
      { $match: { user: uid, date: { $gte: trendStart } } },
      { $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' }
      } }
    ]),
    Transaction.find({ user: uid }).sort({ date: -1 }).limit(10).populate('category', 'name'),
    Transaction.countDocuments({ user: uid }),
    Transaction.findOne({ user: uid }).sort({ date: -1 })
  ]);

  const totals = (agg) => {
    const out = { income: 0, expense: 0, count: 0 };
    agg.forEach(r => {
      out.count += r.count || 0;
      if (r._id === 'income') out.income += r.total;
      if (r._id === 'expense') out.expense += r.total;
    });
    return out;
  };

  const allTime = totals(allTimeAgg);
  const current = totals(currentAgg);
  const totalExpense = categoriesAllTime.reduce((s, c) => s + c.total, 0);

  const trendMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendMap[monthKey(d)] = { month: monthKey(d), label: monthLabel(d), income: 0, expense: 0 };
  }
  monthlyAgg.forEach(r => {
    const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
    if (trendMap[key]) trendMap[key][r._id.type] += r.total;
  });

  return {
    currency: 'INR',
    allTime: { ...allTime, balance: allTime.income - allTime.expense },
    currentMonth: { key: monthKey(now), label: monthLabel(now), ...current, balance: current.income - current.expense },
    latestTransactionDate: latestTx ? latestTx.date : null,
    categoriesAllTime: categoriesAllTime.map(c => ({
      name: c.cat?.name || 'Uncategorized',
      total: c.total,
      count: c.count,
      percentage: totalExpense > 0 ? (c.total / totalExpense) * 100 : 0
    })),
    categoriesCurrentMonth: categoriesCurrent.map(c => ({ name: c.cat?.name || 'Uncategorized', total: c.total })),
    biggestExpense: biggestExpense ? {
      note: biggestExpense.note,
      amount: biggestExpense.amount,
      date: biggestExpense.date,
      category: biggestExpense.category?.name || 'Uncategorized'
    } : null,
    topMerchants: topMerchants.filter(m => m._id).map(m => ({ note: m._id, total: m.total, count: m.count })),
    monthlyTrend: Object.values(trendMap),
    recentTransactions: recent.map(t => ({
      note: t.note,
      amount: t.amount,
      type: t.type,
      date: t.date,
      category: t.category?.name || 'Uncategorized'
    })),
    totalTransactions: totalCount
  };
}

/**
 * Find a category mentioned in the user's message
 */
function detectCategory(message, categories) {
  const msg = message.toLowerCase();
  let best = null;
  for (const c of categories) {
    const name = c.name.toLowerCase();
    if (msg.includes(name)) return c;
    const stem = name.replace(/s$/, '');
    if (stem.length >= 4 && msg.includes(stem)) {
      if (!best || stem.length > best.name.length) best = c;
    }
  }
  return best;
}

const HINGLISH_REGEX = /\b(kya|kyu|kyun|kaise|kaisa|kaisi|kitna|kitne|kitni|kharch|kharcha|kharche|kahan|kaha|mera|meri|mere|maine|humne|aap|aapka|aapke|aapki|hai|hain|tha|the|thi|hoga|hogi|batao|bataiye|dekhna|dikhao|paisa|paise|bachat|bachao|mahina|mahine|is|iss|usse|bada|chota|sabse|kisme|kismein|namaste)\b/i;

function isHinglish(text) {
  return HINGLISH_REGEX.test(text || '');
}

/**
 * Natural-language rule engine over real data context (fallback if no AI key configured)
 */
function answerLocally(message, ctx) {
  const msg = message.toLowerCase().trim();
  const hindiMode = isHinglish(msg);

  if (!ctx.totalTransactions) {
    return hindiMode
      ? "Aapka koi transaction record nahi mila. Kripya **Upload Statement** page par jakar apna bank statement upload karein, phir main aapke kharche analyze kar paunga."
      : "No transactions found in your account. Please visit the **Upload Statement** page to upload your bank statement so I can analyze your finances.";
  }

  const latest = [...ctx.monthlyTrend].reverse().find(m => m.income > 0 || m.expense > 0) || null;

  // Greetings / help
  if (/^(hi|hello|hey|hii|yo|namaste|kese ho|kaise ho)\b/.test(msg)) {
    return hindiMode
      ? `Namaste! 👋 Main aapka AI Financial Assistant hoon. Aapke uploaded transactions ke hisab se main bata sakta hoon:\n• "Is mahine kitna kharch hua?"\n• "Sabse zyada kharcha kis category me hai?"\n• "Food ya travel par kitna laga?"\n• "Sabse bada single expense kya tha?"\n• "Bachat (savings) kaise badhayein?"`
      : `Hello! 👋 I am your AI Financial Assistant. Based on your uploaded financial statement, I can help you with:\n• "How much did I spend this month?"\n• "What is my top spending category?"\n• "How much did I spend on Food or Travel?"\n• "What was my largest single expense?"\n• "How can I improve my savings?"`;
  }
  if (/help|what can you do|kya kar sakte/.test(msg)) {
    return hindiMode
      ? `Main aapke real bank transactions ko analyze karke in sawaalon ka jawab de sakta hoon:\n• Total spending, Income aur Savings balance\n• Category-wise kharcha (Food, Travel, Rent, Bills, Shopping...)\n• Sabse bada expense aur top merchants\n• Savings aur budgeting tips`
      : `I can analyze your bank statement transactions to help you with:\n• Total spending, Income, and Net Balance\n• Category breakdown (Food, Travel, Rent, Bills, Shopping, etc.)\n• Largest single expense & top merchants\n• Personalized savings & budgeting tips`;
  }

  // How to save / reduce
  if (/(save|reduc|cut|stop|kam kar|bacha|befizul|waste|saving)/.test(msg)) {
    const top = ctx.categoriesAllTime[0];
    if (!top) {
      return hindiMode
        ? 'Abhi tak koi expense data nahi mila hai jisse savings suggest ki ja sake.'
        : 'No expense data available to suggest savings.';
    }
    return hindiMode
      ? `Aapka sabse bada kharcha **${top.name}** me hua hai — kul ${formatINR(top.total)} (${top.percentage.toFixed(1)}% of all spending).\n\n💡 **Tips:**\n1. Budgets page par jakar **${top.name}** ke liye ek monthly limit set karein.\n2. Non-essential kharche identify karein. 15% cut karne se aap lagbhag ${formatINR(top.total * 0.15)} bacha sakte hain!\n3. Rozana UPI spending monitor karein.`
      : `Your largest expense category is **${top.name}** — totaling ${formatINR(top.total)} (${top.percentage.toFixed(1)}% of all spending).\n\n💡 **Tips to Save:**\n1. Go to Budgets and set a monthly limit for **${top.name}**.\n2. Cut back on discretionary expenses. A 15% reduction would save you roughly ${formatINR(top.total * 0.15)}!\n3. Keep track of frequent small UPI payments.`;
  }

  // Biggest single expense
  if (/(biggest|largest|highest|most expensive|sab se zyada|sabse bada).*(expense|spent|transaction|kharch)|biggest expense|largest expense/.test(msg)) {
    if (!ctx.biggestExpense) {
      return hindiMode ? 'Koi expense transaction nahi mila.' : 'No expense transactions found.';
    }
    const b = ctx.biggestExpense;
    const dateFormatted = b.date ? new Date(b.date).toLocaleDateString('en-IN') : '';
    return hindiMode
      ? `Aapka sabse bada single kharcha **${formatINR(b.amount)}** ka tha: "${b.note}" (${b.category})${dateFormatted ? ` on ${dateFormatted}` : ''}.`
      : `Your largest single expense was **${formatINR(b.amount)}** for "${b.note}" (${b.category})${dateFormatted ? ` on ${dateFormatted}` : ''}.`;
  }

  // Count of transactions
  if (/(how many|number of|kitne).*(transaction|txn)/.test(msg)) {
    return hindiMode
      ? `Aapke account me kul **${ctx.totalTransactions}** transactions recorded hain.`
      : `You have a total of **${ctx.totalTransactions}** recorded transactions.`;
  }

  // Category query
  const mentionedCategory = detectCategory(msg, ctx.categoriesAllTime);
  if (mentionedCategory && /(spend|spent|kharch|expense|on|category|how much|kitna)/.test(msg)) {
    return hindiMode
      ? `**${mentionedCategory.name}** par aapne kul **${formatINR(mentionedCategory.total)}** kharch kiye hain (${mentionedCategory.count} transactions, jo aapke total kharche ka ${mentionedCategory.percentage.toFixed(1)}% hai).`
      : `You have spent a total of **${formatINR(mentionedCategory.total)}** on **${mentionedCategory.name}** across ${mentionedCategory.count} transactions (${mentionedCategory.percentage.toFixed(1)}% of your total spending).`;
  }

  // Top category
  if (/(top|highest|most).*(category|spend|kharch)|where.*(spend|money|paisa)|kahan.*(kharch|paisa)/.test(msg)) {
    const top = ctx.categoriesAllTime[0];
    if (!top) return hindiMode ? 'Koi expense data available nahi hai.' : 'No expense data available.';
    const list = ctx.categoriesAllTime.slice(0, 5).map((c, i) => `${i + 1}. **${c.name}** — ${formatINR(c.total)} (${c.percentage.toFixed(1)}%)`).join('\n');
    return hindiMode
      ? `Aapki top spending categories ye hain:\n${list}\n\nSabse zyada kharcha **${top.name}** par hua hai (${formatINR(top.total)}).`
      : `Here are your top spending categories:\n${list}\n\nYour highest spending is in **${top.name}** (${formatINR(top.total)}).`;
  }

  // Total spent / expenses
  if (/(spend|spent|expense|kharch|kharach)/.test(msg)) {
    return hindiMode
      ? `Aapka kul kharcha **${formatINR(ctx.allTime.expense)}** hai.${latest ? ` Latest active month (${latest.label}) me kharcha ${formatINR(latest.expense)} tha.` : ''}`
      : `Your total spending is **${formatINR(ctx.allTime.expense)}**.${latest ? ` In your latest active month (${latest.label}), you spent ${formatINR(latest.expense)}.` : ''}`;
  }

  // Income
  if (/(income|salary|earn|kamai|kamaya|aay)/.test(msg)) {
    return hindiMode
      ? `Aapki total recorded income **${formatINR(ctx.allTime.income)}** hai.`
      : `Your total recorded income is **${formatINR(ctx.allTime.income)}**.`;
  }

  // Savings / balance
  if (/(saving|balance|bacha|bachat|net|left)/.test(msg)) {
    const bal = ctx.allTime.balance;
    const rate = ctx.allTime.income > 0 ? ((bal / ctx.allTime.income) * 100).toFixed(1) : '0';
    return hindiMode
      ? `Aapka current net balance **${formatINR(bal)}** hai (Income: ${formatINR(ctx.allTime.income)} − Expense: ${formatINR(ctx.allTime.expense)}), lagbhag ${rate}% savings rate ke sath.`
      : `Your current net balance is **${formatINR(bal)}** (Income: ${formatINR(ctx.allTime.income)} − Expense: ${formatINR(ctx.allTime.expense)}), with a savings rate of approximately ${rate}%.`;
  }

  // Default summary snapshot
  const top = ctx.categoriesAllTime[0];
  return hindiMode
    ? `Aapka Financial Summary:\n• **Total Spent:** ${formatINR(ctx.allTime.expense)}\n• **Total Income:** ${formatINR(ctx.allTime.income)}\n• **Net Balance:** ${formatINR(ctx.allTime.balance)}${top ? `\n• **Top Category:** ${top.name} (${formatINR(top.total)})` : ''}\n\nAap kisi bhi specific category, merchant ya savings tips ke baare me pooch sakte hain!`
    : `Your Financial Summary:\n• **Total Spent:** ${formatINR(ctx.allTime.expense)}\n• **Total Income:** ${formatINR(ctx.allTime.income)}\n• **Net Balance:** ${formatINR(ctx.allTime.balance)}${top ? `\n• **Top Category:** ${top.name} (${formatINR(top.total)})` : ''}\n\nFeel free to ask about any specific category, merchant, or personalized savings advice!`;
}

/**
 * Main chat handler:
 * Answers questions using Gemini AI (with real context injected), falling back to Claude or local engine.
 */
async function answer(message, userId, history = []) {
  const ctx = await buildContext(userId);

  // 1. Try Gemini AI
  if (env.GEMINI_API_KEY) {
    const candidateModels = Array.from(new Set([
      env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash'
    ]));

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const systemInstruction = `You are FinanceAI, an intelligent, personal financial coach for an Indian user.
You have access to the user's REAL financial transactions, account balance, income, expenses, and category breakdowns.
Always answer using ₹ with Indian number formatting (e.g., ₹1,25,000 or ₹4,500).

MANDATORY LANGUAGE MATCHING RULE (STRICT):
- You MUST detect the language of the user's latest question and reply in that EXACT language:
  * ENGLISH: If the user asks in English (e.g. "How much did I spend this month?", "What was my highest expense?", "Show my savings", "Where did my money go?"), you MUST respond 100% in pure ENGLISH. Do NOT mix Hindi or Hinglish words when the user writes in English.
  * HINGLISH: If the user asks in Hinglish or Hindi (e.g. "Maine kitna kharcha kiya?", "Sabse bada kharcha kahan hua?", "Bachat kaise badhayein?", "Food me kitna laga?"), you MUST respond in natural, friendly HINGLISH.
  * Always mirror the exact language and tone used by the user. Never reply in Hinglish if the user asks in English, and never reply in pure English if the user asks in Hinglish.

FINANCIAL DATA ACCURACY:
- Use the exact real numbers from the provided financial context JSON.
- Be conversational, sharp, encouraging, and accurate with numbers.
- Keep answers concise, direct, and well-structured with bullet points when listing items.
- Do not invent transactions or figures that do not exist.
- Never give certified legal or tax advice.`;

    // Prepare conversation contents
    const conversationParts = [];
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-4).forEach(h => {
        if (h.content) {
          conversationParts.push(`${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`);
        }
      });
    }

    const prompt = `[CURRENT FINANCIAL CONTEXT (FROM USER'S REAL DATABASE)]:
${JSON.stringify(ctx, null, 2)}

${conversationParts.length > 0 ? `[RECENT CONVERSATION]:\n${conversationParts.join('\n')}\n` : ''}
[USER QUESTION]:
${message}`;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction
        });
        const result = await model.generateContent(prompt);
        const reply = result.response.text().trim();
        return { reply, source: 'gemini', context: ctx, model: modelName };
      } catch (error) {
        console.warn(`Gemini model ${modelName} error:`, error.message);
      }
    }
  }

  // 2. Try Anthropic Claude fallback
  if (env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

      const systemPrompt = `You are FinanceAI, a friendly personal finance assistant for an Indian user. Use ₹ and Indian number formatting.
MANDATORY LANGUAGE RULE:
- If the user writes in English, reply 100% in pure English.
- If the user writes in Hinglish or Hindi, reply in friendly Hinglish.
Always match the exact language used by the user. Answer using the provided financial data. Be concise, specific with numbers.`;
      const messages = [
        ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: `Financial data:\n${JSON.stringify(ctx)}\n\nUser question: ${message}` }
      ];

      const response = await client.messages.create({
        model: env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 700,
        system: systemPrompt,
        messages
      });

      const reply = response.content[0].text.trim();
      return { reply, source: 'claude', context: ctx };
    } catch (error) {
      console.error('Anthropic Chat error:', error.message);
    }
  }

  // 3. Fallback to local rule engine over real context
  return { reply: answerLocally(message, ctx), source: 'local', context: ctx };
}

module.exports = { answer, buildContext, answerLocally };
