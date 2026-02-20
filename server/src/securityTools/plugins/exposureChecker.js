const logger = require('../../utils/logger');

/**
 * Exposure Checker Plugin (Basic OSINT)
 * Checks what information might be publicly available for a given query.
 * All checks are passive — no active scanning.
 */
module.exports = {
  name: 'exposure-checker',
  description: 'Check for publicly exposed information (passive OSINT)',
  inputType: 'text',

  async execute(input) {
    try {
      const query = input.text;
      if (!query) return { safe: null, result: { error: 'No input provided' } };

      const findings = [];

      // Check if it looks like an email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(query)) {
        findings.push({
          type: 'email_format',
          detail: 'Input appears to be an email address',
          domain: query.split('@')[1],
        });

        // Check if email domain has MX records (basic validation)
        try {
          const dns = require('dns').promises;
          const mx = await dns.resolveMx(query.split('@')[1]);
          if (mx.length > 0) {
            findings.push({
              type: 'valid_domain',
              detail: `Email domain has ${mx.length} mail server(s)`,
            });
          }
        } catch {
          findings.push({
            type: 'invalid_domain',
            detail: 'Email domain does not have valid mail servers',
          });
        }
      }

      // Check if it looks like a domain/hostname
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
      if (domainRegex.test(query)) {
        try {
          const dns = require('dns').promises;
          const records = await dns.resolve(query);
          findings.push({
            type: 'dns_resolved',
            detail: `Domain resolves to ${records.length} IP(s)`,
          });
        } catch {
          findings.push({
            type: 'dns_not_found',
            detail: 'Domain does not resolve',
          });
        }
      }

      // Check for username patterns
      if (/^[a-zA-Z0-9_.-]{3,30}$/.test(query) && !query.includes('@') && !query.includes('.')) {
        findings.push({
          type: 'username_format',
          detail: 'Input matches common username format. Consider checking social media platforms manually.',
          suggestion: 'Use dedicated OSINT tools for comprehensive username searches.',
        });
      }

      return {
        safe: findings.length === 0 ? true : null,
        result: {
          query: query.substring(0, 3) + '***', // Partial output for privacy
          findings,
          disclaimer: 'This is a passive check. No active scanning was performed.',
          source: 'local',
        },
      };
    } catch (err) {
      logger.error('Exposure checker error:', err);
      return { safe: null, result: { error: 'Check failed' } };
    }
  },
};
