const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { User, Report, Field, Order } = require('../models');
const logger = require('../utils/logger');

/**
 * GET /api/user/:userId
 * Get user profile
 */
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only access their own profile unless they're admin
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own profile'
      });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    // Get user stats
    const reportCount = await Report.count({ where: { userId: parseInt(userId) } });
    const fieldCount = await Field.count({ where: { userId: parseInt(userId) } });
    const orderCount = await Order.count({ where: { userId: parseInt(userId) } });

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      language: user.language,
      role: user.role,
      profileImage: user.profileImage,
      verified: user.verified,
      active: user.active,
      stats: {
        reports: reportCount,
        fields: fieldCount,
        orders: orderCount
      }
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch user profile'
    });
  }
});

/**
 * PUT /api/user/:userId
 * Update user profile
 */
router.put('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only update their own profile
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const { name, email, language, profileImage } = req.body;

    if (name) user.name = name;
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid email format'
        });
      }
      user.email = email;
    }
    if (language) user.language = language;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    logger.info(`User profile updated: ${user.id}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        language: user.language,
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update profile'
    });
  }
});

/**
 * GET /api/user/:userId/dashboard
 * Get user dashboard data with stats
 */
router.get('/:userId/dashboard', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own dashboard'
      });
    }

    // Get recent reports
    const recentReports = await Report.findAll({
      where: { userId: parseInt(userId) },
      include: [
        {
          model: Field,
          as: 'field',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Get fields with health status
    const fields = await Field.findAll({
      where: { userId: parseInt(userId) },
      include: [
        {
          model: Report,
          as: 'reports',
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    // Calculate stats
    const totalReports = await Report.count({ where: { userId: parseInt(userId) } });
    const highSeverityAlerts = await Report.count({
      where: {
        userId: parseInt(userId),
        severity: 'high',
        createdAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const avgConfidence = await Report.findAll({
      where: { userId: parseInt(userId) },
      attributes: [[require('sequelize').fn('AVG', require('sequelize').col('confidence')), 'avgConf']],
      raw: true
    });

    res.json({
      stats: {
        totalScans: totalReports,
        activeFields: fields.length,
        activeAlerts: highSeverityAlerts,
        avgConfidence: avgConfidence[0]?.avgConf ? parseFloat(avgConfidence[0].avgConf).toFixed(0) : 0
      },
      recentActivity: recentReports.map(r => ({
        id: r.id,
        disease: r.diseaseName,
        disease_telugu: r.diseaseNameTelugu,
        crop: r.cropType,
        crop_telugu: r.cropTypeTelugu,
        severity: r.severity,
        severity_telugu: r.severityTelugu,
        confidence: parseFloat(r.confidence),
        symptoms: r.symptoms,
        symptoms_telugu: r.symptomsTelugu,
        treatment: r.treatment,
        treatment_telugu: r.treatmentTelugu,
        prevention: r.prevention,
        prevention_telugu: r.preventionTelugu,
        imageUrl: r.imageUrl,
        fieldName: r.field?.name,
        date: r.createdAt
      })),
      fields: fields.map(f => ({
        id: f.id,
        name: f.name,
        crops: f.cropType?.split(',').map(c => c.trim()),
        status: f.reports && f.reports[0] ? 
                (f.reports[0].severity === 'high' ? 'critical' : 
                 f.reports[0].severity === 'moderate' ? 'warning' : 'healthy') : 'healthy',
        confidence: f.reports && f.reports[0] ? parseFloat(f.reports[0].confidence) : 100
      }))
    });

  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

module.exports = router;
