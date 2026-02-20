const crypto = require('crypto');
const logger = require('../../utils/logger');

/**
 * Data Leak Checker Plugin
 * Checks if an email/username appears in known data breaches.
 * Uses Have I Been Pwned API (k-anonymity model).
 */
module.exports = {
  name: 'leak-checker',
  description: 'Check if credentials appear in known data breaches',
  inputType: 'text',

  async execute(input) {
    try {
      const query = input.text;
      if (!query) return { safe: null, result: { error: 'No input provided' } };

      // k-anonymity: hash the input, send only first 5 chars
      const sha1 = crypto.createHash('sha1').update(query).digest('hex').toUpperCase();
      const prefix = sha1.substring(0, 5);
      const suffix = sha1.substring(5);

      if (process.env.HIBP_API_KEY) {
        try {
          const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            headers: {
              'hibp-api-key': process.env.HIBP_API_KEY,
              'User-Agent': 'ZigZag-SecurityTools',
            },
          });

          if (response.ok) {
            const text = await response.text();
            const lines = text.split('\n');
            const match = lines.find(line => line.startsWith(suffix));

            if (match) {
              const count = parseInt(match.split(':')[1]);
              return {
                safe: false,
                result: {
                  found: true,
                  occurrences: count,
                  message: `Found in ${count} data breach(es).`,
                  source: 'haveibeenpwned',
                },
              };
            }

            return {
              safe: true,
              result: {
                found: false,
                message: 'Not found in known data breaches.',
                source: 'haveibeenpwned',
              },
            };
          }
        } catch (err) {
          logger.error('HIBP API error:', err.message);
        }
      }

      return {
        safe: null,
        result: {
          message: 'No HIBP API key configured. Cannot check breaches.',
          hashPrefix: prefix,
          source: 'local',
        },
      };
    } catch (err) {
      logger.error('Leak checker error:', err);
      return { safe: null, result: { error: 'Check failed' } };
    }
  },
};
