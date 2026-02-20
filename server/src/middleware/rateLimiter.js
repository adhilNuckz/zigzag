const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  // Do NOT log IP — use anonymous fingerprint via session token
  keyGenerator: (req) => {
    return req.headers['x-session-token'] || 'anonymous';
  },
  message: { error: 'Too many requests. Slow down.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.CHAT_RATE_LIMIT) || 30,
  keyGenerator: (req) => req.headers['x-session-token'] || 'anonymous',
  message: { error: 'Chat rate limit exceeded.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.headers['x-session-token'] || 'anonymous',
  message: { error: 'Too many auth attempts.' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.headers['x-session-token'] || 'anonymous',
  message: { error: 'Upload limit reached. Try again later.' },
});

module.exports = { globalLimiter, chatLimiter, authLimiter, uploadLimiter };
