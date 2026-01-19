const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Notification = require("../models/Notification");
const { pool } = require("../config/db");

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const [userCounts] = await pool.execute(`
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        `);

    const [appointmentCounts] = await pool.execute(`
            SELECT status, COUNT(*) as count 
            FROM appointments 
            GROUP BY status
        `);

    const [todayAppointments] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM appointments 
            WHERE appointment_date = CURDATE()
        `);

    const stats = {
      users: {
        total: 0,
        patients: 0,
        doctors: 0,
        admins: 0,
      },
      appointments: {
        total: 0,
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        completed: 0,
        today: todayAppointments[0].count,
      },
    };

    userCounts.forEach((row) => {
      stats.users.total += row.count;
      stats.users[row.role.toLowerCase() + "s"] = row.count;
    });

    appointmentCounts.forEach((row) => {
      stats.appointments.total += row.count;
      stats.appointments[row.status.toLowerCase()] = row.count;
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats",
      error: error.message,
    });
  }
};

// Create user (Admin can create any role)
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      specialization,
      experience,
      qualification,
      consultation_fee,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create user
    const userId = await User.create({ name, email, password, role, phone });

    // If creating a doctor, create doctor profile
    if (role === "DOCTOR") {
      await Doctor.create({
        user_id: userId,
        specialization,
        experience,
        qualification,
        consultation_fee,
      });
    }

    const user = await User.findById(userId);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

// Send notification to user (Admin)
exports.sendNotification = async (req, res) => {
  try {
    const { user_id, title, message, type } = req.body;

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const notificationId = await Notification.create({
      user_id,
      title,
      message,
      type: type || "ADMIN",
    });

    const notification = await Notification.findById(notificationId);

    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

// Send notification to all users of a role
exports.sendBroadcastNotification = async (req, res) => {
  try {
    const { role, title, message, type } = req.body;

    const users = await User.findByRole(role);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found with this role",
      });
    }

    const userIds = users.map((user) => user.id);
    const count = await Notification.createForMultipleUsers(
      userIds,
      title,
      message,
      type || "ADMIN"
    );

    res.status(201).json({
      success: true,
      message: `Notification sent to ${count} users`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send notifications",
      error: error.message,
    });
  }
};

// Get recent appointments
exports.getRecentAppointments = async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    const [appointments] = await pool.execute(
      `
            SELECT a.*, 
                   u_patient.name as patient_name,
                   u_doctor.name as doctor_name,
                   d.specialization
            FROM appointments a
            JOIN users u_patient ON a.patient_id = u_patient.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u_doctor ON d.user_id = u_doctor.id
            ORDER BY a.created_at DESC
            LIMIT ?
        `,
      [parseInt(limit)]
    );

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get recent appointments",
      error: error.message,
    });
  }
};
