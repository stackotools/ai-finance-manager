const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  note: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  categorySource: {
    type: String,
    enum: ['rule', 'ai', 'manual', 'uncategorized'],
    default: 'manual'
  },
  source: {
    type: String,
    enum: ['manual', 'upload'],
    default: 'manual'
  }
}, { timestamps: true });

transactionSchema.index({ user: 1, date: 1 });

transactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
