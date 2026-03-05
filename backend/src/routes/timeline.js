const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Report, Field } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/timeline/:userId
 * Get user's diagnosis history and timeline
 */
router.get('/:userId', authenticate, async (req, res) => {
  const { userId } = req.params;
  const { fieldId } = req.query;

  // Users can only access their own timeline unless they're admin
  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own timeline'
    });
  }

  const whereClause = { userId: parseInt(userId) };

  if (fieldId) {
    whereClause.fieldId = parseInt(fieldId);
  }

  const reports = await Report.findAll({
    where: whereClause,
    include: [
      {
        model: Field,
        as: 'field',
        attributes: ['id', 'name', 'cropType']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 100
  });

  // Calculate stats
  const stats = {
    totalReports: reports.length,
    highSeverity: reports.filter(r => r.severity === 'high').length,
    moderateSeverity: reports.filter(r => r.severity === 'moderate').length,
    lowSeverity: reports.filter(r => r.severity === 'low').length,
    avgConfidence: reports.length > 0 
      ? (reports.reduce((sum, r) => sum + parseFloat(r.confidence), 0) / reports.length).toFixed(2)
      : 0
  };

  // Format reports for response
  const formattedReports = reports.map(report => ({
    id: report.id,
    date: report.createdAt,
    disease: report.diseaseName,
    crop: report.cropType,
    severity: report.severity,
    confidence: parseFloat(report.confidence),
    imageUrl: report.imageUrl,
    overlayUrl: report.overlayUrl,
    recoveryScore: report.recoveryScore,
    field: report.field ? {
      id: report.field.id,
      name: report.field.name
    } : null
  }));

  res.json({
    reports: formattedReports,
    stats
  });
});

/**
 * GET /api/timeline/report/:reportId
 * Get detailed report information
 */
router.get('/report/:reportId', authenticate, async (req, res) => {
  const report = await Report.findOne({
    where: { id: req.params.reportId },
    include: [
      {
        model: Field,
        as: 'field',
        attributes: ['id', 'name', 'cropType', 'location']
      }
    ]
  });

  if (!report) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Report not found'
    });
  }

  // Check permissions
  if (report.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own reports'
    });
  }

  res.json({
    id: report.id,
    disease: report.diseaseName,
    confidence: parseFloat(report.confidence),
    severity: report.severity,
    cropType: report.cropType,
    imageUrl: report.imageUrl,
    overlayUrl: report.overlayUrl,
    treatmentSummary: report.treatmentSummary,
    aiResponse: report.aiResponse,
    recoveryScore: report.recoveryScore,
    field: report.field,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  });
});

/**
 * PATCH /api/timeline/report/:reportId
 * Update report (e.g., recovery score, notes)
 */
router.patch('/report/:reportId', authenticate, async (req, res) => {
  const { recoveryScore } = req.body;

  const report = await Report.findByPk(req.params.reportId);

  if (!report) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Report not found'
    });
  }

  // Check permissions
  if (report.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only update your own reports'
    });
  }

  if (recoveryScore !== undefined) {
    if (recoveryScore < 0 || recoveryScore > 100) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Recovery score must be between 0 and 100'
      });
    }
    report.recoveryScore = recoveryScore;
  }

  await report.save();

  res.json({
    message: 'Report updated successfully',
    report: {
      id: report.id,
      recoveryScore: report.recoveryScore
    }
  });
});

module.exports = router;
