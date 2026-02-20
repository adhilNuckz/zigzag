const logger = require('../../utils/logger');

/**
 * Phishing Link Checker Plugin
 * Checks URLs against known phishing databases.
 */
module.exports = {
  name: 'phishing-checker',
  description: 'Check if a URL is a known phishing site',
  inputType: 'url',

  async execute(input) {
    try {
      const url = input.url;
      if (!url) return { safe: null, result: { error: 'No URL provided' } };

      // Heuristic checks
      const suspicious = [];

      // Check for IP-based URLs
      if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
        suspicious.push('IP-based URL detected');
      }

      // Check for excessive subdomains
      try {
        const hostname = new URL(url).hostname;
        if (hostname.split('.').length > 4) {
          suspicious.push('Excessive subdomains');
        }
        // Check for lookalike characters
        if (/[а-яА-ЯёЁ]/.test(hostname)) {
          suspicious.push('Cyrillic characters in domain (homograph attack)');
        }
      } catch {
        suspicious.push('Malformed URL');
      }

      // Check for common phishing keywords
      const phishingKeywords = ['login', 'verify', 'secure', 'account', 'update', 'confirm', 'password'];
      const urlLower = url.toLowerCase();
      const matchedKeywords = phishingKeywords.filter(kw => urlLower.includes(kw));
      if (matchedKeywords.length >= 2) {
        suspicious.push(`Multiple phishing keywords: ${matchedKeywords.join(', ')}`);
      }

      // Google Safe Browsing or PhishTank API (if key available)
      if (process.env.PHISHTANK_API_KEY) {
        try {
          const response = await fetch('https://checkurl.phishtank.com/checkurl/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `format=json&app_key=${process.env.PHISHTANK_API_KEY}&url=${encodeURIComponent(url)}`,
          });
          const data = await response.json();
          if (data.results?.in_database && data.results?.valid) {
            suspicious.push('Listed in PhishTank database');
          }
        } catch (err) {
          logger.error('PhishTank API error:', err.message);
        }
      }

      return {
        safe: suspicious.length === 0,
        result: {
          url,
          suspicious,
          riskLevel: suspicious.length === 0 ? 'low' : suspicious.length <= 2 ? 'medium' : 'high',
          source: process.env.PHISHTANK_API_KEY ? 'phishtank+heuristic' : 'heuristic',
        },
      };
    } catch (err) {
      logger.error('Phishing checker error:', err);
      return { safe: null, result: { error: 'Check failed' } };
    }
  },
};
