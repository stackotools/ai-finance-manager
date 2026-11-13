const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const asyncHandler = require('../middleware/asyncHandler');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
  }
  
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and contain a letter and a number' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    passwordHash
  });

  const token = generateToken(user._id);
  user.passwordHash = undefined;

  res.status(201).json({ success: true, data: { user, token } });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = generateToken(user._id);
  user.passwordHash = undefined;

  res.status(200).json({ success: true, data: { user, token } });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, monthlyIncome } = req.body;
  const user = await User.findById(req.user._id);
  
  if (name) user.name = name;
  if (monthlyIncome !== undefined) user.monthlyIncome = monthlyIncome;
  
  await user.save();
  user.passwordHash = undefined;

  res.status(200).json({ success: true, data: user });
});

exports.logout = asyncHandler(async (req, res) => {
  // For JWT + localStorage auth, logout is client-side.
  // This endpoint exists for completeness and future cookie-based auth.
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});
