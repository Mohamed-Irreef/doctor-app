const AuditLog = require("../models/AuditLog");
const { logError } = require("../utils/logger");

async function logAuditEvent({
  entityType,
  entityId,
  action,
  performedBy,
  performedByRole,
  metadata,
}) {
  if (!entityType || !entityId || !action) {
    return null;
  }

  try {
    return await AuditLog.create({
      entityType,
      entityId: String(entityId),
      action,
      performedBy: performedBy || undefined,
      performedByRole: performedByRole || undefined,
      metadata: metadata || {},
      timestamp: new Date(),
    });
  } catch (error) {
    logError("audit_log_write_failed", error, {
      entityType,
      entityId,
      action,
    });
    return null;
  }
}

module.exports = {
  logAuditEvent,
};
