require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { testConnection } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const detectRoutes = require('./routes/detect');
const treatmentRoutes = require('./routes/treatment');
const expertRoutes = require('./routes/expert');
const shopRoutes = require('./routes/shop');
const timelineRoutes = require('./routes/timeline');
const weatherRoutes = require('./routes/weather');
const feedbackRoutes = require('./routes/feedback');
const fieldsRoutes = require('./routes/fields');
const userRoutes = require('./routes/user');
const ttsRoutes = require('./routes/tts');

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
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
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
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/detect', detectRoutes);
app.use('/api/treatment', treatmentRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/shop', shopRoutes); // shop routes at /api/shop/*
app.use('/api/timeline', timelineRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/fields', fieldsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tts', ttsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database connection
const initializeApp = async () => {
  try {
    await testConnection();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    logger.warn('⚠️  Backend starting WITHOUT database');
    logger.warn('📖 Fix: See FIX_MYSQL_PASSWORD.md for solutions');
    logger.warn('💡 Quick fix: Update DB_PASSWORD in backend/.env');
    // Don't exit - let backend run for testing
    // process.exit(1);
  }
};

initializeApp();

module.exports = app;
