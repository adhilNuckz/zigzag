const express = require('express');
const { Op, Sequelize } = require('sequelize');
const Resource = require('../models/Resource');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sanitizeBody, isSafeUrl } = require('../middleware/sanitize');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { upload } = require('../utils/upload');
const { processImage, validateFileType } = require('../utils/fileProcessor');
const fs = require('fs').promises;

const router = express.Router();

// Format resource to match the shape the frontend expects
function fmt(r) {
  const j = r.toJSON();
  return {
    _id: j.id,
    ...j,
    author: { anonId: j.authorAnonId, alias: j.authorAlias },
  };
}

/**
 * GET /api/resources?sort=newest|trending|views&tag=&search=&page=1
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 20;
    const offset = (page - 1) * limit;

    const where = { hidden: false };

    if (req.query.tag) {
      where.tags = { [Op.like]: `%"${req.query.tag.toLowerCase().trim()}"%` };
    }

    if (req.query.search) {
      where[Op.or] = [
        Sequelize.literal(`MATCH(title, description) AGAINST(${Resource.sequelize.escape(req.query.search)} IN BOOLEAN MODE)`),
      ];
    }

    let order = [['createdAt', 'DESC']];
    if (req.query.sort === 'views') order = [['views', 'DESC']];
    if (req.query.sort === 'trending') order = [['views', 'DESC'], ['createdAt', 'DESC']];

    const { rows, count } = await Resource.findAndCountAll({
      where,
      order,
      limit,
      offset,
    });

    res.json({
      resources: rows.map(fmt),
      pagination: {
        page,
        pages: Math.ceil(count / limit),
        total: count,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/resources/:id
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const resource = await Resource.findOne({
      where: { id: req.params.id, hidden: false },
    });

    if (!resource) return res.status(404).json({ error: 'Not found.' });

    resource.views += 1;
    await resource.save();

    res.json(fmt(resource));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/resources
 */
router.post('/', authenticate, uploadLimiter, sanitizeBody, upload.single('file'), async (req, res, next) => {
  try {
    const { title, description, url, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required.' });
    }

    if (url && !isSafeUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL.' });
    }

    const data = {
      title: title.substring(0, 200),
      description: description.substring(0, 2000),
      url: url || null,
      tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()).slice(0, 10) : [],
      authorAnonId: req.user.anonId,
      authorAlias: req.user.alias,
    };

    if (req.file) {
      const detected = await validateFileType(req.file.path);
      if (!detected) {
        await fs.unlink(req.file.path);
        return res.status(400).json({ error: 'Unrecognized file type.' });
      }

      if (detected.mime.startsWith('image/')) {
        await processImage(req.file.path);
      }

      data.fileUrl = `/uploads/${req.file.filename}`;
      data.fileName = req.file.originalname;
      data.fileSize = req.file.size;
    }

    const resource = await Resource.create(data);
    res.status(201).json(fmt(resource));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/resources/:id/report
 */
router.post('/:id/report', authenticate, async (req, res, next) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Not found.' });

    const reported = resource.reportedBy || [];
    if (reported.includes(req.user.anonId)) {
      return res.status(400).json({ error: 'Already reported.' });
    }

    reported.push(req.user.anonId);
    resource.reportedBy = reported;
    resource.reports += 1;
    if (resource.reports >= 5) resource.hidden = true;

    await resource.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
