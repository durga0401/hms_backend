const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: error.message,
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: error.message,
    });
  }
};

// Get users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ["PATIENT", "DOCTOR", "ADMIN"];

    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be PATIENT, DOCTOR, or ADMIN",
      });
    }

    const users = await User.findByRole(role.toUpperCase());
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: error.message,
    });
  }
};

// Update user (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.update(userId, { name, phone });
    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    // Clean up related appointments to satisfy FK constraints
    if (user.role === "PATIENT") {
      await Appointment.deleteByPatientId(user.id);
    }

    if (user.role === "DOCTOR") {
      const doctorProfile = await Doctor.findByUserId(user.id);
      if (doctorProfile) {
        await Appointment.deleteByDoctorId(doctorProfile.id);
      }
    }

    await User.delete(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// Get all patients
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await User.findByRole("PATIENT");
    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get patients",
      error: error.message,
    });
  }
};
