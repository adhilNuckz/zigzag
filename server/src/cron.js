const cron = require('node-cron');
const Message = require('./models/Message');
const logger = require('./utils/logger');
const fs = require('fs').promises;
const path = require('path');

function startCronJobs() {
  // Clean up expired messages every hour (backup to MongoDB TTL index)
  cron.schedule('0 * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await Message.deleteMany({ createdAt: { $lt: cutoff } });
      if (result.deletedCount > 0) {
        logger.info(`Cron: Deleted ${result.deletedCount} expired messages`);
      }
    } catch (err) {
      logger.error('Cron message cleanup error:', err);
    }
  });

  // Clean up orphaned uploads every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const files = await fs.readdir(uploadDir);
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days

      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const stat = await fs.stat(filePath);
        if (stat.mtimeMs < cutoff) {
          await fs.unlink(filePath);
          logger.info(`Cron: Removed old upload ${file}`);
        }
      }
    } catch (err) {
      logger.error('Cron upload cleanup error:', err);
    }
  });

  logger.info('Cron jobs started');
}

module.exports = { startCronJobs };
