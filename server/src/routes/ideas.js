const express = require('express');
const Idea = require('../models/Idea');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');

const router = express.Router();

/**
 * GET /api/ideas?sort=newest|trending|upvotes&category=&search=&page=1
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const filter = { hidden: false };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.$text = { $search: req.query.search };

    let sort = { createdAt: -1 };
    if (req.query.sort === 'upvotes') sort = { upvotes: -1 };
    if (req.query.sort === 'trending') sort = { upvotes: -1, views: -1, createdAt: -1 };

    const [ideas, total] = await Promise.all([
      Idea.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Idea.countDocuments(filter),
    ]);

    res.json({
      ideas,
      pagination: { page, pages: Math.ceil(total / limit), total },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ideas/:id
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const idea = await Idea.findOneAndUpdate(
      { _id: req.params.id, hidden: false },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!idea) return res.status(404).json({ error: 'Not found.' });
    res.json(idea);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ideas
 */
router.post('/', authenticate, sanitizeBody, async (req, res, next) => {
  try {
    const { title, description, category, howIBuiltThis } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required.' });
    }

    const idea = await Idea.create({
      title: title.substring(0, 200),
      description: description.substring(0, 3000),
      category: category || 'other',
      howIBuiltThis: howIBuiltThis ? howIBuiltThis.substring(0, 5000) : null,
      author: {
        anonId: req.user.anonId,
        alias: req.user.alias,
      },
    });

    res.status(201).json(idea);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ideas/:id/upvote
 */
router.post('/:id/upvote', authenticate, async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Not found.' });

    if (idea.upvotedBy.includes(req.user.anonId)) {
      idea.upvotedBy = idea.upvotedBy.filter(id => id !== req.user.anonId);
      idea.upvotes = Math.max(0, idea.upvotes - 1);
    } else {
      idea.upvotedBy.push(req.user.anonId);
      idea.upvotes += 1;
    }

    await idea.save();
    res.json({ upvotes: idea.upvotes });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ideas/:id/save
 */
router.post('/:id/save', authenticate, async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Not found.' });

    if (idea.savedBy.includes(req.user.anonId)) {
      idea.savedBy = idea.savedBy.filter(id => id !== req.user.anonId);
    } else {
      idea.savedBy.push(req.user.anonId);
    }

    await idea.save();
    res.json({ saved: idea.savedBy.includes(req.user.anonId) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ideas/:id/report
 */
router.post('/:id/report', authenticate, async (req, res, next) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Not found.' });

    if (!idea.reportedBy) idea.reportedBy = [];
    if (idea.reportedBy.includes(req.user.anonId)) {
      return res.status(400).json({ error: 'Already reported.' });
    }

    idea.reportedBy.push(req.user.anonId);
    idea.reports += 1;
    if (idea.reports >= 5) idea.hidden = true;
    await idea.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
