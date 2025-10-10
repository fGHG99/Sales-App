import { useState, useEffect, useCallback } from "react";
import {
  getCourierDeliveries,
  getCourierStats,
  updateOrderStatus as updateOrderStatusAPI,
  uploadDeliveryProof as uploadDeliveryProofAPI,
} from "../services/courierService";
import useCourierNotifications from "./useCourierNotifications";
import { toast } from "sonner";

/**
 * Hook untuk manage Courier Dashboard data
 * Handles fetching orders, stats, and real-time notifications
 */
const useCourierDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedToday: 0,
    totalEarningsToday: 0,
    inTransit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Use courier notifications hook
  const {
    notifications,
    unreadCount,
    isConnected: socketConnected,
    markAsRead,
    clearNotifications,
  } = useCourierNotifications();

  /**
   * Fetch all courier data (orders + stats)
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch orders and stats in parallel
      const [ordersData, statsData] = await Promise.all([
        getCourierDeliveries("all"),
        getCourierStats(),
      ]);

      setOrders(ordersData.orders || []);
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  /**
   * Refresh dashboard data
   */
  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  /**
   * Update order status
   */
  const updateOrderStatus = useCallback(
    async (orderId, newStatus, notes = "") => {
      try {
        const response = await updateOrderStatusAPI(orderId, newStatus, notes);

        // Update local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? { ...order, orderStatus: newStatus, updatedAt: new Date() }
              : order
          )
        );

        // Refresh stats
        const newStats = await getCourierStats();
        setStats(newStats);

        toast.success(response.message || "Order status updated successfully");
        return response;
      } catch (err) {
        console.error("Error updating order status:", err);
        const errorMsg =
          err.response?.data?.message || "Failed to update order status";
        toast.error(errorMsg);
        throw err;
      }
    },
    []
  );

  /**
   * Upload delivery proof photo
   */
  const uploadDeliveryProof = useCallback(async (orderId, photoFile) => {
    try {
      const response = await uploadDeliveryProofAPI(orderId, photoFile);

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                deliveryProof: response.order.deliveryProof,
                updatedAt: new Date(),
              }
            : order
        )
      );

      toast.success("Delivery proof uploaded successfully");
      return response;
    } catch (err) {
      console.error("Error uploading delivery proof:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to upload delivery proof";
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  /**
   * Mark order as picked up
   */
  const markAsPickedUp = useCallback(
    async (orderId) => {
      return await updateOrderStatus(
        orderId,
        "OUT_FOR_DELIVERY",
        "Paket telah diambil dan sedang dalam perjalanan"
      );
    },
    [updateOrderStatus]
  );

  /**
   * Mark order as delivered
   */
  const markAsDelivered = useCallback(
    async (orderId) => {
      return await updateOrderStatus(
        orderId,
        "DELIVERED",
        "Paket telah sampai di tujuan"
      );
    },
    [updateOrderStatus]
  );

  /**
   * Complete order (after delivery proof uploaded)
   */
  const completeOrder = useCallback(
    async (orderId) => {
      return await updateOrderStatus(
        orderId,
        "COMPLETED",
        "Pengiriman selesai"
      );
    },
    [updateOrderStatus]
  );

  /**
   * Get active orders only
   */
  const getActiveOrders = useCallback(() => {
    return orders.filter(
      (order) =>
        !["COMPLETED", "CANCELED", "DISPUTED"].includes(order.orderStatus)
    );
  }, [orders]);

  /**
   * Get completed orders only
   */
  const getCompletedOrders = useCallback(() => {
    return orders.filter((order) => order.orderStatus === "COMPLETED");
  }, [orders]);

  /**
   * Get orders by status
   */
  const getOrdersByStatus = useCallback(
    (status) => {
      return orders.filter((order) => order.orderStatus === status);
    },
    [orders]
  );

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Listen to new delivery assignments from Socket.IO
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];

      // If new order assigned, refresh dashboard
      if (latestNotification.type === "new-delivery-assignment") {
        refresh();
      }

      // If order status updated, refresh stats
      if (latestNotification.type === "order-status-updated") {
        getCourierStats().then((newStats) => setStats(newStats));
      }
    }
  }, [notifications, refresh]);

  return {
    // Data
    orders,
    stats,
    notifications,
    unreadCount,

    // Computed data
    activeOrders: getActiveOrders(),
    completedOrders: getCompletedOrders(),

    // Loading states
    loading,
    error,
    socketConnected,

    // Actions
    refresh,
    updateOrderStatus,
    uploadDeliveryProof,
    markAsPickedUp,
    markAsDelivered,
    completeOrder,
    getOrdersByStatus,
    markNotificationAsRead: markAsRead,
    clearNotifications,
  };
};

export default useCourierDashboard;
