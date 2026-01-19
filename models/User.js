const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

class User {
  // Create a new user
  static async create(userData) {
    const { name, email, password, role, phone } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, phone || null]
    );
    return result.insertId;
  }

  // Find user by email
  static async findByEmail(email) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, phone, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  // Get all users (Admin only)
  static async findAll() {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, phone, created_at, updated_at FROM users"
    );
    return rows;
  }

  // Get users by role
  static async findByRole(role) {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, phone, created_at, updated_at FROM users WHERE role = ?",
      [role]
    );
    return rows;
  }

  // Update user
  static async update(id, userData) {
    const { name, phone } = userData;
    const [result] = await pool.execute(
      "UPDATE users SET name = ?, phone = ? WHERE id = ?",
      [name, phone, id]
    );
    return result.affectedRows > 0;
  }

  // Delete user
  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
