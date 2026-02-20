const crypto = require('crypto');
const logger = require('../../utils/logger');

/**
 * Virus Scanner Plugin
 * Uses VirusTotal API v3 if API key is set.
 * Falls back to hash-based local check.
 */
module.exports = {
  name: 'virus-scanner',
  description: 'Scan files for malware using hash analysis',
  inputType: 'file', // 'file' | 'url' | 'text'

  async execute(input) {
    try {
      const fs = require('fs').promises;
      const fileBuffer = await fs.readFile(input.filePath);
      const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // If VirusTotal API key is available, query their API
      if (process.env.VIRUSTOTAL_API_KEY) {
        const response = await fetch(`https://www.virustotal.com/api/v3/files/${sha256}`, {
          headers: {
            'x-apikey': process.env.VIRUSTOTAL_API_KEY,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const stats = data.data?.attributes?.last_analysis_stats || {};
          const malicious = stats.malicious || 0;
          const total = Object.values(stats).reduce((a, b) => a + b, 0);

          return {
            safe: malicious === 0,
            result: {
              hash: sha256,
              malicious,
              total,
              engines: stats,
              source: 'virustotal',
            },
          };
        }
      }

      // Fallback: return hash for manual verification
      return {
        safe: null, // Unknown
        result: {
          hash: sha256,
          message: 'No VirusTotal API key configured. Hash provided for manual verification.',
          source: 'local',
        },
      };
    } catch (err) {
      logger.error('Virus scanner error:', err);
      return { safe: null, result: { error: 'Scan failed' } };
    }
  },
};
