const sanitizeHtml = require('sanitize-html');
const validator = require('validator');

/**
 * Sanitize all string fields in req.body recursively.
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  next();
};

function deepSanitize(obj) {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'recursiveEscape',
    }).trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(obj)) {
      clean[key] = deepSanitize(val);
    }
    return clean;
  }
  return obj;
}

/**
 * Validate that a string is a safe URL (no javascript:, data:, etc).
 */
const isSafeUrl = (url) => {
  if (!url) return false;
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_underscores: true,
  });
};

module.exports = { sanitizeBody, deepSanitize, isSafeUrl };
