const express = require('express');
const Resource = require('../models/Resource');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sanitizeBody, isSafeUrl } = require('../middleware/sanitize');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { upload } = require('../utils/upload');
const { processImage, validateFileType } = require('../utils/fileProcessor');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

/**
 * GET /api/resources?sort=newest|trending|views&tag=&search=&page=1
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = { hidden: false };

    if (req.query.tag) {
      filter.tags = req.query.tag.toLowerCase().trim();
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    let sort = { createdAt: -1 };
    if (req.query.sort === 'views') sort = { views: -1 };
    if (req.query.sort === 'trending') sort = { views: -1, createdAt: -1 };

    const [resources, total] = await Promise.all([
      Resource.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Resource.countDocuments(filter),
    ]);

    res.json({
      resources,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
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
    const resource = await Resource.findOneAndUpdate(
      { _id: req.params.id, hidden: false },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!resource) return res.status(404).json({ error: 'Not found.' });
    res.json(resource);
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

    const resourceData = {
      title: title.substring(0, 200),
      description: description.substring(0, 2000),
      url: url || null,
      tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()).slice(0, 10) : [],
      author: {
        anonId: req.user.anonId,
        alias: req.user.alias,
      },
    };

    // Handle file upload
    if (req.file) {
      // Validate actual file type
      const detected = await validateFileType(req.file.path);
      if (!detected) {
        await fs.unlink(req.file.path);
        return res.status(400).json({ error: 'Unrecognized file type.' });
      }

      // Process images (compress + strip metadata)
      if (detected.mime.startsWith('image/')) {
        await processImage(req.file.path);
      }

      resourceData.fileUrl = `/uploads/${req.file.filename}`;
      resourceData.fileName = req.file.originalname;
      resourceData.fileSize = req.file.size;
    }

    const resource = await Resource.create(resourceData);
    res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/resources/:id/report
 */
router.post('/:id/report', authenticate, async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Not found.' });

    if (resource.reportedBy.includes(req.user.anonId)) {
      return res.status(400).json({ error: 'Already reported.' });
    }

    resource.reportedBy.push(req.user.anonId);
    resource.reports += 1;

    // Auto-hide if 5+ reports
    if (resource.reports >= 5) {
      resource.hidden = true;
    }

    await resource.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
