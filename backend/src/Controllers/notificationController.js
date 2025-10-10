import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate } from "../Middlewares/accessControl.js";

/**
 * Get courier's notifications
 * GET /notifications/courier
 *
 * Returns all notifications for the authenticated courier user
 * Sorted by newest first
 */
router.get("/courier", authenticate, async (req, res) => {
  try {
    const courierId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    const whereClause = {
      userId: courierId,
      //   isDeleted: false,
    };

    // Filter only unread if requested
    if (unreadOnly === "true") {
      whereClause.hasRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Count total and unread
    const total = await prisma.notification.count({
      where: {
        userId: courierId,
        // isDeleted: false,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: courierId,
        // isDeleted: false,
        hasRead: false,
      },
    });

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
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching courier notifications:", error);
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
