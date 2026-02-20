const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200,
    index: 'text',
  },
  description: {
    type: String,
    required: true,
    maxlength: 3000,
  },
  category: {
    type: String,
    required: true,
    enum: ['security', 'privacy', 'tools', 'network', 'crypto', 'social', 'other'],
    default: 'other',
  },
  howIBuiltThis: {
    type: String,
    maxlength: 5000,
    default: null,
  },
  author: {
    anonId: { type: String, required: true },
    alias: { type: String, required: true },
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  upvotedBy: [{
    type: String,
  }],
  savedBy: [{
    type: String, // anonIds
  }],
  views: {
    type: Number,
    default: 0,
  },
  reports: {
    type: Number,
    default: 0,
  },
  hidden: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

ideaSchema.index({ createdAt: -1 });
ideaSchema.index({ upvotes: -1 });
ideaSchema.index({ category: 1 });

module.exports = mongoose.model('Idea', ideaSchema);
