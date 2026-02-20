const express = require('express');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * GET /api/chat/messages?room=global&limit=50
 * Get recent messages for a room.
 */
router.get('/messages', authenticate, async (req, res, next) => {
  try {
    const room = req.query.room || 'global';
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const messages = await Message.find({ room })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(messages.reverse());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
