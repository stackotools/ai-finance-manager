const mongoose = require('mongoose');

const insightCacheSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // YYYY-MM
  insights: { type: mongoose.Schema.Types.Mixed, required: true },
  generatedAt: { type: Date, default: Date.now }
});

insightCacheSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('InsightCache', insightCacheSchema);
