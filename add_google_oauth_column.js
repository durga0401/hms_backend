// Migration script to add google_id column to users table
// Run this once: node add_google_oauth_column.js

const { pool } = require("./config/db");

async function addGoogleOAuthColumn() {
  try {
    console.log("Checking if google_id column exists...");

    // Check if column exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'google_id'
    `);

    if (columns.length > 0) {
      console.log("ℹ️ google_id column already exists.");
      process.exit(0);
    }

    console.log("Adding google_id column to users table...");

    await pool.execute(`
      ALTER TABLE users 
      ADD COLUMN google_id VARCHAR(255) NULL UNIQUE
    `);

    console.log("✅ google_id column added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding google_id column:", error.message);
    process.exit(1);
  }
}

addGoogleOAuthColumn();
