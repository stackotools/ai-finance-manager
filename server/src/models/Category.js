const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  color: {
    type: String,
    default: '#6B7280'
  },
  icon: {
    type: String,
    default: 'tag'
  },
  keywords: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

categorySchema.statics.getCategoriesForUser = async function(userId) {
  return this.find({
    $or: [
      { user: null, isDefault: true },
      { user: userId }
    ]
  });
};

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
