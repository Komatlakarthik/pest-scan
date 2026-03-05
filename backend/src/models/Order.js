const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Human-readable order number, e.g., ORD-2025-001'
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
  orderItems: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of {productId, name, quantity, priceCents, total}'
  },
  subtotalCents: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  gstCents: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  shippingCents: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalCents: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'),
    defaultValue: 'pending',
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('razorpay', 'cod', 'wallet'),
    defaultValue: 'razorpay',
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
    defaultValue: 'pending',
    allowNull: false
  },
  razorpayOrderId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  razorpayPaymentId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Address details'
  },
  trackingNumber: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  estimatedDelivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  invoiceUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['order_number'], unique: true },
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['payment_status'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Order;
