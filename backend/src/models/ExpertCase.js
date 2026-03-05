const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExpertCase = sequelize.define('ExpertCase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reportId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'reports',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Farmer who created the case'
  },
  assignedExpertId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  status: {
    type: DataTypes.ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'open',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium',
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolution: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Expert resolution notes'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Farmer rating of expert help (1-5 stars)'
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'expert_cases',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['assigned_expert_id'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['created_at'] }
  ]
});

module.exports = ExpertCase;
