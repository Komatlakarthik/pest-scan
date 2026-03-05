const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const { ExpertCase, Report, User, Message } = require('../models');
const { uploadImage } = require('../config/cloudinary');
const multer = require('multer');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * POST /api/expert/send
 * Create a new expert consultation case
 */
router.post('/send', authenticate, async (req, res) => {
  const { reportId, message, priority = 'medium' } = req.body;

  if (!reportId || !message) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'reportId and message are required'
    });
  }

  // Verify report exists and belongs to user
  const report = await Report.findOne({
    where: { id: reportId, userId: req.user.id }
  });

  if (!report) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Report not found'
    });
  }

  // Check if case already exists for this report
  let expertCase = await ExpertCase.findOne({ where: { reportId } });

  if (!expertCase) {
    expertCase = await ExpertCase.create({
      reportId,
      userId: req.user.id,
      priority,
      description: message,
      status: 'open'
    });
  }

  // Create initial message
  await Message.create({
    expertCaseId: expertCase.id,
    senderId: req.user.id,
    messageType: 'text',
    messageText: message
  });

  res.json({
    caseId: expertCase.id,
    status: expertCase.status,
    priority: expertCase.priority,
    createdAt: expertCase.createdAt
  });
});

/**
 * GET /api/expert/cases
 * Get expert cases (for experts and admins only)
 */
router.get('/cases', authenticate, async (req, res) => {
  // Check if user is expert or admin
  if (req.user.role !== 'expert' && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only experts and admins can access cases'
    });
  }

  const { status = 'all', limit = 20, offset = 0 } = req.query;

  const whereClause = {};
  if (status !== 'all') {
    whereClause.status = status;
  }

  // If expert, show only assigned cases
  if (req.user.role === 'expert') {
    whereClause.assignedExpertId = req.user.id;
  }

  const cases = await ExpertCase.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Report,
        as: 'report',
        attributes: ['id', 'diseaseName', 'confidence', 'imageUrl', 'severity']
      },
      {
        model: User,
        as: 'farmer',
        attributes: ['id', 'name', 'phone']
      }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    cases: cases.rows,
    total: cases.count
  });
});

/**
 * POST /api/expert/cases/:id/reply
 * Reply to an expert case
 */
router.post('/cases/:id/reply', authenticate, chatLimiter, upload.single('media'), async (req, res) => {
  const { id } = req.params;
  const { messageText } = req.body;

  const expertCase = await ExpertCase.findByPk(id);

  if (!expertCase) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Case not found'
    });
  }

  // Check permissions
  if (req.user.role === 'farmer' && expertCase.userId !== req.user.id) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only reply to your own cases'
    });
  }

  let mediaUrl = null;
  let messageType = 'text';

  // Upload media if present
  if (req.file) {
    const cloudinaryResult = await uploadImage(req.file.buffer);
    mediaUrl = cloudinaryResult.url;
    
    // Determine message type based on file mimetype
    if (req.file.mimetype.startsWith('image/')) {
      messageType = 'image';
    } else if (req.file.mimetype.startsWith('audio/')) {
      messageType = 'voice';
    } else if (req.file.mimetype.startsWith('video/')) {
      messageType = 'video';
    }
  }

  const message = await Message.create({
    expertCaseId: id,
    senderId: req.user.id,
    messageType,
    messageText: messageText || null,
    mediaUrl
  });

  // Update case status if it's the first expert reply
  if (req.user.role === 'expert' && expertCase.status === 'open') {
    await expertCase.update({
      status: 'in_progress',
      assignedExpertId: req.user.id,
      assignedAt: new Date()
    });
  }

  res.json({
    message: {
      id: message.id,
      messageType: message.messageType,
      messageText: message.messageText,
      mediaUrl: message.mediaUrl,
      createdAt: message.createdAt
    }
  });
});

/**
 * GET /api/expert/cases/:id/messages
 * Get all messages for a case
 */
router.get('/cases/:id/messages', authenticate, async (req, res) => {
  const { id } = req.params;

  const expertCase = await ExpertCase.findByPk(id);

  if (!expertCase) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Case not found'
    });
  }

  // Check permissions
  if (req.user.role === 'farmer' && expertCase.userId !== req.user.id) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only view your own cases'
    });
  }

  const messages = await Message.findAll({
    where: { expertCaseId: id },
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'name', 'role']
      }
    ],
    order: [['createdAt', 'ASC']]
  });

  res.json({ messages });
});

module.exports = router;
