import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate } from "../Middlewares/accessControl.js";

/**
 * Get courier's notifications
 * GET /notifications/courier
 *
 * Query params:
 *  - page (default: 1): Page number
 *  - limit (default: 20): Items per page
 *  - unreadOnly (default: false): Filter only unread notifications
 *
 * Returns all notifications for the authenticated courier user
 * Sorted by newest first with page-based pagination
 */
router.get("/get-all-notifications", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page = 1, unreadOnly = false, type } = req.query;

    console.log("📡 [BACKEND] Courier notifications request:");
    console.log(`   Courier ID: ${userId}`);
    console.log(`   Type filter: ${type || "all"}`);
    console.log(`   Page: ${page}`);
    console.log(`   Limit: ${limit}`);

    // Parse and validate pagination params
    const itemsPerPage = parseInt(limit);
    const currentPage = parseInt(page);
    const skip = (currentPage - 1) * itemsPerPage;

    const whereClause = {
      userId: userId,
      ...(type && type !== "all" ? { type: type } : {}),
    };

    // Filter only unread if requested
    if (unreadOnly === "true") {
      whereClause.hasRead = false;
    }

    console.log("   Where clause:", whereClause);

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      take: itemsPerPage,
      skip: skip,
    });

    // Count total for current filter
    const total = await prisma.notification.count({
      where: whereClause,
    });

    // Count all unread (regardless of type filter)
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        hasRead: false,
      },
    });

    console.log("✅ [BACKEND] User notifications fetched:");
    console.log(`   Found: ${notifications.length} notifications`);
    console.log(`   Total (with filter): ${total}`);
    console.log(`   Unread count: ${unreadCount}`);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / itemsPerPage);
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    return res.status(200).json({
      message: "Notifications retrieved successfully",
      notifications: notifications.map((notif) => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        metadata: notif.metadata,
        hasRead: notif.hasRead,
        createdAt: notif.createdAt,
        orderId: notif.metadata?.orderId || null,
      })),
      pagination: {
        total,
        unreadCount,
        page: currentPage,
        limit: itemsPerPage,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("❌ [BACKEND] Error fetching user notifications:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Mark notification as read
 * PUT /notifications/:notificationId/read
 */
router.put("/:notificationId/read", authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Find notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    // Check ownership
    if (notification.userId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to update this notification",
      });
    }

    // Update to read
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        hasRead: true,
      },
    });

    return res.status(200).json({
      message: "Notification marked as read",
      notification: {
        id: updatedNotification.id,
        hasRead: updatedNotification.hasRead,
      },
    });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Mark all notifications as read
 * PUT /notifications/read-all
 */
router.put("/read-all", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        hasRead: false,
        // isDeleted: false,
      },
      data: {
        hasRead: true,
      },
    });

    return res.status(200).json({
      message: "All notifications marked as read",
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Delete notification (soft delete)
 * DELETE /notifications/:notificationId
 */
router.delete("/:notificationId", authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    // Find notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    // Check ownership
    if (notification.userId !== userId) {
      return res.status(403).json({
        message: "You are not authorized to delete this notification",
      });
    }

    // Soft delete
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        // isDeleted: true,
      },
    });

    return res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
