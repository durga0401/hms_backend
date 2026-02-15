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

module.exports = {
  sendPasswordResetOtp,
};
