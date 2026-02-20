/**
 * Extra security headers beyond what Helmet provides.
 * Enforces onion-only access in production.
 */
const securityHeaders = (req, res, next) => {
  // Remove server identification
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // Modern browsers: CSP is preferred
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  // Onion-only enforcement (opt-in via ONION_ONLY=true)
  if (process.env.ONION_ONLY === 'true') {
    const host = req.headers.host || '';
    if (!host.endsWith('.onion')) {
      return res.status(403).json({ error: 'Access only via .onion address.' });
    }
  }

  next();
};

module.exports = { securityHeaders };
