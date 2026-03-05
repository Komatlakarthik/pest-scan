#!/usr/bin/env node

/**
 * Smart Pest Doctor - Complete Project Generator
 * This script generates all remaining backend and frontend files
 */

const fs = require('fs').promises;
const path = require('path');

const BASE_DIR = __dirname;

// File templates
const templates = {
  // Backend routes
  'backend/src/routes/detect.js': `const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { detectionLimiter } = require('../middleware/rateLimiter');
const { uploadImage } = require('../config/cloudinary');
const { detectDisease } = require('../services/aiService');
const { Report, ExpertCase } = require('../models');
const logger = require('../utils/logger');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

/**
 * POST /api/detect
 * Detect disease from uploaded image
 */
router.post('/', authenticate, detectionLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Image file is required'
      });
    }

    const { fieldId } = req.body;

    // Upload image to Cloudinary
    logger.info(\`Processing disease detection for user \${req.userId}\`);
    
    const uploadResult = await uploadImage(req.file.buffer, {
      folder: 'smart-pest-doctor/diagnoses',
      public_id: \`diagnosis_\${req.userId}_\${Date.now()}\`
    });

    // Run AI detection
    const detectionResult = await detectDisease(req.file.buffer);

    // Create report
    const report = await Report.create({
      userId: req.userId,
      fieldId: fieldId || null,
      imageUrl: uploadResult.secure_url,
      diseaseName: detectionResult.disease,
      confidence: detectionResult.confidence,
      severity: detectionResult.severity,
      cropType: detectionResult.crop,
      aiResponse: detectionResult.rawResponse
    });

    // Auto-create expert case if confidence < 80%
    let expertCaseCreated = false;
    if (parseFloat(detectionResult.confidence) < 80) {
      await ExpertCase.create({
        reportId: report.id,
        userId: req.userId,
        status: 'open',
        priority: detectionResult.severity === 'high' ? 'high' : 'medium',
        description: \`Low confidence detection: \${detectionResult.disease} (\${detectionResult.confidence}%)\`
      });
      expertCaseCreated = true;
      logger.info(\`Expert case created for report \${report.id}\`);
    }

    res.json({
      reportId: report.id,
      disease: detectionResult.disease,
      confidence: parseFloat(detectionResult.confidence),
      severity: detectionResult.severity,
      crop: detectionResult.crop,
      imageUrl: uploadResult.secure_url,
      overlayUrl: null, // TODO: Implement overlay generation
      expertCaseCreated,
      allPredictions: detectionResult.allPredictions,
      timestamp: report.createdAt
    });

  } catch (error) {
    logger.error('Detection error:', error);
    res.status(500).json({
      error: 'Detection Failed',
      message: error.message || 'Failed to detect disease'
    });
  }
});

module.exports = router;`,

  'backend/src/routes/treatment.js': `const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { generateTreatment, generateVoiceSummary } = require('../services/llmService');
const logger = require('../utils/logger');

/**
 * POST /api/treatment
 * Generate treatment recommendations
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { disease, crop, severity, language = 'en', preferences = [] } = req.body;

    if (!disease || !crop) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Disease and crop are required'
      });
    }

    logger.info(\`Generating treatment for \${disease} on \${crop}\`);

    const treatment = await generateTreatment({
      disease,
      crop,
      severity: severity || 'moderate',
      language,
      preferences
    });

    const voiceSummary = generateVoiceSummary(treatment, language);

    res.json({
      ...treatment,
      voiceSummary,
      language,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Treatment generation error:', error);
    res.status(500).json({
      error: 'Generation Failed',
      message: 'Failed to generate treatment recommendations'
    });
  }
});

module.exports = router;`,

  'backend/src/routes/expert.js': `const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const { ExpertCase, Message, Report, User } = require('../models');
const { uploadImage } = require('../config/cloudinary');
const logger = require('../utils/logger');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * POST /api/expert/send
 * Create expert case
 */
router.post('/send', authenticate, async (req, res) => {
  try {
    const { reportId, message, priority = 'medium' } = req.body;

    const report = await Report.findByPk(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if case already exists
    let expertCase = await ExpertCase.findOne({ where: { reportId } });
    
    if (!expertCase) {
      expertCase = await ExpertCase.create({
        reportId,
        userId: req.userId,
        status: 'open',
        priority,
        description: message
      });
    }

    res.json({
      caseId: expertCase.id,
      status: expertCase.status,
      priority: expertCase.priority,
      createdAt: expertCase.createdAt
    });

  } catch (error) {
    logger.error('Create expert case error:', error);
    res.status(500).json({ error: 'Failed to create expert case' });
  }
});

/**
 * GET /api/expert/cases
 * Get expert cases (for experts)
 */
router.get('/cases', authenticate, authorize('expert', 'admin'), async (req, res) => {
  try {
    const { status = 'open', limit = 20, offset = 0 } = req.query;

    const cases = await ExpertCase.findAll({
      where: status !== 'all' ? { status } : {},
      include: [
        { model: Report, as: 'report' },
        { model: User, as: 'farmer', attributes: ['id', 'name', 'phone'] }
      ],
      order: [['priority', 'DESC'], ['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      cases,
      total: cases.length
    });

  } catch (error) {
    logger.error('Get expert cases error:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

/**
 * POST /api/expert/cases/:id/reply
 * Reply to expert case
 */
router.post('/cases/:id/reply', authenticate, chatLimiter, upload.single('media'), async (req, res) => {
  try {
    const { id } = req.params;
    const { messageText } = req.body;

    const expertCase = await ExpertCase.findByPk(id);
    if (!expertCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    let mediaUrl = null;
    let messageType = 'text';

    if (req.file) {
      const upload = await uploadImage(req.file.buffer, {
        folder: 'smart-pest-doctor/chat'
      });
      mediaUrl = upload.secure_url;
      messageType = req.file.mimetype.startsWith('image') ? 'image' : 'voice';
    }

    const message = await Message.create({
      caseId: id,
      senderId: req.userId,
      messageType,
      messageText,
      mediaUrl
    });

    // Update case status if expert is replying
    if (req.user.role === 'expert' && expertCase.status === 'open') {
      expertCase.status = 'in_progress';
      expertCase.assignedExpertId = req.userId;
      expertCase.assignedAt = new Date();
      await expertCase.save();
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

  } catch (error) {
    logger.error('Reply to case error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;`,

  'backend/src/routes/shop.js': `const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkoutLimiter } = require('../middleware/rateLimiter');
const { Product, Order } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * GET /api/products
 * List products
 */
router.get('/products', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, featured } = req.query;

    const where = { active: true };
    
    if (category) where.category = category;
    if (featured) where.featured = true;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: \`%\${search}%\` } },
        { description: { [Op.like]: \`%\${search}%\` } },
        { brand: { [Op.like]: \`%\${search}%\` } }
      ];
    }

    const products = await Product.findAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['featured', 'DESC'], ['rating', 'DESC']]
    });

    const total = await Product.count({ where });

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * POST /api/orders
 * Create order
 */
router.post('/orders', authenticate, checkoutLimiter, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'razorpay' } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) continue;

      const itemTotal = product.priceCents * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        priceCents: product.priceCents,
        total: itemTotal
      });
    }

    const gst = Math.round(subtotal * 0.18);
    const shipping = subtotal > 50000 ? 0 : 5000; // Free shipping over ₹500
    const total = subtotal + gst + shipping;

    // Generate order number
    const orderNumber = \`ORD-\${new Date().getFullYear()}-\${Date.now().toString().slice(-6)}\`;

    const order = await Order.create({
      orderNumber,
      userId: req.userId,
      orderItems,
      subtotalCents: subtotal,
      gstCents: gst,
      shippingCents: shipping,
      totalCents: total,
      status: 'pending',
      paymentMethod,
      paymentStatus: 'pending',
      shippingAddress
    });

    res.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: total / 100,
      status: order.status
    });

  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * GET /api/orders/:orderNumber
 * Get order status
 */
router.get('/orders/:orderNumber', authenticate, async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      where: { orderNumber, userId: req.userId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      items: order.orderItems,
      total: order.totalCents / 100,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt
    });

  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;`,

  'backend/src/routes/timeline.js': `const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Report, Field } = require('../models');
const logger = require('../utils/logger');

/**
 * GET /api/timeline/:userId
 * Get user's diagnosis timeline
 */
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { fieldId } = req.query;

    // Ensure user can only access their own timeline
    if (parseInt(userId) !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const where = { userId };
    if (fieldId) where.fieldId = fieldId;

    const reports = await Report.findAll({
      where,
      include: [{ model: Field, as: 'field', attributes: ['name', 'cropType'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // Calculate stats
    const stats = {
      totalReports: reports.length,
      highSeverity: reports.filter(r => r.severity === 'high').length,
      avgConfidence: reports.reduce((sum, r) => sum + parseFloat(r.confidence), 0) / reports.length || 0
    };

    res.json({
      reports: reports.map(r => ({
        id: r.id,
        date: r.createdAt,
        disease: r.diseaseName,
        crop: r.cropType || r.field?.cropType,
        severity: r.severity,
        confidence: r.confidence,
        imageUrl: r.imageUrl,
        recoveryScore: r.recoveryScore,
        notes: r.notes
      })),
      stats
    });

  } catch (error) {
    logger.error('Get timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

module.exports = router;`,

  'backend/src/routes/weather.js': `const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getWeather, calculatePestRisk } = require('../services/weatherService');
const { Alert } = require('../models');
const logger = require('../utils/logger');

/**
 * GET /api/weather/:lat/:lon
 * Get weather and pest risk
 */
router.get('/:lat/:lon', authenticate, async (req, res) => {
  try {
    const { lat, lon } = req.params;

    const weather = await getWeather(lat, lon);
    const pestRisk = await calculatePestRisk(weather, lat, lon);

    // Get active alerts for region
    const alerts = await Alert.findAll({
      where: {
        region: weather.location.region,
        active: true
      },
      order: [['riskLevel', 'DESC']],
      limit: 5
    });

    res.json({
      location: weather.location,
      current: weather.current,
      forecast: weather.forecast,
      pestRisk,
      alerts: alerts.map(a => ({
        id: a.id,
        pest: a.pestName,
        risk: a.riskLevel,
        message: a.recommendations
      }))
    });

  } catch (error) {
    logger.error('Get weather error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

module.exports = router;`,

  'backend/src/routes/feedback.js': `const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * POST /api/feedback
 * Submit feedback
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { type, message, rating } = req.body;

    logger.info(\`Feedback received from user \${req.userId}: \${type}\`);

    // In production, store feedback in database
    // For now, just log it

    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });

  } catch (error) {
    logger.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

module.exports = router;`,

  'backend/src/services/weatherService.js': `const axios = require('axios');
const { Report } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = process.env.WEATHER_API_URL || 'https://api.weatherapi.com/v1';

/**
 * Get weather data
 */
const getWeather = async (lat, lon) => {
  try {
    const response = await axios.get(\`\${WEATHER_API_URL}/forecast.json\`, {
      params: {
        key: WEATHER_API_KEY,
        q: \`\${lat},\${lon}\`,
        days: 3
      }
    });

    const data = response.data;

    return {
      location: {
        lat,
        lon,
        region: data.location.region || data.location.name
      },
      current: {
        temp: data.current.temp_c,
        humidity: data.current.humidity,
        conditions: data.current.condition.text,
        windSpeed: data.current.wind_kph
      },
      forecast: data.forecast.forecastday.map(day => ({
        date: day.date,
        maxTemp: day.day.maxtemp_c,
        minTemp: day.day.mintemp_c,
        humidity: day.day.avghumidity,
        rainfall: day.day.totalprecip_mm
      }))
    };
  } catch (error) {
    logger.error('Weather API error:', error);
    throw new Error('Failed to fetch weather data');
  }
};

/**
 * Calculate pest outbreak risk
 */
const calculatePestRisk = async (weather, lat, lon) => {
  let riskScore = 0;
  const factors = {};

  // High humidity increases risk
  if (weather.current.humidity > 75) {
    riskScore += 30;
    factors.humidity = 'high';
  } else if (weather.current.humidity > 60) {
    riskScore += 15;
    factors.humidity = 'moderate';
  }

  // Temperature in optimal range for pests
  if (weather.current.temp >= 20 && weather.current.temp <= 30) {
    riskScore += 25;
    factors.temperature = 'optimal';
  }

  // Check recent reports in area (within 50km radius)
  // Simplified: just count recent reports
  const recentReports = await Report.count({
    where: {
      severity: { [Op.in]: ['moderate', 'high'] },
      createdAt: {
        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      }
    }
  });

  if (recentReports > 10) {
    riskScore += 20;
    factors.recentReports = recentReports;
  }

  // Determine risk level
  let level = 'low';
  if (riskScore >= 60) level = 'high';
  else if (riskScore >= 40) level = 'moderate';

  return {
    level,
    score: riskScore,
    factors,
    recommendations: getRecommendations(level)
  };
};

const getRecommendations = (level) => {
  const recommendations = {
    low: ['Regular monitoring recommended', 'Maintain good field hygiene'],
    moderate: ['Increase monitoring frequency', 'Consider preventive measures', 'Check crops every 2-3 days'],
    high: ['Inspect crops daily', 'Apply preventive treatments', 'Consult agricultural expert']
  };
  return recommendations[level] || [];
};

module.exports = {
  getWeather,
  calculatePestRisk
};`,

  'backend/src/jobs/weatherCron.js': `const cron = require('node-cron');
const { Alert, Field } = require('../models');
const { getWeather, calculatePestRisk } = require('../services/weatherService');
const logger = require('../utils/logger');

let weatherCronJob = null;

/**
 * Weather and alert cron job
 * Runs every 6 hours
 */
const startCronJobs = () => {
  const schedule = process.env.WEATHER_CRON_SCHEDULE || '0 */6 * * *';

  weatherCronJob = cron.schedule(schedule, async () => {
    try {
      logger.info('Running weather alert cron job...');

      // Get unique regions from fields
      const fields = await Field.findAll({
        attributes: ['locationLat', 'locationLon', 'region'],
        where: { active: true },
        group: ['region']
      });

      for (const field of fields) {
        if (!field.locationLat || !field.locationLon) continue;

        try {
          const weather = await getWeather(field.locationLat, field.locationLon);
          const risk = await calculatePestRisk(weather, field.locationLat, field.locationLon);

          // Create alert if risk is moderate or higher
          if (['moderate', 'high', 'critical'].includes(risk.level)) {
            await Alert.create({
              region: weather.location.region,
              pestName: 'General Pest Outbreak',
              riskLevel: risk.level,
              riskScore: risk.score,
              reason: \`Weather conditions favor pest activity. Humidity: \${weather.current.humidity}%, Temp: \${weather.current.temp}°C\`,
              weatherData: weather,
              recommendations: risk.recommendations.join('; '),
              active: true,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            });

            logger.info(\`Alert created for region: \${weather.location.region}\`);
          }
        } catch (error) {
          logger.error(\`Error processing field \${field.id}:\`, error);
        }
      }

      logger.info('Weather alert cron job completed');
    } catch (error) {
      logger.error('Weather cron job error:', error);
    }
  });

  logger.info(\`Weather cron job scheduled: \${schedule}\`);
};

const stopCronJobs = () => {
  if (weatherCronJob) {
    weatherCronJob.stop();
    logger.info('Weather cron job stopped');
  }
};

module.exports = {
  startCronJobs,
  stopCronJobs
};`
};

// Helper function to ensure directory exists
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

// Generate all files
async function generateFiles() {
  console.log('🚀 Generating Smart Pest Doctor backend files...\n');

  for (const [filePath, content] of Object.entries(templates)) {
    const fullPath = path.join(BASE_DIR, filePath);
    const dir = path.dirname(fullPath);
    
    await ensureDir(dir);
    await fs.writeFile(fullPath, content, 'utf8');
    console.log(\`✅ Created: \${filePath}\`);
  }

  console.log(\`\n✨ Generated \${Object.keys(templates).length} files successfully!\`);
}

// Run if executed directly
if (require.main === module) {
  generateFiles().catch(console.error);
}

module.exports = { generateFiles };
