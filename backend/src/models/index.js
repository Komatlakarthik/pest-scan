const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Field = require('./Field');
const Report = require('./Report');
const ExpertCase = require('./ExpertCase');
const Message = require('./Message');
const Product = require('./Product');
const Order = require('./Order');
const Alert = require('./Alert');
const TreatmentPlan = require('./TreatmentPlan');

// Define associations

// User <-> Field (One-to-Many)
User.hasMany(Field, { foreignKey: 'userId', as: 'fields' });
Field.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Report (One-to-Many)
User.hasMany(Report, { foreignKey: 'userId', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Field <-> Report (One-to-Many)
Field.hasMany(Report, { foreignKey: 'fieldId', as: 'reports' });
Report.belongsTo(Field, { foreignKey: 'fieldId', as: 'field' });

// Report <-> ExpertCase (One-to-One)
Report.hasOne(ExpertCase, { foreignKey: 'reportId', as: 'expertCase' });
ExpertCase.belongsTo(Report, { foreignKey: 'reportId', as: 'report' });

// User <-> ExpertCase (Farmer relation)
User.hasMany(ExpertCase, { foreignKey: 'userId', as: 'cases' });
ExpertCase.belongsTo(User, { foreignKey: 'userId', as: 'farmer' });

// User <-> ExpertCase (Expert relation)
User.hasMany(ExpertCase, { foreignKey: 'assignedExpertId', as: 'assignedCases' });
ExpertCase.belongsTo(User, { foreignKey: 'assignedExpertId', as: 'expert' });

// ExpertCase <-> Message (One-to-Many)
ExpertCase.hasMany(Message, { foreignKey: 'caseId', as: 'messages' });
Message.belongsTo(ExpertCase, { foreignKey: 'caseId', as: 'case' });

// User <-> Message (One-to-Many)
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// User <-> Order (One-to-Many)
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> TreatmentPlan (One-to-Many)
User.hasMany(TreatmentPlan, { foreignKey: 'userId', as: 'treatmentPlans' });
TreatmentPlan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Report <-> TreatmentPlan (One-to-One)
Report.hasOne(TreatmentPlan, { foreignKey: 'reportId', as: 'treatmentPlan' });
TreatmentPlan.belongsTo(Report, { foreignKey: 'reportId', as: 'report' });

// Field <-> TreatmentPlan (One-to-Many)
Field.hasMany(TreatmentPlan, { foreignKey: 'fieldId', as: 'treatmentPlans' });
TreatmentPlan.belongsTo(Field, { foreignKey: 'fieldId', as: 'field' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Field,
  Report,
  ExpertCase,
  Message,
  Product,
  Order,
  Alert,
  TreatmentPlan
};
