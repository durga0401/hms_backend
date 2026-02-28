const nodemailer = require("nodemailer");

const normalizeEmailPass = () => {
  const rawPass = process.env.EMAIL_PASS || "";
  return rawPass.replace(/\s+/g, "");
};

const getEmailAuth = () => {
  const user = process.env.EMAIL_USER;
  const pass = normalizeEmailPass();

  if (!user || !pass) {
    throw new Error(
      "Email credentials are missing. Set EMAIL_USER and EMAIL_PASS in .env.",
    );
  }

  return { user, pass };
};

const createTransporter = () => {
  const auth = getEmailAuth();

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth,
    });
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth,
  });
};

const transporter = createTransporter();

const sendPasswordResetOtp = async (to, otp, name = "User") => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const subject = "Your password reset OTP";
  const text = `Hello ${name},\n\nYour OTP is: ${otp}\nThis OTP will expire in 10 minutes.\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <p>Hello ${name},</p>
    <p>Your OTP is:</p>
    <h2 style="letter-spacing: 2px;">${otp}</h2>
    <p>This OTP will expire in 10 minutes.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

const sendRegistrationOtp = async (to, otp, name = "User") => {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const subject = "Verify your email - MediCare Registration";
  const text = `Hello ${name},\n\nThank you for registering with MediCare!\n\nYour verification OTP is: ${otp}\nThis OTP will expire in 10 minutes.\n\nIf you did not create an account, you can ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0ea5e9, #7c3aed); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">MediCare</h1>
        <p style="color: rgba(255,255,255,0.9); margin-top: 5px;">Healthcare Management System</p>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Verify Your Email</h2>
        <p style="color: #4b5563;">Hello ${name},</p>
        <p style="color: #4b5563;">Thank you for registering with MediCare! Please use the OTP below to verify your email address:</p>
        <div style="background: #ffffff; border: 2px dashed #0ea5e9; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #0ea5e9; letter-spacing: 8px; margin: 0; font-size: 36px;">${otp}</h1>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This OTP will expire in 10 minutes.</p>
        <p style="color: #6b7280; font-size: 14px;">If you did not create an account, you can safely ignore this email.</p>
      </div>
      <div style="background: #1f2937; padding: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} MediCare. All rights reserved.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendPasswordResetOtp,
  sendRegistrationOtp,
};
