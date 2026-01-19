const Doctor = require("../models/Doctor");
const DoctorAvailability = require("../models/DoctorAvailability");
const User = require("../models/User");
const Appointment = require("../models/Appointment");

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll();
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get doctors",
      error: error.message,
    });
  }
};

// Create doctor (Admin only)
exports.createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      experience,
      qualification,
      consultation_fee,
    } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const userId = await User.create({
      name,
      email,
      password,
      role: "DOCTOR",
      phone,
    });

    const doctorId = await Doctor.create({
      user_id: userId,
      specialization,
      experience,
      qualification,
      consultation_fee,
    });

    const doctor = await Doctor.findById(doctorId);

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create doctor",
      error: error.message,
    });
  }
};

// Get doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get doctor",
      error: error.message,
    });
  }
};

// Get doctors by specialization
exports.getDoctorsBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;
    const doctors = await Doctor.findBySpecialization(specialization);

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get doctors",
      error: error.message,
    });
  }
};

// Update doctor (Admin only)
exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      specialization,
      experience,
      qualification,
      consultation_fee,
    } = req.body;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (name || phone) {
      await User.update(doctor.user_id, {
        name: name ?? doctor.name,
        phone: phone ?? doctor.phone,
      });
    }

    await Doctor.update(id, {
      specialization: specialization ?? doctor.specialization,
      experience: experience ?? doctor.experience,
      qualification: qualification ?? doctor.qualification,
      consultation_fee: consultation_fee ?? doctor.consultation_fee,
    });

    const updatedDoctor = await Doctor.findById(id);

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      data: updatedDoctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update doctor",
      error: error.message,
    });
  }
};

// Delete doctor (Admin only)
exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    await Appointment.deleteByDoctorId(doctor.id);
    await User.delete(doctor.user_id);

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete doctor",
      error: error.message,
    });
  }
};

// Update doctor profile (Doctor only - own profile)
exports.updateDoctorProfile = async (req, res) => {
  try {
    const { specialization, experience, qualification, consultation_fee } =
      req.body;

    // Get doctor by user ID
    const doctor = await Doctor.findByUserId(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    await Doctor.update(doctor.id, {
      specialization,
      experience,
      qualification,
      consultation_fee,
    });

    const updatedDoctor = await Doctor.findById(doctor.id);

    res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      data: updatedDoctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update doctor profile",
      error: error.message,
    });
  }
};

// Get doctor's own profile
exports.getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findByUserId(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get doctor profile",
      error: error.message,
    });
  }
};

// Add availability slots
exports.addAvailability = async (req, res) => {
  try {
    const { available_date, start_time, end_time } = req.body;

    // Get doctor by user ID
    const doctor = await Doctor.findByUserId(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const slotId = await DoctorAvailability.create({
      doctor_id: doctor.id,
      available_date,
      start_time,
      end_time,
    });

    const slot = await DoctorAvailability.findById(slotId);

    res.status(201).json({
      success: true,
      message: "Availability added successfully",
      data: slot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add availability",
      error: error.message,
    });
  }
};

// Add multiple availability slots
exports.addMultipleAvailability = async (req, res) => {
  try {
    const { slots } = req.body;

    // Get doctor by user ID
    const doctor = await Doctor.findByUserId(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const count = await DoctorAvailability.createMultiple(doctor.id, slots);

    res.status(201).json({
      success: true,
      message: `${count} availability slots added successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add availability slots",
      error: error.message,
    });
  }
};

// Get doctor's availability
exports.getMyAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findByUserId(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const availability = await DoctorAvailability.findByDoctorId(doctor.id);

    res.status(200).json({
      success: true,
      count: availability.length,
      data: availability,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get availability",
      error: error.message,
    });
  }
};

// Get doctor's available slots (for patients)
exports.getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.params.id || req.params.doctorId;
    const availability =
      await DoctorAvailability.findAvailableByDoctorId(doctorId);

    res.status(200).json({
      success: true,
      count: availability.length,
      data: availability,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get doctor availability",
      error: error.message,
    });
  }
};

// Delete availability slot
exports.deleteAvailability = async (req, res) => {
  try {
    const { slotId } = req.params;

    const slot = await DoctorAvailability.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Availability slot not found",
      });
    }

    // Verify the slot belongs to this doctor
    const doctor = await Doctor.findByUserId(req.user.id);
    if (slot.doctor_id !== doctor.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this slot",
      });
    }

    if (slot.is_booked) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a booked slot",
      });
    }

    await DoctorAvailability.delete(slotId);

    res.status(200).json({
      success: true,
      message: "Availability slot deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete availability slot",
      error: error.message,
    });
  }
};
