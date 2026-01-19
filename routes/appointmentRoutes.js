const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const appointmentController = require("../controllers/appointmentController");
const {
  authenticate,
  authorize,
  isAdmin,
  isDoctor,
  isPatient,
} = require("../middleware/auth");
const validate = require("../middleware/validate");

// Validation rules
const createAppointmentValidation = [
  body("doctor_id").isInt().withMessage("Valid doctor ID is required"),
  body("appointment_date")
    .isDate()
    .withMessage("Valid date is required (YYYY-MM-DD)"),
  body("appointment_time")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage("Valid time is required (HH:MM)"),
];

const updateStatusValidation = [
  body("status")
    .isIn(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"])
    .withMessage("Invalid status"),
];

// All routes require authentication
router.use(authenticate);

// Patient routes
router.post(
  "/",
  isPatient,
  createAppointmentValidation,
  validate,
  appointmentController.createAppointment,
);
router.get(
  "/my-appointments",
  isPatient,
  appointmentController.getMyAppointments,
);
router.put("/:id/cancel", isPatient, appointmentController.cancelAppointment);

// Doctor routes
router.get(
  "/doctor-appointments",
  isDoctor,
  appointmentController.getDoctorAppointments,
);

// Admin routes
router.get("/", isAdmin, appointmentController.getAllAppointments);
router.get("/date/:date", isAdmin, appointmentController.getAppointmentsByDate);
router.get(
  "/status/:status",
  isAdmin,
  appointmentController.getAppointmentsByStatus,
);

// Doctor and Admin routes
router.put(
  "/:id/status",
  authorize("DOCTOR", "ADMIN"),
  updateStatusValidation,
  validate,
  appointmentController.updateAppointmentStatus,
);

// Get single appointment (accessible by patient, doctor, admin)
router.get("/:id", appointmentController.getAppointmentById);

module.exports = router;

//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJkb2N0b3JAdGVzdC5jb20iLCJyb2xlIjoiRE9DVE9SIiwiaWF0IjoxNzY4ODM0OTgxLCJleHAiOjE3Njk0Mzk3ODF9.0o788QJL6rlN-utyMrsyR9mWe0YnLRpko2JAlognfEg"
