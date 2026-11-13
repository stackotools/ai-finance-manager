const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_manager',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

if (env.NODE_ENV === 'production') {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  for (const key of required) {
    if (!env[key]) {
      console.error(`FATAL ERROR: Environment variable ${key} is required in production.`);
      process.exit(1);
    }
  }
}

module.exports = env;
