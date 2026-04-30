const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection (throws on failure — caller should await before listen)
const testConnection = async () => {
  const connection = await pool.getConnection();
  connection.release();
};

module.exports = { pool, testConnection };
