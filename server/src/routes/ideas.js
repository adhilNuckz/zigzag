const express = require('express');
const { Op, Sequelize } = require('sequelize');
const Idea = require('../models/Idea');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');

const router = express.Router();

function fmt(i) {
  const j = i.toJSON();
  return {
    _id: j.id,
    ...j,
    author: { anonId: j.authorAnonId, alias: j.authorAlias },
  };
}

/**
 * GET /api/ideas?sort=newest|trending|upvotes&category=&search=&page=1
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 20;
    const offset = (page - 1) * limit;
    const where = { hidden: false };

    if (req.query.category) where.category = req.query.category;

    if (req.query.search) {
      where[Op.or] = [
        Sequelize.literal(`MATCH(title, description) AGAINST(${Idea.sequelize.escape(req.query.search)} IN BOOLEAN MODE)`),
      ];
    }

    let order = [['createdAt', 'DESC']];
    if (req.query.sort === 'upvotes') order = [['upvotes', 'DESC']];
    if (req.query.sort === 'trending') order = [['upvotes', 'DESC'], ['views', 'DESC'], ['createdAt', 'DESC']];

    const { rows, count } = await Idea.findAndCountAll({
      where,
      order,
      limit,
      offset,
    });

    res.json({
      ideas: rows.map(fmt),
      pagination: { page, pages: Math.ceil(count / limit), total: count },
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
    const idea = await Idea.findOne({
      where: { id: req.params.id, hidden: false },
    });

    if (!idea) return res.status(404).json({ error: 'Not found.' });

    idea.views += 1;
    await idea.save();

    res.json(fmt(idea));
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
      authorAnonId: req.user.anonId,
      authorAlias: req.user.alias,
    });

    res.status(201).json(fmt(idea));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ideas/:id/upvote
 */
router.post('/:id/upvote', authenticate, async (req, res, next) => {
  try {
    const idea = await Idea.findByPk(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Not found.' });

    const voted = idea.upvotedBy || [];
    if (voted.includes(req.user.anonId)) {
      idea.upvotedBy = voted.filter(id => id !== req.user.anonId);
      idea.upvotes = Math.max(0, idea.upvotes - 1);
    } else {
      voted.push(req.user.anonId);
      idea.upvotedBy = voted;
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
    const idea = await Idea.findByPk(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Not found.' });

    const saved = idea.savedBy || [];
    if (saved.includes(req.user.anonId)) {
      idea.savedBy = saved.filter(id => id !== req.user.anonId);
    } else {
      saved.push(req.user.anonId);
      idea.savedBy = saved;
    }

    await idea.save();
    res.json({ saved: (idea.savedBy || []).includes(req.user.anonId) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ideas/:id/report
 */
router.post('/:id/report', authenticate, async (req, res, next) => {
  try {
    const idea = await Idea.findByPk(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Not found.' });

    const reported = idea.reportedBy || [];
    if (reported.includes(req.user.anonId)) {
      return res.status(400).json({ error: 'Already reported.' });
    }

    reported.push(req.user.anonId);
    idea.reportedBy = reported;
    idea.reports += 1;
    if (idea.reports >= 5) idea.hidden = true;
    await idea.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
