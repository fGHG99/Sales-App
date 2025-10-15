import { PrismaClient } from "@prisma/client";
import winston from "winston";

const prisma = new PrismaClient();

// ============================================
// WINSTON LOGGER CONFIGURATION
// ============================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "sales-app-audit" },
  transports: [
    // Console transport untuk development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
          return `${timestamp} [${level}] ${message} ${metaStr}`;
        })
      ),
    }),
    // File transport untuk audit logs
    new winston.transports.File({
      filename: "logs/audit.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport untuk error logs
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sanitize data untuk menghapus sensitive information
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== "object") return data;

  const sanitized = { ...data };
  const sensitiveFields = [
    "password",
    "verifyToken",
    "refreshToken",
    "accessToken",
  ];

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      delete sanitized[field];
    }
  });

  return sanitized;
};

/**
 * Truncate data jika terlalu besar untuk performa
 */
const truncateData = (data, maxLength = 5000) => {
  const jsonStr = JSON.stringify(data);
  if (jsonStr.length > maxLength) {
    return {
      ...data,
      _truncated: true,
      _originalLength: jsonStr.length,
    };
  }
  return data;
};

// ============================================
// CORE AUDIT LOGGING FUNCTION
// ============================================

export const log = async (
  action,
  entity,
  entityId,
  oldValues = null,
  newValues = null,
  userId = null
) => {
  const auditData = {
    action,
    entity,
    entityId: String(entityId),
    oldValues: oldValues ? sanitizeData(truncateData(oldValues)) : null,
    newValues: newValues ? sanitizeData(truncateData(newValues)) : null,
    userId,
    timestamp: new Date().toISOString(),
  };

  try {
    // Log ke Winston immediately (backup & monitoring)
    logger.info("Audit Log", auditData);

    // Fire-and-forget database logging
    // Menggunakan setImmediate untuk tidak block event loop
    setImmediate(async () => {
      try {
        await prisma.auditLog.create({
          data: {
            action,
            entity,
            entityId: String(entityId),
            oldValues: auditData.oldValues,
            newValues: auditData.newValues,
            userId,
          },
        });
      } catch (dbError) {
        // Jika database gagal, tetap ada backup di Winston logs
        logger.error("Failed to save audit log to database", {
          error: dbError.message,
          auditData,
        });
      }
    });
  } catch (error) {
    // Catch semua error agar tidak crash aplikasi
    logger.error("Audit logging error", {
      error: error.message,
      auditData,
    });
  }
};

// ============================================
// ACTION-SPECIFIC LOGGING FUNCTIONS
// ============================================

export const logCreate = async (entity, entityId, newValues, userId = null) => {
  return log("CREATE", entity, entityId, null, newValues, userId);
};

export const logUpdate = async (
  entity,
  entityId,
  oldValues,
  newValues,
  userId = null
) => {
  return log("UPDATE", entity, entityId, oldValues, newValues, userId);
};

export const logDelete = async (entity, entityId, oldValues, userId = null) => {
  return log("DELETE", entity, entityId, oldValues, null, userId);
};

export const logLogin = async (userId, metadata = {}) => {
  return log("LOGIN", "User", userId, null, metadata, userId);
};

export const logLogout = async (userId, metadata = {}) => {
  return log("LOGOUT", "User", userId, null, metadata, userId);
};

export const logOther = async (
  entity,
  entityId,
  description,
  userId = null
) => {
  return log("OTHER", entity, entityId, null, { description }, userId);
};

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Get audit logs dengan filter
 */
export const getAuditLogs = async (filters = {}) => {
  const {
    userId,
    entity,
    action,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filters;

  const where = {};
  if (userId) where.userId = userId;
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  return await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
};

/**
 * Get total count of audit logs dengan filter yang sama
 */
export const getAuditLogsCount = async (filters = {}) => {
  const { userId, entity, action, startDate, endDate } = filters;

  const where = {};
  if (userId) where.userId = userId;
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  return await prisma.auditLog.count({ where });
};

/**
 * Get user activity history
 */
export const getUserActivity = async (userId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await prisma.auditLog.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Get entity change history
 */
export const getEntityHistory = async (entity, entityId) => {
  return await prisma.auditLog.findMany({
    where: {
      entity,
      entityId: String(entityId),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Get Winston logger instance untuk custom logging
 */
export const getLogger = () => logger;

// ============================================
// EXPORTS
// ============================================

export default {
  log,
  logCreate,
  logUpdate,
  logDelete,
  logLogin,
  logLogout,
  logOther,
  getAuditLogs,
  getAuditLogsCount,
  getUserActivity,
  getEntityHistory,
  getLogger,
};
