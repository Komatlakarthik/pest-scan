require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: 'Not connected - Check FIX_MYSQL_PASSWORD.md'
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is running!',
    note: 'Database not connected. See FIX_MYSQL_PASSWORD.md'
  });
});

// API routes (will fail without database)
try {
  const authRoutes = require('./routes/auth');
  const detectRoutes = require('./routes/detect');
  const treatmentRoutes = require('./routes/treatment');
  const expertRoutes = require('./routes/expert');
  const shopRoutes = require('./routes/shop');
  const timelineRoutes = require('./routes/timeline');
  const weatherRoutes = require('./routes/weather');
  const feedbackRoutes = require('./routes/feedback');

  app.use('/api/auth', authRoutes);
  app.use('/api/detect', detectRoutes);
  app.use('/api/treatment', treatmentRoutes);
  app.use('/api/expert', expertRoutes);
  app.use('/api', shopRoutes);
  app.use('/api/timeline', timelineRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api/feedback', feedbackRoutes);
} catch (error) {
  logger.warn('Routes failed to load (expected without database):', error.message);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: err.name || 'Error',
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database connection (OPTIONAL - commented out to allow backend to start)
const initializeApp = async () => {
  try {
    const { testConnection } = require('./config/database');
    await testConnection();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    logger.warn('⚠️  Backend will run without database');
    logger.warn('📖 See FIX_MYSQL_PASSWORD.md for solutions');
    // Don't exit - let backend run without database
  }
};

initializeApp();

module.exports = app;
