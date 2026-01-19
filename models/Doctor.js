const { pool } = require("../config/db");

class Doctor {
  // Create doctor profile
  static async create(doctorData) {
    const {
      user_id,
      specialization,
      experience,
      qualification,
      consultation_fee,
    } = doctorData;

    const [result] = await pool.execute(
      "INSERT INTO doctors (user_id, specialization, experience, qualification, consultation_fee) VALUES (?, ?, ?, ?, ?)",
      [
        user_id,
        specialization || null,
        experience || null,
        qualification || null,
        consultation_fee || null,
      ]
    );
    return result.insertId;
  }

  // Find doctor by user ID
  static async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT d.*, u.name, u.email, u.phone 
             FROM doctors d 
             JOIN users u ON d.user_id = u.id 
             WHERE d.user_id = ?`,
      [userId]
    );
    return rows[0];
  }

  // Find doctor by doctor ID
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT d.*, u.name, u.email, u.phone 
             FROM doctors d 
             JOIN users u ON d.user_id = u.id 
             WHERE d.id = ?`,
      [id]
    );
    return rows[0];
  }

  // Get all doctors
  static async findAll() {
    const [rows] = await pool.execute(
      `SELECT d.*, u.name, u.email, u.phone 
             FROM doctors d 
             JOIN users u ON d.user_id = u.id`
    );
    return rows;
  }

  // Get doctors by specialization
  static async findBySpecialization(specialization) {
    const [rows] = await pool.execute(
      `SELECT d.*, u.name, u.email, u.phone 
             FROM doctors d 
             JOIN users u ON d.user_id = u.id 
             WHERE d.specialization LIKE ?`,
      [`%${specialization}%`]
    );
    return rows;
  }

  // Update doctor profile
  static async update(id, doctorData) {
    const { specialization, experience, qualification, consultation_fee } =
      doctorData;
    const [result] = await pool.execute(
      "UPDATE doctors SET specialization = ?, experience = ?, qualification = ?, consultation_fee = ? WHERE id = ?",
      [specialization, experience, qualification, consultation_fee, id]
    );
    return result.affectedRows > 0;
  }

  // Delete doctor
  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM doctors WHERE id = ?", [
      id,
    ]);
    return result.affectedRows > 0;
  }
}

module.exports = Doctor;
