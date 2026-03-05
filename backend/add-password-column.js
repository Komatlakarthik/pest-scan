require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function addPasswordColumn() {
  try {
    console.log('Checking if password column exists...');
    
    // Check if password column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'password';
    `);
    
    if (results.length === 0) {
      console.log('Adding password column to users table...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN password VARCHAR(255) NULL
        AFTER email;
      `);
      console.log('✅ Password column added successfully!');
    } else {
      console.log('✅ Password column already exists!');
    }
    
    // Make phone column nullable
    console.log('Making phone column nullable...');
    await sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN phone VARCHAR(20) NULL;
    `);
    
    console.log('✅ Phone column made nullable!');
    console.log('✅ All migrations completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    process.exit(1);
  }
}

addPasswordColumn();
