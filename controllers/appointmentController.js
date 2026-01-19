const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const DoctorAvailability = require("../models/DoctorAvailability");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Create appointment (Patient only)
exports.createAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;
    const patient_id = req.user.id;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Check for conflicting appointment
    const hasConflict = await Appointment.checkConflict(
      doctor_id,
      appointment_date,
      appointment_time
    );
    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    // Check if slot is available
    const slot = await DoctorAvailability.findSlot(
      doctor_id,
      appointment_date,
      appointment_time
    );
    if (slot && slot.is_booked) {
      return res.status(400).json({
        success: false,
        message: "This time slot is not available",
      });
    }

    // Create appointment
    const appointmentId = await Appointment.create({
      patient_id,
      doctor_id,
      appointment_date,
      appointment_time,
      reason,
    });

    // Mark slot as booked if exists
    if (slot) {
      await DoctorAvailability.updateBookingStatus(slot.id, true);
    }

    // Create notification for doctor
    await Notification.create({
      user_id: doctor.user_id,
      title: "New Appointment Request",
      message: `You have a new appointment request for ${appointment_date} at ${appointment_time}`,
      type: "APPOINTMENT",
    });

    const appointment = await Appointment.findById(appointmentId);

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create appointment",
      error: error.message,
    });
  }
};

// Get patient's appointments
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findByPatientId(req.user.id);

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get appointments",
      error: error.message,
    });
  }
};

// Get doctor's appointments
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findByUserId(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const appointments = await Appointment.findByDoctorId(doctor.id);

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get appointments",
      error: error.message,
    });
  }
};

// Get all appointments (Admin only)
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll();

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get appointments",
      error: error.message,
    });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check authorization
    const doctor = await Doctor.findByUserId(req.user.id);
    const doctorId = doctor ? doctor.id : null;

    if (
      req.user.role !== "ADMIN" &&
      appointment.patient_id !== req.user.id &&
      appointment.doctor_id !== doctorId
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this appointment",
      });
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get appointment",
      error: error.message,
    });
  }
};

// Update appointment status (Doctor or Admin)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check authorization for doctors
    if (req.user.role === "DOCTOR") {
      const doctor = await Doctor.findByUserId(req.user.id);
      if (appointment.doctor_id !== doctor.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this appointment",
        });
      }
    }

    await Appointment.updateStatus(appointmentId, status);

    // If cancelled, free up the slot
    if (status === "CANCELLED") {
      const slot = await DoctorAvailability.findSlot(
        appointment.doctor_id,
        appointment.appointment_date,
        appointment.appointment_time
      );
      if (slot) {
        await DoctorAvailability.updateBookingStatus(slot.id, false);
      }
    }

    // Create notification for patient
    await Notification.create({
      user_id: appointment.patient_id,
      title: "Appointment Status Updated",
      message: `Your appointment on ${
        appointment.appointment_date
      } has been ${status.toLowerCase()}`,
      type: "APPOINTMENT",
    });

    const updatedAppointment = await Appointment.findById(appointmentId);

    res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: updatedAppointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
      error: error.message,
    });
  }
};

// Cancel appointment (Patient - own appointments only)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if patient owns this appointment
    if (appointment.patient_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this appointment",
      });
    }

    if (appointment.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    if (appointment.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed appointment",
      });
    }

    await Appointment.updateStatus(appointmentId, "CANCELLED");

    // Free up the slot
    const slot = await DoctorAvailability.findSlot(
      appointment.doctor_id,
      appointment.appointment_date,
      appointment.appointment_time
    );
    if (slot) {
      await DoctorAvailability.updateBookingStatus(slot.id, false);
    }

    // Notify doctor
    const doctor = await Doctor.findById(appointment.doctor_id);
    await Notification.create({
      user_id: doctor.user_id,
      title: "Appointment Cancelled",
      message: `Appointment on ${appointment.appointment_date} at ${appointment.appointment_time} has been cancelled by patient`,
      type: "APPOINTMENT",
    });

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error.message,
    });
  }
};

// Get appointments by date (Admin)
exports.getAppointmentsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const appointments = await Appointment.findByDate(date);

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get appointments",
      error: error.message,
    });
  }
};

// Get appointments by status (Admin)
exports.getAppointmentsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const appointments = await Appointment.findByStatus(status.toUpperCase());

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get appointments",
      error: error.message,
    });
  }
};
