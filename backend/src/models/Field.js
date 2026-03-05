const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Field = sequelize.define('Field', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  cropType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'e.g., Tomato, Rice, Wheat'
  },
  size: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Field size in acres'
  },
  locationLat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  locationLon: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'District/Region name'
  },
  sowDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Sowing date'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'fields',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['crop_type'] },
    { fields: ['location_lat', 'location_lon'] }
  ]
});

module.exports = Field;
