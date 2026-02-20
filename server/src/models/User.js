const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  anonId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  alias: {
    type: String,
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // Optional encrypted passphrase for session recovery (client-side encrypted)
  recoveryPhrase: {
    type: String,
    default: null,
  },
  active: {
    type: Boolean,
    default: true,
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'bookmarkModel',
  }],
  bookmarkModel: {
    type: String,
    enum: ['Idea', 'Resource', 'BlogPost'],
    default: 'Idea',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  // Never store IP or user-agent
});

// Auto-cleanup inactive users after 30 days
userSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('User', userSchema);
