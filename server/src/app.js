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

// Trust reverse proxy (Essential for Render, Heroku, etc. when behind load balancers/Cloudflare)
app.set('trust proxy', 1);

// Security headers with Helmet
app.use(helmet());

// Clean and normalize allowed origins for CORS
const rawClientUrl = (env.CLIENT_URL || '').trim().replace(/\/$/, '');
const allowedOrigins = [rawClientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    if (
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.startsWith('http://localhost:') ||
      cleanOrigin.startsWith('http://127.0.0.1:') ||
      cleanOrigin.endsWith('.onrender.com') ||
      cleanOrigin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- RATE LIMITERS ---
// 1. Global API rate limiter (300 requests per 15 min per IP)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again after 15 minutes.' }
});

// 2. Strict auth rate limiter to prevent brute force (20 attempts per 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// 3. AI & Chat rate limiter to protect Gemini / Claude API quotas (40 requests per 15 min)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI request limit reached. Please wait a few minutes before sending more queries.' }
});

// 4. File upload rate limiter for statement parsing (20 uploads per 15 min)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Upload limit reached. Please wait a few minutes before uploading more statements.' }
});

// Apply global rate limiting to all /api routes
app.use('/api', globalApiLimiter);

// Health check endpoint (for Render / uptime monitoring)
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', auth, transactionRoutes);
app.use('/api/categories', auth, categoryRoutes);
app.use('/api/upload', auth, uploadLimiter, uploadRoutes);
app.use('/api/analytics', auth, analyticsRoutes);
app.use('/api/insights', auth, aiLimiter, insightsRoutes);
app.use('/api/budgets', auth, budgetRoutes);
app.use('/api/chat', auth, aiLimiter, chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
