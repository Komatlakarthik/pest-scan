const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests, please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  skipSuccessfulRequests: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Rate limiter for AI detection endpoint
 */
const detectionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 detections per hour per user
  skipSuccessfulRequests: false,
  message: {
    error: 'Too Many Requests',
    message: 'Detection limit reached. Please try again in an hour.'
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.userId ? `user_${req.userId}` : req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Detection rate limit exceeded for user: ${req.userId || req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have reached the hourly detection limit. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Rate limiter for expert chat
 */
const chatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 100, // 100 messages per day
  skipSuccessfulRequests: false,
  keyGenerator: (req) => `user_${req.userId}`,
  message: {
    error: 'Too Many Requests',
    message: 'Daily message limit reached.'
  },
  handler: (req, res) => {
    logger.warn(`Chat rate limit exceeded for user: ${req.userId}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have reached the daily message limit.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Rate limiter for shop checkout
 */
const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 checkouts per hour
  skipSuccessfulRequests: false,
  keyGenerator: (req) => `user_${req.userId}`,
  message: {
    error: 'Too Many Requests',
    message: 'Too many checkout attempts. Please try again later.'
  },
  handler: (req, res) => {
    logger.warn(`Checkout rate limit exceeded for user: ${req.userId}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many checkout attempts. Please wait before trying again.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  detectionLimiter,
  chatLimiter,
  checkoutLimiter
};
