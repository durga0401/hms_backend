const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { passport } = require("../config/passport");
const { logAuthEvent } = require("../utils/auditLogger");
const csrf = require("csurf");
const rateLimit = require("express-rate-limit");

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    // Only enable secure cookies if explicitly set (for HTTPS)
    // For HTTP-only deployments, keep this false
    secure: process.env.CSRF_SECURE_COOKIE === "true",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production",
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

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

const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
];

const resetPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

// Routes
router.get("/csrf-token", csrfProtection, (req, res) => {
  res.status(200).json({
    success: true,
    csrfToken: req.csrfToken(),
  });
});
router.post(
  "/register",
  loginLimiter,
  csrfProtection,
  registerValidation,
  validate,
  authController.register,
);
router.post(
  "/login",
  loginLimiter,
  csrfProtection,
  loginValidation,
  validate,
  authController.login,
);
router.get("/profile", authenticate, authController.getProfile);
router.put(
  "/profile",
  authenticate,
  csrfProtection,
  authController.updateProfile,
);
router.put(
  "/change-password",
  authenticate,
  csrfProtection,
  changePasswordValidation,
  validate,
  authController.changePassword,
);
router.post("/logout", authenticate, csrfProtection, authController.logout);
router.post(
  "/forgot-password",
  otpLimiter,
  csrfProtection,
  forgotPasswordValidation,
  validate,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  otpLimiter,
  csrfProtection,
  resetPasswordValidation,
  validate,
  authController.resetPassword,
);
router.post(
  "/refresh",
  loginLimiter,
  csrfProtection,
  authController.refreshToken,
);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: true,
    failureRedirect: "/login?error=oauth_failed",
  }),
  (req, res) => {
    try {
      req.session.oauth = {
        userId: req.user.id,
      };

      // Redirect to frontend without token in URL
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendURL}/oauth-callback`);
    } catch (error) {
      res.redirect("/login?error=oauth_failed");
    }
  },
);

router.get("/oauth-session", async (req, res) => {
  try {
    if (!req.session?.oauth) {
      return res.status(401).json({
        success: false,
        message: "OAuth session not found",
      });
    }

    const { userId } = req.session.oauth;
    const user = await require("../models/User").findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    await authController.issueAuthTokens(user, res);
    req.session.oauth = null;

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
    logAuthEvent({
      event: "oauth_session",
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: true,
    });
  } catch (error) {
    logAuthEvent({
      event: "oauth_session",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: false,
      details: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to complete OAuth session",
      error: error.message,
    });
  }
});

module.exports = router;
