const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

class User {
  // Create a new user
  static async create(userData) {
    const { name, email, password, role, phone } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, phone || null],
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
      [id],
    );
    return rows[0];
  }

  // Get all users (Admin only)
  static async findAll() {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, phone, created_at, updated_at FROM users",
    );
    return rows;
  }

  // Get users by role
  static async findByRole(role) {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, phone, created_at, updated_at FROM users WHERE role = ?",
      [role],
    );
    return rows;
  }

  // Update user
  static async update(id, userData) {
    const { name, phone } = userData;
    const [result] = await pool.execute(
      "UPDATE users SET name = ?, phone = ? WHERE id = ?",
      [name, phone, id],
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
      [hashedPassword, id],
    );
    return result.affectedRows > 0;
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Find user by Google ID
  static async findByGoogleId(googleId) {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, phone, google_id, created_at, updated_at FROM users WHERE google_id = ?",
      [googleId],
    );
    return rows[0];
  }

  // Create user with Google OAuth
  static async createWithGoogle(userData) {
    const { name, email, google_id, role } = userData;

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, google_id, role) VALUES (?, ?, ?, ?)",
      [name, email, google_id, role],
    );
    return result.insertId;
  }

  // Update user's Google ID (link account)
  static async updateGoogleId(id, googleId) {
    const [result] = await pool.execute(
      "UPDATE users SET google_id = ? WHERE id = ?",
      [googleId, id],
    );
    return result.affectedRows > 0;
  }

  // Save password reset OTP hash and expiry
  static async setPasswordResetOtp(id, otpHash, expiresAt) {
    const [result] = await pool.execute(
      "UPDATE users SET reset_otp_hash = ?, reset_otp_expires = ? WHERE id = ?",
      [otpHash, expiresAt, id],
    );
    return result.affectedRows > 0;
  }

  // Clear password reset OTP
  static async clearPasswordResetOtp(id) {
    const [result] = await pool.execute(
      "UPDATE users SET reset_otp_hash = NULL, reset_otp_expires = NULL WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  }

  // Save refresh token hash and expiry
  static async setRefreshToken(id, tokenHash, expiresAt) {
    const [result] = await pool.execute(
      "UPDATE users SET refresh_token_hash = ?, refresh_token_expires = ? WHERE id = ?",
      [tokenHash, expiresAt, id],
    );
    return result.affectedRows > 0;
  }

  // Clear refresh token
  static async clearRefreshToken(id) {
    const [result] = await pool.execute(
      "UPDATE users SET refresh_token_hash = NULL, refresh_token_expires = NULL WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  }

  // Find user by refresh token hash
  static async findByRefreshTokenHash(tokenHash) {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE refresh_token_hash = ?",
      [tokenHash],
    );
    return rows[0];
  }
}

module.exports = User;
