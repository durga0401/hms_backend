const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, isAdmin } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.get("/", isAdmin, userController.getAllUsers);
router.get("/role/:role", isAdmin, userController.getUsersByRole);
router.get("/:id", isAdmin, userController.getUserById);
router.put("/:id", isAdmin, userController.updateUser);
router.delete("/:id", isAdmin, userController.deleteUser);

module.exports = router;
