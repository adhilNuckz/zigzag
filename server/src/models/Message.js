const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  type: {
    type: String,
    enum: ['text', 'image'],
    default: 'text',
  },
  imageUrl: {
    type: String,
    default: null,
  },
  sender: {
    anonId: { type: String, required: true },
    alias: { type: String, required: true },
  },
  room: {
    type: String,
    default: 'global',
    index: true,
  },
}, {
  timestamps: true,
});

// TTL index — auto-delete messages after 24 hours
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

module.exports = mongoose.model('Message', messageSchema);
