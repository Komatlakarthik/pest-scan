const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * POST /api/feedback
 * Submit user feedback
 */
router.post('/', authenticate, async (req, res) => {
  const { type, message, rating } = req.body;

  if (!type || !message) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Type and message are required'
    });
  }

  const validTypes = ['bug', 'feature', 'improvement', 'other'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid feedback type'
    });
  }

  // Log feedback
  logger.info('User feedback received:', {
    userId: req.user.id,
    userName: req.user.name,
    type,
    message,
    rating,
    timestamp: new Date()
  });

  // TODO: Store feedback in database (create Feedback model)
  // For now, just log it

  res.json({
    success: true,
    message: 'Thank you for your feedback!'
  });
});

module.exports = router;
