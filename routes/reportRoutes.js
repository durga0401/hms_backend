const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticate, authorize } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Admin-only reports
router.get(
  "/appointments",
  authorize("ADMIN"),
  reportController.getAppointmentsReport,
);
router.get("/doctors", authorize("ADMIN"), reportController.getDoctorsReport);
router.get("/patients", authorize("ADMIN"), reportController.getPatientsReport);

module.exports = router;
