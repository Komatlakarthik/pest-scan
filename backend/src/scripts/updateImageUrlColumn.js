require('dotenv').config();
const { sequelize } = require('../config/database');

async function updateSchema() {
  try {
    console.log('Updating database schema...');
    
    // Update image_url column to LONGTEXT
    await sequelize.query(
      'ALTER TABLE reports MODIFY COLUMN image_url LONGTEXT NOT NULL'
    );
    console.log('✅ image_url column updated to LONGTEXT');
    
    // Update overlay_url column to LONGTEXT
    await sequelize.query(
      'ALTER TABLE reports MODIFY COLUMN overlay_url LONGTEXT NULL'
    );
    console.log('✅ overlay_url column updated to LONGTEXT');
    
    console.log('✅ Database schema updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating schema:', error.message);
    process.exit(1);
  }
}

updateSchema();
