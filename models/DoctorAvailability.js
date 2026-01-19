const { pool } = require("../config/db");

class DoctorAvailability {
  // Create availability slot
  static async create(availabilityData) {
    const { doctor_id, available_date, start_time, end_time } =
      availabilityData;

    const [result] = await pool.execute(
      "INSERT INTO doctor_availability (doctor_id, available_date, start_time, end_time) VALUES (?, ?, ?, ?)",
      [doctor_id, available_date, start_time, end_time]
    );
    return result.insertId;
  }

  // Create multiple slots
  static async createMultiple(doctor_id, slots) {
    const values = slots.map((slot) => [
      doctor_id,
      slot.available_date,
      slot.start_time,
      slot.end_time,
    ]);
    const placeholders = values.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = values.flat();

    const [result] = await pool.execute(
      `INSERT INTO doctor_availability (doctor_id, available_date, start_time, end_time) VALUES ${placeholders}`,
      flatValues
    );
    return result.affectedRows;
  }

  // Get availability by doctor ID
  static async findByDoctorId(doctorId) {
    const [rows] = await pool.execute(
      `SELECT * FROM doctor_availability 
             WHERE doctor_id = ? AND available_date >= CURDATE() 
             ORDER BY available_date, start_time`,
      [doctorId]
    );
    return rows;
  }

  // Get available (not booked) slots by doctor ID
  static async findAvailableByDoctorId(doctorId) {
    const [rows] = await pool.execute(
      `SELECT * FROM doctor_availability 
             WHERE doctor_id = ? AND is_booked = FALSE AND available_date >= CURDATE() 
             ORDER BY available_date, start_time`,
      [doctorId]
    );
    return rows;
  }

  // Get availability by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      "SELECT * FROM doctor_availability WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  // Update booking status
  static async updateBookingStatus(id, isBooked) {
    const [result] = await pool.execute(
      "UPDATE doctor_availability SET is_booked = ? WHERE id = ?",
      [isBooked, id]
    );
    return result.affectedRows > 0;
  }

  // Delete availability slot
  static async delete(id) {
    const [result] = await pool.execute(
      "DELETE FROM doctor_availability WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  // Find slot by doctor, date and time
  static async findSlot(doctorId, date, time) {
    const [rows] = await pool.execute(
      `SELECT * FROM doctor_availability 
             WHERE doctor_id = ? AND available_date = ? AND start_time <= ? AND end_time > ?`,
      [doctorId, date, time, time]
    );
    return rows[0];
  }

  // Get availability by date range
  static async findByDateRange(doctorId, startDate, endDate) {
    const [rows] = await pool.execute(
      `SELECT * FROM doctor_availability 
             WHERE doctor_id = ? AND available_date BETWEEN ? AND ? 
             ORDER BY available_date, start_time`,
      [doctorId, startDate, endDate]
    );
    return rows;
  }
}

module.exports = DoctorAvailability;
