const express = require('express');
const { Op, Sequelize } = require('sequelize');
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');
const { chatLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

function fmt(p, includeComments = false) {
  const j = p.toJSON();
  const out = {
    _id: j.id,
    ...j,
    author: { anonId: j.authorAnonId, alias: j.authorAlias },
  };
  if (!includeComments) delete out.comments;
  if (j.comments) {
    out.comments = j.comments.map(c => ({
      _id: c.id,
      content: c.content,
      author: { anonId: c.authorAnonId, alias: c.authorAlias },
      createdAt: c.createdAt,
    }));
  }
  return out;
}

/**
 * GET /api/blog?sort=newest|trending|upvotes&tag=&search=&page=1
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 15;
    const offset = (page - 1) * limit;
    const where = { hidden: false };

    if (req.query.tag) {
      where.tags = { [Op.like]: `%"${req.query.tag.toLowerCase().trim()}"%` };
    }

    if (req.query.search) {
      where[Op.or] = [
        Sequelize.literal(`MATCH(title, content) AGAINST(${BlogPost.sequelize.escape(req.query.search)} IN BOOLEAN MODE)`),
      ];
    }

    let order = [['createdAt', 'DESC']];
    if (req.query.sort === 'upvotes') order = [['upvotes', 'DESC']];
    if (req.query.sort === 'trending') order = [['upvotes', 'DESC'], ['views', 'DESC'], ['createdAt', 'DESC']];

    const { rows, count } = await BlogPost.findAndCountAll({
      where,
      order,
      limit,
      offset,
      attributes: { exclude: ['content'] }, // Don't load full content in list
    });

    res.json({
      posts: rows.map(p => fmt(p)),
      pagination: { page, pages: Math.ceil(count / limit), total: count },
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
    const post = await BlogPost.findOne({
      where: { id: req.params.id, hidden: false },
      include: [{ model: Comment, as: 'comments', order: [['createdAt', 'ASC']] }],
    });

    if (!post) return res.status(404).json({ error: 'Not found.' });

    post.views += 1;
    await post.save();

    res.json(fmt(post, true));
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
      authorAnonId: req.user.anonId,
      authorAlias: req.user.alias,
    });

    res.status(201).json(fmt(post));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/blog/:id/upvote
 */
router.post('/:id/upvote', authenticate, async (req, res, next) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found.' });

    const voted = post.upvotedBy || [];
    if (voted.includes(req.user.anonId)) {
      post.upvotedBy = voted.filter(id => id !== req.user.anonId);
      post.upvotes = Math.max(0, post.upvotes - 1);
    } else {
      voted.push(req.user.anonId);
      post.upvotedBy = voted;
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

    const post = await BlogPost.findByPk(req.params.id);
    if (!post || post.hidden) return res.status(404).json({ error: 'Not found.' });

    const comment = await Comment.create({
      content: content.substring(0, 1000),
      authorAnonId: req.user.anonId,
      authorAlias: req.user.alias,
      blogPostId: post.id,
    });

    res.status(201).json({
      _id: comment.id,
      content: comment.content,
      author: { anonId: comment.authorAnonId, alias: comment.authorAlias },
      createdAt: comment.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/blog/:id/report
 */
router.post('/:id/report', authenticate, async (req, res, next) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found.' });

    const reported = post.reportedBy || [];
    if (reported.includes(req.user.anonId)) {
      return res.status(400).json({ error: 'Already reported.' });
    }

    reported.push(req.user.anonId);
    post.reportedBy = reported;
    post.reports += 1;
    if (post.reports >= 5) post.hidden = true;
    await post.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
