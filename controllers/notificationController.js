const Notification = require("../models/Notification");
const User = require("../models/User");

// Get user's notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findByUserId(req.user.id);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
      error: error.message,
    });
  }
};

// Get user's unread notifications
exports.getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findUnreadByUserId(req.user.id);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get unread notifications",
      error: error.message,
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Check ownership
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await Notification.markAsRead(id);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

// Broadcast notification (Admin only)
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
      type || "ADMIN",
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

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const count = await Notification.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: `${count} notifications marked as read`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Check ownership
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await Notification.delete(id);

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};
