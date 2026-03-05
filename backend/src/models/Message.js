const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  caseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'expert_cases',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'voice', 'video'),
    defaultValue: 'text',
    allowNull: false
  },
  messageText: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mediaUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL for image/voice/video files'
  },
  mediaDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds for voice/video'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['case_id'] },
    { fields: ['sender_id'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Message;
