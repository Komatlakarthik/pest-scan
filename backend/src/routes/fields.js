const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Field, Report } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * GET /api/fields/user/:userId
 * Get all fields for a user
 */
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only access their own fields unless they're admin
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own fields'
      });
    }

    const fields = await Field.findAll({
      where: { userId: parseInt(userId) },
      include: [
        {
          model: Report,
          as: 'reports',
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'diseaseName', 'severity', 'confidence', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format fields with additional stats
    const formattedFields = await Promise.all(fields.map(async (field) => {
      const reportCount = await Report.count({
        where: { fieldId: field.id }
      });

      const alertCount = await Report.count({
        where: {
          fieldId: field.id,
          severity: { [Op.in]: ['high', 'moderate'] },
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      // Determine health status based on latest report
      let healthStatus = 'healthy';
      let confidence = 100;

      if (field.reports && field.reports.length > 0) {
        const latestReport = field.reports[0];
        healthStatus = latestReport.severity === 'high' ? 'critical' : 
                      latestReport.severity === 'moderate' ? 'warning' : 'healthy';
        confidence = parseFloat(latestReport.confidence);
      }

      return {
        id: field.id,
        name: field.name,
        location: field.location,
        crops: field.cropType ? field.cropType.split(',').map(c => c.trim()) : [],
        size: parseFloat(field.size),
        plantedDate: field.plantedDate,
        status: healthStatus,
        confidence: confidence,
        scans: reportCount,
        alerts: alertCount,
        image: field.imageUrl,
        createdAt: field.createdAt
      };
    }));

    res.json({ fields: formattedFields });

  } catch (error) {
    logger.error('Get fields error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch fields'
    });
  }
});

/**
 * GET /api/fields/:fieldId
 * Get single field details
 */
router.get('/:fieldId', authenticate, async (req, res) => {
  try {
    const field = await Field.findOne({
      where: { id: req.params.fieldId },
      include: [
        {
          model: Report,
          as: 'reports',
          order: [['createdAt', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!field) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Field not found'
      });
    }

    // Check permissions
    if (field.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own fields'
      });
    }

    // Determine health status based on latest report
    let healthStatus = 'healthy';
    let confidence = 100;

    if (field.reports && field.reports.length > 0) {
      const latestReport = field.reports[0];
      healthStatus = latestReport.severity === 'high' ? 'critical' : 
                    latestReport.severity === 'moderate' ? 'warning' : 'healthy';
      confidence = parseFloat(latestReport.confidence || 100);
    }

    // Format recent reports
    const recentReports = field.reports ? field.reports.map(report => ({
      id: report.id,
      disease: report.diseaseName,
      severity: report.severity === 'high' ? 'High' : 
                report.severity === 'moderate' ? 'Medium' : 'Low',
      confidence: parseFloat(report.confidence || 0),
      createdAt: report.createdAt
    })) : [];

    res.json({
      field: {
        id: field.id,
        name: field.name,
        location: field.location,
        cropType: field.cropType,
        size: parseFloat(field.size),
        plantedDate: field.plantedDate,
        status: healthStatus,
        confidence: confidence,
        imageUrl: field.imageUrl,
        recentReports: recentReports,
        createdAt: field.createdAt
      }
    });

  } catch (error) {
    logger.error('Get field error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch field'
    });
  }
});

/**
 * POST /api/fields
 * Create a new field
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, location, cropType, size, plantedDate, imageUrl } = req.body;

    if (!name || !location || !cropType) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name, location, and crop type are required'
      });
    }

    const field = await Field.create({
      userId: req.user.id,
      name,
      location,
      cropType,
      size: size || 1.0,
      plantedDate: plantedDate || new Date(),
      imageUrl: imageUrl || null
    });

    logger.info(`Field created: ${field.id} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Field created successfully',
      field: {
        id: field.id,
        name: field.name,
        location: field.location,
        cropType: field.cropType,
        size: parseFloat(field.size)
      }
    });

  } catch (error) {
    logger.error('Create field error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to create field'
    });
  }
});

/**
 * PUT /api/fields/:fieldId
 * Update field information
 */
router.put('/:fieldId', authenticate, async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.fieldId);

    if (!field) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Field not found'
      });
    }

    // Check permissions
    if (field.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own fields'
      });
    }

    const { name, location, cropType, size, plantedDate, imageUrl } = req.body;

    if (name) field.name = name;
    if (location) field.location = location;
    if (cropType) field.cropType = cropType;
    if (size) field.size = size;
    if (plantedDate) field.plantedDate = plantedDate;
    if (imageUrl !== undefined) field.imageUrl = imageUrl;

    await field.save();

    res.json({
      success: true,
      message: 'Field updated successfully',
      field
    });

  } catch (error) {
    logger.error('Update field error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update field'
    });
  }
});

/**
 * DELETE /api/fields/:fieldId
 * Delete a field
 */
router.delete('/:fieldId', authenticate, async (req, res) => {
  try {
    const field = await Field.findByPk(req.params.fieldId);

    if (!field) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Field not found'
      });
    }

    // Check permissions
    if (field.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own fields'
      });
    }

    await field.destroy();

    logger.info(`Field deleted: ${field.id} by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Field deleted successfully'
    });

  } catch (error) {
    logger.error('Delete field error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to delete field'
    });
  }
});

module.exports = router;
