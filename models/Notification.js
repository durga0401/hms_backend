const { pool } = require("../config/db");

class Notification {
  // Create notification
  static async create(notificationData) {
    const { user_id, title, message, type } = notificationData;

    const [result] = await pool.execute(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
      [user_id, title, message, type || "APPOINTMENT"]
    );
    return result.insertId;
  }

  // Get notifications by user ID
  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }

  // Get unread notifications by user ID
  static async findUnreadByUserId(userId) {
    const [rows] = await pool.execute(
      "SELECT * FROM notifications WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }

  // Get notification by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      "SELECT * FROM notifications WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  // Mark notification as read
  static async markAsRead(id) {
    const [result] = await pool.execute(
      "UPDATE notifications SET is_read = TRUE WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    const [result] = await pool.execute(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
      [userId]
    );
    return result.affectedRows;
  }

  // Delete notification
  static async delete(id) {
    const [result] = await pool.execute(
      "DELETE FROM notifications WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  // Delete all notifications for a user
  static async deleteAllByUserId(userId) {
    const [result] = await pool.execute(
      "DELETE FROM notifications WHERE user_id = ?",
      [userId]
    );
    return result.affectedRows;
  }

  // Get unread count
  static async getUnreadCount(userId) {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId]
    );
    return rows[0].count;
  }

  // Create notification for multiple users
  static async createForMultipleUsers(userIds, title, message, type) {
    const values = userIds.map((userId) => [
      userId,
      title,
      message,
      type || "SYSTEM",
    ]);
    const placeholders = values.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = values.flat();

    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ${placeholders}`,
      flatValues
    );
    return result.affectedRows;
  }
}

module.exports = Notification;
