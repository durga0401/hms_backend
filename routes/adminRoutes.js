const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const adminController = require("../controllers/adminController");
const { authenticate, isAdmin } = require("../middleware/auth");
const validate = require("../middleware/validate");

// Validation rules
const createUserValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role").isIn(["PATIENT", "DOCTOR", "ADMIN"]).withMessage("Invalid role"),
];

const notificationValidation = [
  body("user_id").isInt().withMessage("Valid user ID is required"),
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
];

const broadcastValidation = [
  body("role").isIn(["PATIENT", "DOCTOR", "ADMIN"]).withMessage("Invalid role"),
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
];

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Dashboard
router.get("/dashboard", adminController.getDashboardStats);
router.get("/appointments/recent", adminController.getRecentAppointments);

// User management
router.post(
  "/users",
  createUserValidation,
  validate,
  adminController.createUser
);

// Notifications
router.post(
  "/notifications",
  notificationValidation,
  validate,
  adminController.sendNotification
);
router.post(
  "/notifications/broadcast",
  broadcastValidation,
  validate,
  adminController.sendBroadcastNotification
);

module.exports = router;
