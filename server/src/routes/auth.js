const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { generateAlias } = require('../utils/aliasGenerator');
const { authLimiter } = require('../middleware/rateLimiter');
const { sanitizeBody } = require('../middleware/sanitize');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Create anonymous identity. No email, no password.
 * Returns: { anonId, alias, token }
 */
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const anonId = uuidv4();
    const alias = generateAlias();
    const token = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.create({
      anonId,
      alias,
      tokenHash,
    });

    res.status(201).json({
      anonId: user.anonId,
      alias: user.alias,
      token, // Only returned once — client must store it
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current session info.
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({
    anonId: req.user.anonId,
    alias: req.user.alias,
  });
});

/**
 * POST /api/auth/rotate
 * Rotate session token. Returns new token, invalidates old.
 */
router.post('/rotate', authenticate, async (req, res, next) => {
  try {
    const newToken = crypto.randomBytes(48).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newToken).digest('hex');

    req.user.tokenHash = newTokenHash;
    await req.user.save();

    res.json({ token: newToken });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/recover
 * Set or use recovery passphrase (client-side encrypted blob).
 */
router.post('/recover', sanitizeBody, async (req, res, next) => {
  try {
    const { recoveryPhrase, anonId } = req.body;

    if (!recoveryPhrase || !anonId) {
      return res.status(400).json({ error: 'Recovery phrase and anonId required.' });
    }

    // Attempt recovery
    const user = await User.findOne({ anonId, recoveryPhrase, active: true });
    if (!user) {
      return res.status(404).json({ error: 'No matching recovery found.' });
    }

    // Issue new token
    const newToken = crypto.randomBytes(48).toString('hex');
    user.tokenHash = crypto.createHash('sha256').update(newToken).digest('hex');
    await user.save();

    res.json({
      anonId: user.anonId,
      alias: user.alias,
      token: newToken,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/set-recovery
 * Store encrypted passphrase for future recovery.
 */
router.post('/set-recovery', authenticate, sanitizeBody, async (req, res, next) => {
  try {
    const { recoveryPhrase } = req.body;
    if (!recoveryPhrase || recoveryPhrase.length > 500) {
      return res.status(400).json({ error: 'Invalid recovery phrase.' });
    }

    req.user.recoveryPhrase = recoveryPhrase;
    await req.user.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Invalidate session.
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    req.user.active = false;
    await req.user.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
