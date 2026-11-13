const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

// Import route files
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const insightsRoutes = require('./routes/insightsRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const chatRoutes = require('./routes/chatRoutes');
const auth = require('./middleware/auth');

const app = express();

// Security middleware
app.use(helmet());
const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again after 15 minutes' }
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', auth, transactionRoutes);
app.use('/api/categories', auth, categoryRoutes);
app.use('/api/upload', auth, uploadRoutes);
app.use('/api/analytics', auth, analyticsRoutes);
app.use('/api/insights', auth, insightsRoutes);
app.use('/api/budgets', auth, budgetRoutes);
app.use('/api/chat', auth, chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
