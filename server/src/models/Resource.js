const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200,
    index: 'text',
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  url: {
    type: String,
    default: null,
  },
  fileUrl: {
    type: String,
    default: null,
  },
  fileName: {
    type: String,
    default: null,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  author: {
    anonId: { type: String, required: true },
    alias: { type: String, required: true },
  },
  views: {
    type: Number,
    default: 0,
  },
  reports: {
    type: Number,
    default: 0,
  },
  reportedBy: [{
    type: String, // anonIds
  }],
  hidden: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

resourceSchema.index({ tags: 1 });
resourceSchema.index({ createdAt: -1 });
resourceSchema.index({ views: -1 });

module.exports = mongoose.model('Resource', resourceSchema);
