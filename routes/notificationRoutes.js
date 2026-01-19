const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Get notifications
router.get("/", notificationController.getMyNotifications);
router.get("/unread", notificationController.getUnreadNotifications);
router.get("/unread-count", notificationController.getUnreadCount);

// Update notifications
router.put("/:id/read", notificationController.markAsRead);
router.put("/read-all", notificationController.markAllAsRead);

// Delete notifications
router.delete("/:id", notificationController.deleteNotification);
router.delete("/", notificationController.deleteAllNotifications);

module.exports = router;
