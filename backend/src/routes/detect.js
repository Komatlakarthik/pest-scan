const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { detectionLimiter } = require('../middleware/rateLimiter');
const { uploadImage } = require('../config/cloudinary');
const aiService = require('../services/aiService');
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

    const { fieldId, cropType } = req.body;

    // Upload image to Cloudinary
    logger.info(`Processing disease detection for user ${req.userId}`);
    
    let uploadResult;
    try {
      uploadResult = await uploadImage(req.file.buffer, {
        folder: 'smart-pest-doctor/diagnoses',
        public_id: `diagnosis_${req.userId}_${Date.now()}`
      });
    } catch (uploadError) {
      // If Cloudinary fails, create a data URI as fallback
      logger.warn('Cloudinary upload failed, using data URI fallback:', uploadError.message);
      const base64Image = req.file.buffer.toString('base64');
      uploadResult = {
        secure_url: `data:${req.file.mimetype};base64,${base64Image}`,
        public_id: `local_${Date.now()}`
      };
    }

    // Run AI detection with crop type
    const detectionResult = await aiService.detectDisease(req.file.buffer, cropType || 'Unknown');

    // Normalize severity to database format (lowercase: 'low', 'moderate', 'high')
    const normalizeSeverity = (severity) => {
      const severityMap = {
        'low': 'low',
        'medium': 'moderate',
        'moderate': 'moderate',
        'high': 'high'
      };
      const normalized = severity ? severity.toLowerCase().trim() : 'low';
      return severityMap[normalized] || 'low';
    };

    const normalizedSeverity = normalizeSeverity(detectionResult.severity);

    // Create report
    const report = await Report.create({
      userId: req.userId,
      fieldId: fieldId || null,
      imageUrl: uploadResult.secure_url,
      diseaseName: detectionResult.disease,
      confidence: detectionResult.confidence,
      severity: normalizedSeverity,
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
        priority: normalizedSeverity === 'high' ? 'high' : 'medium',
        description: `Low confidence detection: ${detectionResult.disease} (${detectionResult.confidence}%)`
      });
      expertCaseCreated = true;
      logger.info(`Expert case created for report ${report.id}`);
    }

    // Normalize symptoms to array format
    const normalizeSymptoms = (symptoms) => {
      if (Array.isArray(symptoms)) return symptoms;
      if (typeof symptoms === 'string') return [symptoms];
      return [];
    };

    const response = {
      reportId: report.id,
      disease: detectionResult.disease,
      disease_telugu: detectionResult.disease_telugu,
      confidence: parseFloat(detectionResult.confidence),
      severity: normalizedSeverity,
      severity_telugu: detectionResult.severity_telugu,
      crop: detectionResult.crop,
      crop_telugu: detectionResult.crop_telugu,
      imageUrl: uploadResult.secure_url,
      overlayUrl: null, // TODO: Implement overlay generation
      expertCaseCreated,
      warning: detectionResult.warning || null,
      allPredictions: detectionResult.allPredictions || [],
      source: detectionResult.source,
      model: detectionResult.model,
      symptoms: normalizeSymptoms(detectionResult.symptoms),
      symptoms_telugu: detectionResult.symptoms_telugu,
      treatment: detectionResult.treatment || 'No treatment information available',
      treatment_english: detectionResult.treatment_english,
      treatment_telugu: detectionResult.treatment_telugu,
      prevention: detectionResult.prevention || 'No prevention information available',
      prevention_telugu: detectionResult.prevention_telugu,
      timestamp: report.createdAt
    };

    // Add validation info for "Not a Plant" cases
    if (detectionResult.detectedObjects) {
      response.detectedObjects = detectionResult.detectedObjects;
    }
    if (detectionResult.detectedLabels) {
      response.detectedLabels = detectionResult.detectedLabels;
    }
    if (detectionResult.visionValidation) {
      response.visionValidation = detectionResult.visionValidation;
    }
    if (detectionResult.fallbackUsed) {
      response.fallbackUsed = detectionResult.fallbackUsed;
    }

    logger.info('Sending detection response:', { 
      disease: response.disease, 
      confidence: response.confidence,
      source: response.source,
      hasSymptoms: !!response.symptoms,
      hasTreatment: !!response.treatment,
      responseKeys: Object.keys(response)
    });

    return res.status(200).json(response);

  } catch (error) {
    logger.error('Detection error:', error);
    res.status(500).json({
      error: 'Detection Failed',
      message: error.message || 'Failed to detect disease'
    });
  }
});

module.exports = router;
