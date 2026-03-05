require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'smart_pest_doctor',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'rootpassword',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

async function showUsers() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.\n');

    const [results] = await sequelize.query(
      'SELECT id, name, email, phone, password, created_at FROM users ORDER BY id'
    );

    if (results.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log('=== ALL USERS ===\n');
    results.forEach((user, index) => {
      console.log(`User #${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email || 'Not provided'}`);
      console.log(`  Phone: ${user.phone || 'Not provided'}`);
      console.log(`  Password (hashed): ${user.password || 'Not set'}`);
      console.log(`  Created: ${user.created_at}`);
      console.log('---');
    });

    console.log(`\nTotal users: ${results.length}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

showUsers();
