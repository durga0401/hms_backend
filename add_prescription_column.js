// Migration script to add prescription column to appointments table
// Run this once: node add_prescription_column.js

const { pool } = require("./config/db");

async function addPrescriptionColumn() {
  try {
    console.log("Checking if prescription column exists...");

    // Check if column already exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'prescription'
    `);

    if (columns.length > 0) {
      console.log("ℹ️ Prescription column already exists.");
      process.exit(0);
    }

    console.log("Adding prescription column to appointments table...");

    await pool.execute(`
      ALTER TABLE appointments 
      ADD COLUMN prescription TEXT NULL
    `);

    console.log("✅ Prescription column added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding prescription column:", error.message);
    process.exit(1);
  }
}

addPrescriptionColumn();
