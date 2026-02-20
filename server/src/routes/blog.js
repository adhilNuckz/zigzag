const express = require('express');
const BlogPost = require('../models/BlogPost');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');
const { chatLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * GET /api/blog?sort=newest|trending|upvotes&tag=&search=&page=1
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 15;
    const skip = (page - 1) * limit;
    const filter = { hidden: false };

    if (req.query.tag) filter.tags = req.query.tag.toLowerCase().trim();
    if (req.query.search) filter.$text = { $search: req.query.search };

    let sort = { createdAt: -1 };
    if (req.query.sort === 'upvotes') sort = { upvotes: -1 };
    if (req.query.sort === 'trending') sort = { upvotes: -1, views: -1, createdAt: -1 };

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .select('-comments') // Don't load comments in list
        .sort(sort).skip(skip).limit(limit).lean(),
      BlogPost.countDocuments(filter),
    ]);

    res.json({
      posts,
      pagination: { page, pages: Math.ceil(total / limit), total },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/blog/:id
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await BlogPost.findOneAndUpdate(
      { _id: req.params.id, hidden: false },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!post) return res.status(404).json({ error: 'Not found.' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/blog
 */
router.post('/', authenticate, sanitizeBody, async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required.' });
    }

    const post = await BlogPost.create({
      title: title.substring(0, 300),
      content: content.substring(0, 50000),
      excerpt: content.substring(0, 500).replace(/[#*_`]/g, ''),
      tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()).slice(0, 10) : [],
      author: {
        anonId: req.user.anonId,
        alias: req.user.alias,
      },
    });

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/blog/:id/upvote
 */
router.post('/:id/upvote', authenticate, async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found.' });

    if (post.upvotedBy.includes(req.user.anonId)) {
      // Remove upvote (toggle)
      post.upvotedBy = post.upvotedBy.filter(id => id !== req.user.anonId);
      post.upvotes = Math.max(0, post.upvotes - 1);
    } else {
      post.upvotedBy.push(req.user.anonId);
      post.upvotes += 1;
    }

    await post.save();
    res.json({ upvotes: post.upvotes });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/blog/:id/comments
 */
router.post('/:id/comments', authenticate, chatLimiter, sanitizeBody, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required.' });

    const post = await BlogPost.findById(req.params.id);
    if (!post || post.hidden) return res.status(404).json({ error: 'Not found.' });

    post.comments.push({
      content: content.substring(0, 1000),
      author: {
        anonId: req.user.anonId,
        alias: req.user.alias,
      },
    });

    await post.save();
    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/blog/:id/report
 */
router.post('/:id/report', authenticate, async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found.' });

    if (!post.reportedBy) post.reportedBy = [];
    if (post.reportedBy.includes(req.user.anonId)) {
      return res.status(400).json({ error: 'Already reported.' });
    }

    post.reportedBy.push(req.user.anonId);
    post.reports += 1;
    if (post.reports >= 5) post.hidden = true;
    await post.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
