const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const appointmentController = require("../controllers/appointmentController");
const { authenticate, authorize } = require("../middleware/auth");
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
  authorize("PATIENT"),
  createAppointmentValidation,
  validate,
  appointmentController.createAppointment,
);
router.get(
  "/patient",
  authorize("PATIENT"),
  appointmentController.getMyAppointments,
);

// Doctor routes
router.get(
  "/doctor",
  authorize("DOCTOR"),
  appointmentController.getDoctorAppointments,
);
router.put(
  "/:id/status",
  authorize("DOCTOR"),
  updateStatusValidation,
  validate,
  appointmentController.updateAppointmentStatus,
);

// Admin routes
router.get("/", authorize("ADMIN"), appointmentController.getAllAppointments);

// Patient and Admin routes
router.delete(
  "/:id",
  authorize("PATIENT", "ADMIN"),
  appointmentController.deleteAppointment,
);

module.exports = router;
