const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const notificationController = require("../controllers/notificationController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const broadcastValidation = [
  body("role").isIn(["PATIENT", "DOCTOR", "ADMIN"]).withMessage("Invalid role"),
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
];

// All routes require authentication
router.use(authenticate);

// Get notifications
router.get("/", notificationController.getMyNotifications);

// Get unread notifications
router.get("/unread", notificationController.getUnreadNotifications);

// Mark all as read
router.put("/read-all", notificationController.markAllAsRead);

// Update notifications
router.put("/:id/read", notificationController.markAsRead);

// Delete notification
router.delete("/:id", notificationController.deleteNotification);

// Broadcast notifications (Admin)
router.post(
  "/broadcast",
  authorize("ADMIN"),
  broadcastValidation,
  validate,
  notificationController.sendBroadcastNotification,
);

module.exports = router;
