const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  author: {
    anonId: { type: String, required: true },
    alias: { type: String, required: true },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 300,
    index: 'text',
  },
  content: {
    type: String,
    required: true,
    maxlength: 50000, // ~50KB markdown
  },
  excerpt: {
    type: String,
    maxlength: 500,
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
    type: String, // anonIds
  }],
  comments: [commentSchema],
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
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

blogPostSchema.index({ createdAt: -1 });
blogPostSchema.index({ upvotes: -1 });
blogPostSchema.index({ tags: 1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
