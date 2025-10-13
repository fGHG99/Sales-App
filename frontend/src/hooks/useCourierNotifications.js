import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import { useAuth } from "../components/middleware/AuthContext";
import {
  getNotifications,
  markNotificationAsRead as markNotificationAsReadAPI,
  markAllNotificationsAsRead as markAllNotificationsAsReadAPI,
  deleteNotification as deleteNotificationAPI,
} from "../services/courierService";

/**
 * Custom hook for courier to receive real-time delivery assignment notifications
 * Listens for "new-delivery-assignment" events from Socket.IO
 * Also fetches existing notifications from database
 *
 * @returns {object} - { notifications, isConnected, unreadCount, markAsRead, clearNotifications, refresh }
 */
const useCourierNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef(null);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await getNotifications(1, 20, false); // Page 1, 20 items per page

      // Transform backend notifications to match frontend format
      const transformedNotifications = response.notifications.map((notif) => ({
        id: notif.id,
        type: notif.type || "ORDER",
        title: notif.title,
        message: notif.message,
        orderId: notif.orderId,
        data: notif.metadata,
        timestamp: new Date(notif.createdAt),
        read: notif.isRead,
      }));

      setNotifications(transformedNotifications);
      setUnreadCount(response.pagination.unreadCount);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!user?.id) return;

    // Connect to Socket.IO server
    const socket = io(
      import.meta.env.VITE_BE_API_URL || "http://localhost:3000",
      {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected for courier notifications");
      setIsConnected(true);

      // Join user room to receive notifications
      socket.emit("join", { userId: user.id });
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setIsConnected(false);
    });

    // Listen for new delivery assignments
    socket.on("new-delivery-assignment", (data) => {
      console.log("📦 New delivery assignment received:", data);

      // Extract notification data from backend response
      const notificationData = data.notification || {};

      const newNotification = {
        id: notificationData.id || data.orderId || `notif-${Date.now()}`,
        type: "new-delivery-assignment",
        title: notificationData.title || "Pengantaran Baru",
        message:
          notificationData.message ||
          data.message ||
          `Pesanan baru #${data.orderId?.substring(
            0,
            8
          )} telah ditugaskan kepada Anda`,
        orderId: data.orderId,
        data: {
          order: data.order,
          metadata: notificationData.metadata,
        },
        timestamp: notificationData.createdAt
          ? new Date(notificationData.createdAt)
          : new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Refresh notifications from database to get the saved notification
      fetchNotifications();

      // Play notification sound (optional)
      try {
        const audio = new Audio("/notification-sound.mp3");
        audio.play().catch((err) => console.warn("Audio play failed:", err));
      } catch (err) {
        console.warn("Notification sound error:", err);
      }

      // Show browser notification (if permission granted)
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: "/courier-icon.png",
          tag: newNotification.id,
        });
      }
    });

    // Listen for order status updates
    socket.on("order-status-updated", (data) => {
      console.log("📝 Order status updated:", data);

      const statusNotification = {
        id: `status-${data.orderId || Date.now()}`,
        type: "order-status-updated",
        title: "Order Status Updated",
        message: data.message || `Order status changed to ${data.newStatus}`,
        orderId: data.orderId,
        data: data,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [statusNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Listen for delivery proof uploaded
    socket.on("delivery-proof-uploaded", (data) => {
      console.log("� Delivery proof uploaded:", data);

      const proofNotification = {
        id: `proof-${data.orderId || Date.now()}`,
        type: "delivery-proof-uploaded",
        title: "Delivery Proof Uploaded",
        message: data.message || "Delivery proof has been uploaded",
        orderId: data.orderId,
        data: data,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [proofNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("error", (err) => {
      console.error("❌ Socket error:", err);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user?.id]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Update in backend
      await markNotificationAsReadAPI(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Update in backend
      await markAllNotificationsAsReadAPI();

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
    }
  };

  // Clear all notifications
  const clearNotifications = async () => {
    try {
      // Mark all as read in backend first
      await markAllNotificationsAsReadAPI();

      // Clear local state
      setNotifications([]);
      setUnreadCount(0);

      // Refresh to get updated list
      fetchNotifications();
    } catch (error) {
      console.error("❌ Error clearing notifications:", error);
    }
  };

  // Remove specific notification
  const removeNotification = async (notificationId) => {
    try {
      // Delete from backend
      await deleteNotificationAPI(notificationId);

      // Update local state
      setNotifications((prev) => {
        const notif = prev.find((n) => n.id === notificationId);
        if (notif && !notif.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch (error) {
      console.error("❌ Error removing notification:", error);
    }
  };

  return {
    notifications,
    isConnected,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
    refresh: fetchNotifications, // Expose refresh function
  };
};

export default useCourierNotifications;
