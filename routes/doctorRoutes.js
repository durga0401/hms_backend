const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const doctorController = require("../controllers/doctorController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

// Validation rules
const createDoctorValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const updateDoctorValidation = [
  body("name").optional().trim().notEmpty().withMessage("Name is required"),
  body("phone").optional().trim(),
  body("specialization").optional().trim(),
  body("experience").optional().isInt({ min: 0 }),
  body("qualification").optional().trim(),
  body("consultation_fee").optional().isFloat({ min: 0 }),
];

const availabilityValidation = [
  body("available_date")
    .isDate()
    .withMessage("Valid date is required (YYYY-MM-DD)"),
  body("start_time")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage("Valid start time is required (HH:MM)"),
  body("end_time")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage("Valid end time is required (HH:MM)"),
];

// All routes require authentication
router.use(authenticate);

// Doctor availability routes
router.get(
  "/availability",
  authorize("DOCTOR"),
  doctorController.getMyAvailability,
);
router.post(
  "/availability",
  authorize("DOCTOR"),
  availabilityValidation,
  validate,
  doctorController.addAvailability,
);
router.get(
  "/:id/availability",
  authorize("PATIENT"),
  doctorController.getDoctorAvailability,
);

// Patient and Admin routes
router.get("/", authorize("PATIENT", "ADMIN"), doctorController.getAllDoctors);
router.get(
  "/:id",
  authorize("PATIENT", "ADMIN"),
  doctorController.getDoctorById,
);

// Admin routes
router.post(
  "/",
  authorize("ADMIN"),
  createDoctorValidation,
  validate,
  doctorController.createDoctor,
);
router.put(
  "/:id",
  authorize("ADMIN"),
  updateDoctorValidation,
  validate,
  doctorController.updateDoctor,
);
router.delete("/:id", authorize("ADMIN"), doctorController.deleteDoctor);

module.exports = router;
