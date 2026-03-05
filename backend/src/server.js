const app = require('./app');
const logger = require('./utils/logger');
const { startCronJobs } = require('./jobs/weatherCron');

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Smart Pest Doctor API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Frontend URL: ${process.env.FRONTEND_URL}`);
  
  // Start background cron jobs
  if (process.env.WEATHER_CRON_ENABLED === 'true') {
    startCronJobs();
    logger.info('✅ Background cron jobs started');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = server;
