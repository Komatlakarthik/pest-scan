const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'District/region name'
  },
  pestName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  cropTypes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of affected crop types'
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'moderate', 'high', 'critical'),
    allowNull: false
  },
  riskScore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Why this alert was generated'
  },
  weatherData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Weather conditions that triggered alert'
  },
  recommendations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notificationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notificationSentAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'alerts',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['region'] },
    { fields: ['risk_level'] },
    { fields: ['active'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Alert;
