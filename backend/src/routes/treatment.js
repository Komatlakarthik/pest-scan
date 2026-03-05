const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { generateTreatment, generateVoiceSummary } = require('../services/llmService');
const { TreatmentPlan, Report, Field } = require('../models');
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

    logger.info(`Generating treatment for ${disease} on ${crop}`);

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

/**
 * POST /api/treatment/save
 * Save treatment plan
 */
router.post('/save', authenticate, async (req, res) => {
  try {
    const { 
      reportId, 
      fieldId, 
      cropType, 
      disease, 
      severity, 
      treatmentData 
    } = req.body;

    if (!cropType || !disease || !treatmentData) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Crop type, disease, and treatment data are required'
      });
    }

    const treatmentPlan = await TreatmentPlan.create({
      userId: req.user.id,
      reportId: reportId || null,
      fieldId: fieldId || null,
      cropType,
      disease,
      severity: severity || 'moderate',
      treatmentData,
      status: 'active',
      startDate: new Date(),
      progress: 0
    });

    logger.info(`Treatment plan saved: ${treatmentPlan.id} for user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Treatment plan saved successfully',
      treatmentPlan: {
        id: treatmentPlan.id,
        cropType: treatmentPlan.cropType,
        disease: treatmentPlan.disease,
        severity: treatmentPlan.severity,
        status: treatmentPlan.status,
        progress: treatmentPlan.progress,
        createdAt: treatmentPlan.createdAt
      }
    });

  } catch (error) {
    logger.error('Save treatment plan error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to save treatment plan'
    });
  }
});

/**
 * GET /api/treatment/plans
 * Get all treatment plans for the authenticated user
 */
router.get('/plans', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const plans = await TreatmentPlan.findAll({
      where,
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name', 'cropType']
        },
        {
          model: Report,
          as: 'report',
          attributes: ['id', 'imageUrl', 'confidence']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: plans.length,
      treatmentPlans: plans
    });

  } catch (error) {
    logger.error('Get treatment plans error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch treatment plans'
    });
  }
});

/**
 * GET /api/treatment/plans/:id
 * Get single treatment plan
 */
router.get('/plans/:id', authenticate, async (req, res) => {
  try {
    const plan = await TreatmentPlan.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name', 'cropType']
        },
        {
          model: Report,
          as: 'report',
          attributes: ['id', 'imageUrl', 'confidence', 'diseaseName']
        }
      ]
    });

    if (!plan) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Treatment plan not found'
      });
    }

    res.json({
      success: true,
      treatmentPlan: plan
    });

  } catch (error) {
    logger.error('Get treatment plan error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch treatment plan'
    });
  }
});

/**
 * PUT /api/treatment/plans/:id/progress
 * Update treatment plan progress
 */
router.put('/plans/:id/progress', authenticate, async (req, res) => {
  try {
    const { progress, notes } = req.body;

    const plan = await TreatmentPlan.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!plan) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Treatment plan not found'
      });
    }

    if (progress !== undefined) {
      plan.progress = Math.min(100, Math.max(0, progress));
      
      // Auto-complete if progress reaches 100%
      if (plan.progress === 100) {
        plan.status = 'completed';
        plan.endDate = new Date();
      }
    }

    if (notes) {
      plan.notes = notes;
    }

    await plan.save();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      treatmentPlan: plan
    });

  } catch (error) {
    logger.error('Update progress error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update progress'
    });
  }
});

/**
 * DELETE /api/treatment/plans/:id
 * Delete treatment plan
 */
router.delete('/plans/:id', authenticate, async (req, res) => {
  try {
    const plan = await TreatmentPlan.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!plan) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Treatment plan not found'
      });
    }

    await plan.destroy();

    logger.info(`Treatment plan deleted: ${plan.id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Treatment plan deleted successfully'
    });

  } catch (error) {
    logger.error('Delete treatment plan error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to delete treatment plan'
    });
  }
});

module.exports = router;
