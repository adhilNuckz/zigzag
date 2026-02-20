const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const User = require('../models/User');

/**
 * Authenticate requests via X-Session-Token header.
 * Creates anonymous user on first visit if no token provided.
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers['x-session-token'];

    if (!token) {
      return res.status(401).json({ error: 'Session token required.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ tokenHash, active: true });

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    // Check token expiry
    const expiry = parseInt(process.env.TOKEN_EXPIRY) || 86400000;
    if (Date.now() - user.lastSeen.getTime() > expiry * 2) {
      user.active = false;
      await user.save();
      return res.status(401).json({ error: 'Session expired.' });
    }

    // Update last seen (without logging IP or user-agent)
    user.lastSeen = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional auth — sets req.user if valid token present, otherwise continues.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers['x-session-token'];
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const user = await User.findOne({ tokenHash, active: true });
      if (user) {
        user.lastSeen = new Date();
        await user.save();
        req.user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
