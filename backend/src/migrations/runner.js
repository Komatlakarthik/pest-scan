const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

// Import all models to ensure they're registered
require('../models');

/**
 * Database Migration Runner
 * Syncs all Sequelize models with MySQL database
 */
async function runMigrations() {
  try {
    logger.info('Starting database migration...');

    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });

    logger.info('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

/**
 * Undo migrations (drop all tables)
 */
async function undoMigrations() {
  try {
    logger.info('Undoing database migration...');

    await sequelize.drop();

    logger.info('✅ All tables dropped successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to drop tables:', error);
    process.exit(1);
  }
}

// Run migrations or undo based on command line argument
const args = process.argv.slice(2);
if (args.includes('--undo')) {
  undoMigrations();
} else {
  runMigrations();
}
