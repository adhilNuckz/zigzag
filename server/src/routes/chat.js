const express = require('express');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../utils/upload');
const { processImage } = require('../utils/fileProcessor');

const router = express.Router();

/**
 * POST /api/chat/upload-image
 * Upload an image for chat. Returns the URL to embed in a message.
 */
router.post('/upload-image', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Only allow image types for chat
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images are allowed in chat' });
    }

    // Process / resize the image
    await processImage(req.file.path);

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/chat/messages?room=global&limit=50
 * Get recent messages for a room.
 */
router.get('/messages', authenticate, async (req, res, next) => {
  try {
    const room = req.query.room || 'global';
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const messages = await Message.findAll({
      where: { room },
      order: [['createdAt', 'DESC']],
      limit,
    });

    // Return oldest-first and format to match old Mongo shape
    const formatted = messages.reverse().map(m => ({
      _id: m.id,
      content: m.content,
      type: m.type,
      imageUrl: m.imageUrl,
      sender: { anonId: m.senderAnonId, alias: m.senderAlias },
      room: m.room,
      createdAt: m.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
