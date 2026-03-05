const { sequelize, TreatmentPlan } = require('./src/models');

async function createTable() {
  try {
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables synced successfully!');
    console.log('✅ TreatmentPlan table created/updated');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createTable();
