const cron = require('node-cron');
const { Op } = require('sequelize');
const Message = require('./models/Message');
const User = require('./models/User');
const logger = require('./utils/logger');
const fs = require('fs').promises;
const path = require('path');

function startCronJobs() {
  // Clean up expired messages every hour (messages older than 24h)
  cron.schedule('0 * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const count = await Message.destroy({
        where: { createdAt: { [Op.lt]: cutoff } },
      });
      if (count > 0) {
        logger.info(`Cron: Deleted ${count} expired messages`);
      }
    } catch (err) {
      logger.error('Cron message cleanup error:', err);
    }
  });

  // Clean up inactive users every day (users not seen in 30 days)
  cron.schedule('0 3 * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const count = await User.destroy({
        where: { lastSeen: { [Op.lt]: cutoff } },
      });
      if (count > 0) {
        logger.info(`Cron: Deleted ${count} inactive users`);
      }
    } catch (err) {
      logger.error('Cron user cleanup error:', err);
    }
  });

  // Clean up orphaned uploads every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const files = await fs.readdir(uploadDir);
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

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
