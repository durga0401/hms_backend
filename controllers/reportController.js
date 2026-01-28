const { pool } = require("../config/db");

// Appointments report (Admin)
exports.getAppointmentsReport = async (req, res) => {
  try {
    const [statusCounts] = await pool.execute(`
      SELECT status, COUNT(*) as count
      FROM appointments
      GROUP BY status
    `);

    const [dailyCounts] = await pool.execute(`
      SELECT appointment_date as date, COUNT(*) as count
      FROM appointments
      GROUP BY appointment_date
      ORDER BY appointment_date DESC
      LIMIT 30
    `);

    res.status(200).json({
      success: true,
      data: {
        statusCounts,
        dailyCounts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get appointments report",
      error: error.message,
    });
  }
};

// Doctors report (Admin)
exports.getDoctorsReport = async (req, res) => {
  try {
    const [doctors] = await pool.execute(`
      SELECT d.id, u.name, u.email, u.phone, d.specialization, d.experience,
             d.qualification, d.consultation_fee
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      ORDER BY u.name
    `);

    const [totalDoctors] = await pool.execute(
      "SELECT COUNT(*) as count FROM doctors",
    );

    res.status(200).json({
      success: true,
      data: {
        total: totalDoctors[0].count,
        doctors,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get doctors report",
      error: error.message,
    });
  }
};

// Patients report (Admin)
exports.getPatientsReport = async (req, res) => {
  try {
    const [patients] = await pool.execute(`
      SELECT id, name, email, phone, created_at
      FROM users
      WHERE role = 'PATIENT'
      ORDER BY created_at DESC
    `);

    const [totalPatients] = await pool.execute(
      "SELECT COUNT(*) as count FROM users WHERE role = 'PATIENT'",
    );

    res.status(200).json({
      success: true,
      data: {
        total: totalPatients[0].count,
        patients,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get patients report",
      error: error.message,
    });
  }
};
