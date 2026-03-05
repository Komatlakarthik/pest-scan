const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('fungicide', 'insecticide', 'herbicide', 'fertilizer', 'organic', 'equipment'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priceCents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Price in smallest currency unit (paise)'
  },
  gstPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 18.00,
    allowNull: false
  },
  stockQty: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: 'kg',
    comment: 'e.g., kg, liter, piece'
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of additional image URLs'
  },
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Technical specifications'
  },
  usageInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  safetyInfo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['category'] },
    { fields: ['brand'] },
    { fields: ['active'] },
    { fields: ['featured'] }
  ]
});

module.exports = Product;
