const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const { sendPasswordResetOtp } = require("../utils/email");
const { logAuthEvent } = require("../utils/auditLogger");

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(48).toString("hex");
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const setRefreshCookie = (res, token) => {
  const days = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 14);
  res.cookie("refresh_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: days * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie("token");
  res.clearCookie("refresh_token");
};

const issueAuthTokens = async (user, res) => {
  const token = generateToken(user);
  const refreshToken = generateRefreshToken();
  const refreshHash = hashToken(refreshToken);
  const refreshExpires = new Date(
    Date.now() +
      Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 14) * 86400000,
  );

  await User.setRefreshToken(user.id, refreshHash, refreshExpires);
  setAuthCookie(res, token);
  setRefreshCookie(res, refreshToken);
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      specialization,
      experience,
      qualification,
      consultation_fee,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create user
    const userId = await User.create({ name, email, password, role, phone });

    // If registering as doctor, create doctor profile
    if (role === "DOCTOR") {
      await Doctor.create({
        user_id: userId,
        specialization,
        experience,
        qualification,
        consultation_fee,
      });
    }

    const user = await User.findById(userId);
    await issueAuthTokens(user, res);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
      },
    });
    logAuthEvent({
      event: "register",
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: true,
    });
  } catch (error) {
    logAuthEvent({
      event: "register",
      email: req.body?.email || null,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: false,
      details: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      logAuthEvent({
        event: "login",
        email,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        success: false,
        details: "User not found",
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      logAuthEvent({
        event: "login",
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        success: false,
        details: "Invalid password",
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    await issueAuthTokens(user, res);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
      },
    });
    logAuthEvent({
      event: "login",
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: true,
    });
  } catch (error) {
    logAuthEvent({
      event: "login",
      email: req.body?.email || null,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: false,
      details: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    let doctorProfile = null;
    if (user.role === "DOCTOR") {
      doctorProfile = await Doctor.findByUserId(user.id);
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        doctorProfile,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    await User.update(req.user.id, { name, phone });
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findByEmail(req.user.email);

    // Verify current password
    const isMatch = await User.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    await User.updatePassword(req.user.id, newPassword);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
    logAuthEvent({
      event: "change_password",
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: true,
    });
  } catch (error) {
    logAuthEvent({
      event: "change_password",
      userId: req.user?.id || null,
      email: req.user?.email || null,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: false,
      details: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

// Request password reset OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists, an OTP has been sent.",
      });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.setPasswordResetOtp(user.id, otpHash, expiresAt);
    await sendPasswordResetOtp(user.email, otp, user.name);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
    });
    logAuthEvent({
      event: "forgot_password",
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: true,
    });
  } catch (error) {
    logAuthEvent({
      event: "forgot_password",
      email: req.body?.email || null,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: false,
      details: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

// Reset password with OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findByEmail(email);

    if (!user || !user.reset_otp_hash || !user.reset_otp_expires) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    if (new Date() > new Date(user.reset_otp_expires)) {
      await User.clearPasswordResetOtp(user.id);
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    const isOtpValid = await bcrypt.compare(otp, user.reset_otp_hash);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await User.updatePassword(user.id, newPassword);
    await User.clearPasswordResetOtp(user.id);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
    logAuthEvent({
      event: "reset_password",
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: true,
    });
  } catch (error) {
    logAuthEvent({
      event: "reset_password",
      email: req.body?.email || null,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: false,
      details: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  if (req.user?.id) {
    await User.clearRefreshToken(req.user.id);
  }
  clearAuthCookie(res);
  req.session?.destroy(() => {});
  logAuthEvent({
    event: "logout",
    userId: req.user?.id || null,
    email: req.user?.email || null,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    success: true,
  });
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

exports.setAuthCookie = setAuthCookie;
exports.setRefreshCookie = setRefreshCookie;
exports.issueAuthTokens = issueAuthTokens;

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const tokenHash = hashToken(refreshToken);
    const authUser = await User.findByRefreshTokenHash(tokenHash);
    if (!authUser || !authUser.refresh_token_hash) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (new Date() > new Date(authUser.refresh_token_expires)) {
      await User.clearRefreshToken(authUser.id);
      return res.status(401).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    await issueAuthTokens(authUser, res);

    res.status(200).json({
      success: true,
      message: "Token refreshed",
    });
    logAuthEvent({
      event: "refresh_token",
      userId: authUser.id,
      email: authUser.email,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: true,
    });
  } catch (error) {
    logAuthEvent({
      event: "refresh_token",
      ip: req.ip,
      userAgent: req.get("user-agent"),
      success: false,
      details: error.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to refresh token",
      error: error.message,
    });
  }
};
