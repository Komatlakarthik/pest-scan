const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  fieldId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'fields',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  imageUrl: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: 'Image URL or base64 data URI'
  },
  overlayUrl: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Image with bounding boxes/heatmap'
  },
  diseaseName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'AI confidence score (0-100)'
  },
  severity: {
    type: DataTypes.ENUM('low', 'moderate', 'high'),
    allowNull: false
  },
  cropType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  treatmentSummary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  aiResponse: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Raw AI model response'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User notes'
  },
  recoveryScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'User-rated recovery score (0-100)'
  }
}, {
  tableName: 'reports',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['field_id'] },
    { fields: ['disease_name'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Report;
