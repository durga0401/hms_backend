const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { passport, generateTokenForOAuthUser } = require("../config/passport");

// Validation rules
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role").isIn(["PATIENT", "DOCTOR", "ADMIN"]).withMessage("Invalid role"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

// Routes
router.post("/register", registerValidation, validate, authController.register);
router.post("/login", loginValidation, validate, authController.login);
router.get("/profile", authenticate, authController.getProfile);
router.put("/profile", authenticate, authController.updateProfile);
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword,
);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login?error=oauth_failed",
  }),
  (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = generateTokenForOAuthUser(req.user);
      const user = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      };

      // Redirect to frontend with token
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(
        `${frontendURL}/oauth-callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`,
      );
    } catch (error) {
      res.redirect("/login?error=oauth_failed");
    }
  },
);

module.exports = router;
