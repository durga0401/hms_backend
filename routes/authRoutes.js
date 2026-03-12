const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { passport } = require("../config/passport");
const { logAuthEvent } = require("../utils/auditLogger");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

// Note: CSRF protection is not needed because we use JWT tokens sent via
// Authorization header (not cookies). CSRF attacks exploit automatic cookie
// submission, which doesn't apply to our localStorage + header-based auth.

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

const verifyOtpValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric"),
];

// Routes
// CSRF token endpoint - returns a simple token for legacy compatibility
router.get("/csrf-token", (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  res.status(200).json({
    success: true,
    csrfToken,
  });
});

// Registration with OTP verification
router.post(
  "/register/send-otp",
  otpLimiter,
  registerValidation,
  validate,
  authController.sendRegistrationOtp,
);
router.post(
  "/register/verify-otp",
  otpLimiter,
  verifyOtpValidation,
  validate,
  authController.verifyRegistrationOtp,
);
router.post(
  "/register/resend-otp",
  otpLimiter,
  [body("email").isEmail().withMessage("Valid email is required")],
  validate,
  authController.resendRegistrationOtp,
);

// Legacy register (for backward compatibility)
router.post(
  "/register",
  loginLimiter,
  registerValidation,
  validate,
  authController.register,
);
router.post(
  "/login",
  loginLimiter,
  loginValidation,
  validate,
  authController.login,
);
router.get("/profile", authenticate, authController.getProfile);
router.put("/profile", authenticate, authController.updateProfile);
router.put(
  "/change-password",
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword,
);
router.post("/logout", authenticate, authController.logout);
router.post(
  "/forgot-password",
  otpLimiter,
  forgotPasswordValidation,
  validate,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  otpLimiter,
  resetPasswordValidation,
  validate,
  authController.resetPassword,
);
router.post("/refresh", loginLimiter, authController.refreshToken);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false, // Don't use sessions for OAuth
    failureRedirect: "/login?error=oauth_failed",
  }),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        throw new Error("User not found");
      }

      // Generate JWT token directly
      const tokens = await authController.issueAuthTokens(user, res);
      
      // Redirect to frontend with token in URL (will be stored in localStorage)
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendURL}/oauth-callback?token=${tokens.token}`);
      
      logAuthEvent({
        event: "google_oauth_callback",
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        success: true,
      });
    } catch (error) {
      logAuthEvent({
        event: "google_oauth_callback",
        ip: req.ip,
        userAgent: req.get("user-agent"),
        success: false,
        details: error.message,
      });
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendURL}/login?error=oauth_failed`);
    }
  },
);

// OAuth session endpoint - deprecated but kept for backward compatibility
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

    const tokens = await authController.issueAuthTokens(user, res);
    req.session.oauth = null;

    res.status(200).json({
      success: true,
      data: {
        user,
        token: tokens.token, // Include token for localStorage
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
