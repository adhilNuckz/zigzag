const express = require('express');
const { listTools, getTool } = require('../securityTools');
const { authenticate } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');
const { chatLimiter } = require('../middleware/rateLimiter');
const { upload } = require('../utils/upload');
const path = require('path');

const router = express.Router();

/**
 * GET /api/security-tools
 * List available security tools.
 */
router.get('/', (req, res) => {
  res.json({ tools: listTools() });
});

/**
 * POST /api/security-tools/:name/execute
 * Execute a security tool.
 */
router.post('/:name/execute', authenticate, chatLimiter, sanitizeBody, upload.single('file'), async (req, res, next) => {
  try {
    const tool = getTool(req.params.name);
    if (!tool) {
      return res.status(404).json({ error: 'Tool not found.' });
    }

    let input = {};

    switch (tool.inputType) {
      case 'file':
        if (!req.file) {
          return res.status(400).json({ error: 'File required for this tool.' });
        }
        input = { filePath: req.file.path };
        break;
      case 'url':
        if (!req.body.url) {
          return res.status(400).json({ error: 'URL required for this tool.' });
        }
        input = { url: req.body.url };
        break;
      case 'text':
        if (!req.body.text) {
          return res.status(400).json({ error: 'Text input required for this tool.' });
        }
        input = { text: req.body.text };
        break;
      default:
        return res.status(400).json({ error: 'Unknown input type.' });
    }

    const result = await tool.execute(input);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
