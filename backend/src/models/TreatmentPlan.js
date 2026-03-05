const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TreatmentPlan = sequelize.define('TreatmentPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  reportId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Reports',
      key: 'id'
    }
  },
  fieldId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Fields',
      key: 'id'
    }
  },
  cropType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  disease: {
    type: DataTypes.STRING,
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('low', 'moderate', 'high'),
    defaultValue: 'moderate'
  },
  treatmentData: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('treatmentData');
      return rawValue ? JSON.parse(rawValue) : null;
    },
    set(value) {
      this.setDataValue('treatmentData', JSON.stringify(value));
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    defaultValue: 'active'
  },
  startDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'treatment_plans',
  timestamps: true
});

module.exports = TreatmentPlan;
