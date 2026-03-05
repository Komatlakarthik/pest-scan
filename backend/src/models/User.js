const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    validate: {
      is: /^\+?[1-9]\d{1,14}$/ // E.164 format
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  language: {
    type: DataTypes.ENUM('en', 'hi', 'te', 'ta', 'mr', 'bn'),
    defaultValue: 'en',
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('farmer', 'expert', 'admin'),
    defaultValue: 'farmer',
    allowNull: false
  },
  profileImage: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fcmToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'FCM token for push notifications'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['phone'] },
    { fields: ['email'] },
    { fields: ['role'] }
  ]
});

module.exports = User;
