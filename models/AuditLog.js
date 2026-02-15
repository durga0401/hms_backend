const { pool } = require("../config/db");

class AuditLog {
  static async create({
    event,
    userId,
    email,
    ip,
    userAgent,
    success,
    details,
  }) {
    const [result] = await pool.execute(
      `
        INSERT INTO audit_logs
          (event, user_id, email, ip_address, user_agent, success, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [event, userId, email, ip, userAgent, success ? 1 : 0, details],
    );
    return result.insertId;
  }
}

module.exports = AuditLog;
