const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}$/.test(v);
      },
      message: props => `${props.value} is not a valid month format (YYYY-MM)!`
    }
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  limit: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

budgetSchema.index({ user: 1, month: 1, category: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
module.exports = Budget;
