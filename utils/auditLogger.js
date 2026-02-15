const AuditLog = require("../models/AuditLog");

const logAuthEvent = ({
  event,
  userId = null,
  email = null,
  ip = null,
  userAgent = null,
  success = true,
  details = null,
}) => {
  AuditLog.create({
    event,
    userId,
    email,
    ip,
    userAgent,
    success,
    details,
  }).catch(() => {
    // Avoid breaking auth flow if audit logging fails
  });
};

module.exports = {
  logAuthEvent,
};
