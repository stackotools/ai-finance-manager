const env = require('../config/env');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generate AI insights from spending data.
 * Prioritizes Gemini API (using GEMINI_API_KEY), falls back to Claude (if ANTHROPIC_API_KEY),
 * and finally falls back to a smart deterministic rule-based engine over the user's real transactions.
 */
async function generateInsights(data) {
  // data: { monthlyTotals: {income, expense}, categorySplit: [{name, total, percentage}], 
  //         previousMonths: [{month, income, expense}], topTransactions: [{note, amount}] }

  // 1. Try Gemini API
  if (env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: env.GEMINI_MODEL || 'gemini-3.5-flash',
        generationConfig: {
          responseMimeType: 'application/json'
        },
        systemInstruction: `You are an expert personal finance coach for an Indian user.
Analyze the user's monthly spending data and generate 4 to 6 sharp, highly personalized insights and 3 to 4 actionable, practical tips.
Rules:
- Always use ₹ with Indian number formatting (e.g., ₹25,400 or ₹1.5 Lakh).
- Be specific with exact numbers from the data.
- Mention specific categories and trends.
- Keep insights concise, positive yet realistic, and practical.
- Do NOT give legal or tax advice.
- Respond ONLY with valid JSON with this exact structure:
{
  "insights": [
    { "title": "string", "detail": "string", "type": "positive" | "warning" | "info" }
  ],
  "tips": [
    "string"
  ]
}`
      });

      const prompt = `Analyze this user's monthly financial spending data:\n${JSON.stringify(data, null, 2)}`;
      const result = await model.generateContent(prompt);
      let text = result.response.text();

      // Clean markdown fences if any
      text = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(text);

      if (parsed && Array.isArray(parsed.insights) && parsed.insights.length > 0) {
        return parsed;
      }
    } catch (error) {
      console.error('Gemini AI Service error in generateInsights:', error.message);
      // Fall through to other providers or rule-based
    }
  }

  // 2. Fallback to Anthropic Claude if configured
  if (env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      
      const systemPrompt = `You are a friendly personal finance assistant for an Indian user. Use ₹. Be specific with numbers, concise, non-judgmental, and practical. Do not give investment/tax advice. Respond ONLY in valid JSON with the shape: { "insights": [ {"title": string, "detail": string, "type": "positive"|"warning"|"info"} ], "tips": [string] }`;
      const userPrompt = `Analyze this monthly spending data and provide 4-6 insights:\n${JSON.stringify(data, null, 2)}`;
      
      const response = await client.messages.create({
        model: env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      let text = response.content[0].text;
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      console.error('Anthropic AI Service error:', error.message);
    }
  }

  // 3. Fallback to smart rule-based engine using the user's real transactions
  return generateRuleBasedInsights(data);
}

function generateRuleBasedInsights(data) {
  const { monthlyTotals, categorySplit, previousMonths } = data;
  const insights = [];
  const tips = [];
  
  // Insight 1: Overall spending & savings rate
  if (monthlyTotals.expense > 0 || monthlyTotals.income > 0) {
    const savingsRate = monthlyTotals.income > 0 
      ? ((monthlyTotals.income - monthlyTotals.expense) / monthlyTotals.income * 100).toFixed(1)
      : 0;
    const isPositive = parseFloat(savingsRate) >= 20;

    insights.push({
      title: 'Monthly Cash Flow',
      detail: `Total spending was ₹${monthlyTotals.expense.toLocaleString('en-IN')}${monthlyTotals.income > 0 ? ` against an income of ₹${monthlyTotals.income.toLocaleString('en-IN')} (savings rate: ${savingsRate}%)` : ''}.`,
      type: isPositive ? 'positive' : (monthlyTotals.expense > monthlyTotals.income && monthlyTotals.income > 0 ? 'warning' : 'info')
    });

    if (parseFloat(savingsRate) < 15 && monthlyTotals.income > 0) {
      tips.push(`Your savings rate is ${savingsRate}%. Try targeting at least 20% by cutting discretionary expenses.`);
    } else if (parseFloat(savingsRate) >= 30) {
      tips.push(`Great savings discipline! Consider putting your surplus ₹${(monthlyTotals.income - monthlyTotals.expense).toLocaleString('en-IN')} into recurring investments (SIPs).`);
    }
  }
  
  // Insight 2: Top spending category
  if (categorySplit && categorySplit.length > 0) {
    const top = categorySplit[0];
    insights.push({
      title: `Highest Spending: ${top.name}`,
      detail: `${top.name} accounted for ₹${top.total.toLocaleString('en-IN')} (${top.percentage.toFixed(1)}% of your total expenses this month).`,
      type: top.percentage > 40 ? 'warning' : 'info'
    });

    if (top.percentage > 35) {
      tips.push(`${top.name} takes up ${top.percentage.toFixed(1)}% of your expenses. Setting a budget cap on ${top.name} can free up substantial cash.`);
    }
  }
  
  // Insight 3: Top 3 concentration
  if (categorySplit && categorySplit.length >= 3) {
    const top3 = categorySplit.slice(0, 3);
    const top3Pct = top3.reduce((sum, c) => sum + c.percentage, 0);
    insights.push({
      title: 'Top Category Concentration',
      detail: `Your top 3 categories (${top3.map(c => c.name).join(', ')}) make up ${top3Pct.toFixed(1)}% of all expenses.`,
      type: top3Pct > 75 ? 'warning' : 'info'
    });
  }
  
  // Insight 4: Month-over-month comparison
  if (previousMonths && previousMonths.length >= 2) {
    const current = previousMonths[0];
    const previous = previousMonths[1];
    if (previous.expense > 0) {
      const diff = current.expense - previous.expense;
      const change = ((diff) / previous.expense * 100).toFixed(1);
      insights.push({
        title: 'Month-over-Month Trend',
        detail: diff > 0 
          ? `Spending increased by ₹${diff.toLocaleString('en-IN')} (${change}%) compared to last month.`
          : `Spending decreased by ₹${Math.abs(diff).toLocaleString('en-IN')} (${Math.abs(change)}%) compared to last month. Well done!`,
        type: diff > 0 ? (change > 15 ? 'warning' : 'info') : 'positive'
      });
    }
  }
  
  // Default tips if fewer than 3
  if (tips.length < 3) {
    tips.push('Review recurring subscriptions and utility bills to identify unused services.');
    tips.push('Track expenses daily or weekly to avoid end-of-month budget surprises.');
    tips.push('Follow the 50/30/20 guideline: 50% Needs, 30% Wants, 20% Savings.');
  }
  
  return { insights, tips: tips.slice(0, 4) };
}

module.exports = { generateInsights };
