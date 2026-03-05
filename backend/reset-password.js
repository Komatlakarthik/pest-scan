require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetPassword() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.\n');

    // Get username
    const username = await question('Enter username to reset password: ');
    
    // Check if user exists
    const [users] = await sequelize.query(
      'SELECT id, name FROM users WHERE name = ?',
      { replacements: [username] }
    );

    if (users.length === 0) {
      console.log(`\n❌ User "${username}" not found.`);
      rl.close();
      await sequelize.close();
      return;
    }

    const user = users[0];
    console.log(`\n✅ Found user: ${user.name} (ID: ${user.id})`);

    // Get new password
    const newPassword = await question('\nEnter new password (min 6 characters): ');

    if (newPassword.length < 6) {
      console.log('\n❌ Password must be at least 6 characters long.');
      rl.close();
      await sequelize.close();
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await sequelize.query(
      'UPDATE users SET password = ? WHERE id = ?',
      { replacements: [hashedPassword, user.id] }
    );

    console.log('\n✅ Password reset successfully!');
    console.log(`\nYou can now login with:`);
    console.log(`  Username: ${user.name}`);
    console.log(`  Password: ${newPassword}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
    await sequelize.close();
  }
}

resetPassword();
