require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');
const { connectDB } = require('./config/db');
const { startCronJobs } = require('./cron');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

initSocket(server);

connectDB().then(() => {
  startCronJobs();
  const HOST = process.env.HOST || '0.0.0.0';
  server.listen(PORT, HOST, () => {
    logger.info(`ZigZag server listening on ${HOST}:${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to connect to database', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});
