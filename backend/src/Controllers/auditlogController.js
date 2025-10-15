import router from "../../utils/express.js";
import { authenticate, authorize } from "../Middlewares/accessControl.js";
import {
  getAuditLogs,
  getAuditLogsCount,
  getUserActivity,
  getEntityHistory,
} from "../../utils/auditlog.js";

// ==================== AUDIT LOG QUERIES ====================

/**
 * GET /audit-logs
 * Get all audit logs with optional filters
 * Requires superadmin role
 *
 * Query params:
 *  - userId: Filter by specific user ID
 *  - entity: Filter by entity type (User, Order, Store, etc.)
 *  - action: Filter by action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, OTHER)
 *  - startDate: Filter from date (ISO string)
 *  - endDate: Filter to date (ISO string)
 *  - limit: Number of records to return (default: 50, max: 200)
 *  - page: Page number for pagination (default: 1)
 */
router.get("/audit-logs", authenticate, async (req, res) => {
  try {
    // Check if user has superadmin role
    if (!req.user.role?.roleType || req.user.role.roleType !== "itsupport") {
      return res.status(403).json({
        success: false,
        error: "Access denied. IT Support role required.",
      });
    }

    const {
      userId,
      entity,
      action,
      startDate,
      endDate,
      limit = 50,
      page = 1,
    } = req.query;

    // Validate limit
    const parsedLimit = Math.min(parseInt(limit) || 50, 200);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    // Build filters for query
    const queryFilters = {
      userId,
      entity,
      action,
      startDate,
      endDate,
    };

    // Get total count of records matching filters (without limit)
    const totalRecords = await getAuditLogsCount(queryFilters);

    // Build filters for paginated data
    const paginatedFilters = {
      ...queryFilters,
      limit: parsedLimit,
      offset: offset,
    };

    // Get paginated audit logs
    const auditLogs = await getAuditLogs(paginatedFilters);

    // Calculate pagination info
    const totalPages = Math.ceil(totalRecords / parsedLimit);
    const hasNextPage = parsedPage < totalPages;
    const hasPrevPage = parsedPage > 1;

    return res.json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          currentPage: parsedPage,
          totalPages,
          totalRecords,
          limit: parsedLimit,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          userId: userId || null,
          entity: entity || null,
          action: action || null,
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /audit-logs/user/:userId
 * Get activity history for a specific user
 * Requires superadmin role
 *
 * Query params:
 *  - days: Number of days to look back (default: 30, max: 365)
 */
router.get("/audit-logs/user/:userId", authenticate, async (req, res) => {
  try {
    // Check if user has superadmin role
    if (!req.user.role?.roleType || req.user.role.roleType !== "itsupport") {
      return res.status(403).json({
        success: false,
        error: "Access denied. IT Support role required.",
      });
    }

    const { userId } = req.params;
    const { days = 30 } = req.query;

    // Validate days parameter
    const parsedDays = Math.min(Math.max(parseInt(days) || 30, 1), 365);

    // Get user activity
    const userActivity = await getUserActivity(userId, parsedDays);

    return res.json({
      success: true,
      data: {
        userId,
        days: parsedDays,
        activityCount: userActivity.length,
        activities: userActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

/**
 * GET /audit-logs/entity/:entity/:entityId
 * Get change history for a specific entity
 * Requires superadmin role
 */
router.get(
  "/audit-logs/entity/:entity/:entityId",
  authenticate,
  async (req, res) => {
    try {
      // Check if user has superadmin role
      if (!req.user.role?.roleType || req.user.role.roleType !== "itsupport") {
        return res.status(403).json({
          success: false,
          error: "Access denied. IT Support role required.",
        });
      }

      const { entity, entityId } = req.params;

      // Validate entity parameter
      const validEntities = [
        "User",
        "Order",
        "Store",
        "Product",
        "Cart",
        "Address",
        "Dispute",
        "DeliveryFeeSettings",
        "Report",
      ];

      if (!validEntities.includes(entity)) {
        return res.status(400).json({
          success: false,
          error: "Invalid entity type",
          validEntities,
        });
      }

      // Get entity history
      const entityHistory = await getEntityHistory(entity, entityId);

      return res.json({
        success: true,
        data: {
          entity,
          entityId,
          historyCount: entityHistory.length,
          history: entityHistory,
        },
      });
    } catch (error) {
      console.error("Error fetching entity history:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  }
);

/**
 * GET /audit-logs/stats
 * Get audit log statistics
 * Requires superadmin role
 */
router.get("/audit-logs/stats", authenticate, async (req, res) => {
  try {
    // Check if user has superadmin role
    if (!req.user.role?.roleType || req.user.role.roleType !== "itsupport") {
      return res.status(403).json({
        success: false,
        error: "Access denied. IT Support role required.",
      });
    }

    const { days = 30 } = req.query;
    const parsedDays = Math.min(Math.max(parseInt(days) || 30, 1), 365);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parsedDays);

    // Get stats for different actions using count function
    const actionStats = await Promise.all([
      getAuditLogsCount({
        action: "CREATE",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      getAuditLogsCount({
        action: "UPDATE",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      getAuditLogsCount({
        action: "DELETE",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      getAuditLogsCount({
        action: "LOGIN",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      getAuditLogsCount({
        action: "LOGOUT",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      getAuditLogsCount({
        action: "OTHER",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    ]);

    // Get entity stats using count function
    const entityStats = await Promise.all([
      getAuditLogsCount({
        entity: "User",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      getAuditLogsCount({
        entity: "Order",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      getAuditLogsCount({
        entity: "Store",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      getAuditLogsCount({
        entity: "Product",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
      getAuditLogsCount({
        entity: "Report",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    ]);

    const stats = {
      period: {
        days: parsedDays,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      actions: {
        CREATE: actionStats[0],
        UPDATE: actionStats[1],
        DELETE: actionStats[2],
        LOGIN: actionStats[3],
        LOGOUT: actionStats[4],
        OTHER: actionStats[5],
      },
      entities: {
        User: entityStats[0],
        Order: entityStats[1],
        Store: entityStats[2],
        Product: entityStats[3],
        Report: entityStats[4],
      },
      total: actionStats.reduce((sum, count) => sum + count, 0),
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching audit log stats:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

export default router;
