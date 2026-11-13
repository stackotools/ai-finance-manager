const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  passwordHash: {
    type: String,
    required: true
  },
  monthlyIncome: {
    type: Number,
    default: null,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
