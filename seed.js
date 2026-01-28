const { pool } = require("./config/db");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    console.log("🌱 Starting database seed...");

    // Check if admin exists
    const [existingAdmin] = await pool.execute(
      "SELECT * FROM users WHERE email = ?",
      ["admin@hospital.com"],
    );

    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists");
      console.log("   Email: admin@hospital.com");
      console.log("   Password: admin123");
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await pool.execute(
        "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)",
        [
          "System Admin",
          "admin@hospital.com",
          hashedPassword,
          "ADMIN",
          "1234567890",
        ],
      );

      console.log("✅ Admin user created successfully");
      console.log("   Email: admin@hospital.com");
      console.log("   Password: admin123");
    }

    // Create some sample data if needed
    const [userCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM users",
    );
    console.log(`\n📊 Total users in database: ${userCount[0].count}`);

    const [appointmentCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM appointments",
    );
    console.log(
      `📊 Total appointments in database: ${appointmentCount[0].count}`,
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();
