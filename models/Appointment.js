const { pool } = require("../config/db");

class Appointment {
  // Create appointment
  static async create(appointmentData) {
    const {
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      reason,
    } = appointmentData;

    const [result] = await pool.execute(
      "INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason) VALUES (?, ?, ?, ?, ?)",
      [
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        reason || null,
      ],
    );
    return result.insertId;
  }

  // Find appointment by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
                    u_patient.name as patient_name, u_patient.email as patient_email, u_patient.phone as patient_phone,
                    u_doctor.name as doctor_name, u_doctor.email as doctor_email,
                    d.specialization, d.consultation_fee
             FROM appointments a
             JOIN users u_patient ON a.patient_id = u_patient.id
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users u_doctor ON d.user_id = u_doctor.id
             WHERE a.id = ?`,
      [id],
    );
    return rows[0];
  }

  // Get appointments by patient ID
  static async findByPatientId(patientId) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
                    u_doctor.name as doctor_name, u_doctor.email as doctor_email,
                    d.specialization, d.consultation_fee
             FROM appointments a
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users u_doctor ON d.user_id = u_doctor.id
             WHERE a.patient_id = ?
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patientId],
    );
    return rows;
  }

  // Get appointments by doctor ID
  static async findByDoctorId(doctorId) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
                    u_patient.name as patient_name, u_patient.email as patient_email, u_patient.phone as patient_phone
             FROM appointments a
             JOIN users u_patient ON a.patient_id = u_patient.id
             WHERE a.doctor_id = ?
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [doctorId],
    );
    return rows;
  }

  // Get all appointments (Admin)
  static async findAll() {
    const [rows] = await pool.execute(
      `SELECT a.*, 
                    u_patient.name as patient_name, u_patient.email as patient_email,
                    u_doctor.name as doctor_name, u_doctor.email as doctor_email,
                    d.specialization
             FROM appointments a
             JOIN users u_patient ON a.patient_id = u_patient.id
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users u_doctor ON d.user_id = u_doctor.id
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    );
    return rows;
  }

  // Update appointment status
  static async updateStatus(id, status) {
    const [result] = await pool.execute(
      "UPDATE appointments SET status = ? WHERE id = ?",
      [status, id],
    );
    return result.affectedRows > 0;
  }

  // Update appointment
  static async update(id, appointmentData) {
    const { appointment_date, appointment_time, reason, status } =
      appointmentData;
    const [result] = await pool.execute(
      "UPDATE appointments SET appointment_date = ?, appointment_time = ?, reason = ?, status = ? WHERE id = ?",
      [appointment_date, appointment_time, reason, status, id],
    );
    return result.affectedRows > 0;
  }

  // Delete appointment
  static async delete(id) {
    const [result] = await pool.execute(
      "DELETE FROM appointments WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  }

  // Delete appointments by patient ID
  static async deleteByPatientId(patientId) {
    const [result] = await pool.execute(
      "DELETE FROM appointments WHERE patient_id = ?",
      [patientId],
    );
    return result.affectedRows;
  }

  // Delete appointments by doctor ID
  static async deleteByDoctorId(doctorId) {
    const [result] = await pool.execute(
      "DELETE FROM appointments WHERE doctor_id = ?",
      [doctorId],
    );
    return result.affectedRows;
  }

  // Get appointments by date
  static async findByDate(date) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
                    u_patient.name as patient_name,
                    u_doctor.name as doctor_name,
                    d.specialization
             FROM appointments a
             JOIN users u_patient ON a.patient_id = u_patient.id
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users u_doctor ON d.user_id = u_doctor.id
             WHERE a.appointment_date = ?
             ORDER BY a.appointment_time`,
      [date],
    );
    return rows;
  }

  // Get appointments by status
  static async findByStatus(status) {
    const [rows] = await pool.execute(
      `SELECT a.*, 
                    u_patient.name as patient_name,
                    u_doctor.name as doctor_name,
                    d.specialization
             FROM appointments a
             JOIN users u_patient ON a.patient_id = u_patient.id
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users u_doctor ON d.user_id = u_doctor.id
             WHERE a.status = ?
             ORDER BY a.appointment_date DESC`,
      [status],
    );
    return rows;
  }

  // Check for conflicting appointment
  static async checkConflict(doctorId, date, time, excludeId = null) {
    let query = `SELECT * FROM appointments 
                     WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'CANCELLED'`;
    const params = [doctorId, date, time];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  }
}

module.exports = Appointment;
