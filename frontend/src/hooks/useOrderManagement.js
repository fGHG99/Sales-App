import { useState, useCallback, useRef } from "react";
import { completeOrder } from "../services/userService";

/**
 * Custom hook untuk manage order state dengan optimistic updates
 * Maksimal 300 lines untuk handler order management
 */
export const useOrderManagement = (initialOrders = []) => {
  const [orders, setOrders] = useState(initialOrders);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // Ref untuk menyimpan original state sebelum optimistic update
  const originalOrdersRef = useRef(null);
  const updatingOrderIdRef = useRef(null);

  /**
   * Update order status dengan optimistic update
   * @param {string} orderId - ID order yang akan di-update
   * @param {string} newStatus - Status baru untuk order
   * @param {Object} additionalData - Data tambahan untuk update
   */
  const updateOrderStatus = useCallback(
    async (orderId, newStatus, additionalData = {}) => {
      setIsUpdating(true);
      setUpdateError(null);

      // Simpan original state
      originalOrdersRef.current = [...orders];
      updatingOrderIdRef.current = orderId;

      // Optimistic update - update UI dulu
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                orderStatus: newStatus,
                updatedAt: new Date().toISOString(),
                ...additionalData,
              }
            : order
        )
      );

      try {
        // API call untuk update order
        const response = await completeOrder(orderId);

        // Update dengan data dari server (jika ada perubahan)
        if (response.data) {
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === orderId
                ? {
                    ...order,
                    ...response.data,
                    orderStatus: newStatus,
                  }
                : order
            )
          );
        }

        return { success: true, data: response.data };
      } catch (error) {
        // Rollback jika API call gagal
        setOrders(originalOrdersRef.current);
        setUpdateError(
          error.response?.data?.message || "Gagal mengupdate order"
        );

        return {
          success: false,
          error: error.response?.data?.message || "Gagal mengupdate order",
        };
      } finally {
        setIsUpdating(false);
        originalOrdersRef.current = null;
        updatingOrderIdRef.current = null;
      }
    },
    [orders]
  );

  /**
   * Complete order dengan optimistic update
   * @param {string} orderId - ID order yang akan di-complete
   */
  const completeOrderOptimistic = useCallback(
    async (orderId) => {
      return updateOrderStatus(orderId, "COMPLETED", {
        completedAt: new Date().toISOString(),
      });
    },
    [updateOrderStatus]
  );

  /**
   * Update order status ke DELIVERED (untuk testing atau admin)
   * @param {string} orderId - ID order yang akan di-update
   */
  const markAsDelivered = useCallback(
    async (orderId) => {
      return updateOrderStatus(orderId, "DELIVERED", {
        deliveredAt: new Date().toISOString(),
      });
    },
    [updateOrderStatus]
  );

  /**
   * Update order status ke DISPUTED
   * @param {string} orderId - ID order yang akan di-update
   */
  const markAsDisputed = useCallback(
    async (orderId) => {
      return updateOrderStatus(orderId, "DISPUTED", {
        disputedAt: new Date().toISOString(),
      });
    },
    [updateOrderStatus]
  );

  /**
   * Rollback perubahan terakhir (manual rollback)
   */
  const rollbackLastUpdate = useCallback(() => {
    if (originalOrdersRef.current) {
      setOrders(originalOrdersRef.current);
      setUpdateError(null);
      originalOrdersRef.current = null;
      updatingOrderIdRef.current = null;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setUpdateError(null);
  }, []);

  /**
   * Get order by ID
   * @param {string} orderId - ID order yang dicari
   */
  const getOrderById = useCallback(
    (orderId) => {
      return orders.find((order) => order.id === orderId);
    },
    [orders]
  );

  /**
   * Get orders by status
   * @param {string} status - Status order yang dicari
   */
  const getOrdersByStatus = useCallback(
    (status) => {
      return orders.filter((order) => order.orderStatus === status);
    },
    [orders]
  );

  /**
   * Check if order is being updated
   * @param {string} orderId - ID order yang dicek
   */
  const isOrderUpdating = useCallback(
    (orderId) => {
      return isUpdating && updatingOrderIdRef.current === orderId;
    },
    [isUpdating]
  );

  /**
   * Get order statistics
   */
  const getOrderStats = useCallback(() => {
    const stats = {
      total: orders.length,
      pending: 0,
      inPreparation: 0,
      readyForPickup: 0,
      outForDelivery: 0,
      delivered: 0,
      completed: 0,
      disputed: 0,
      canceled: 0,
    };

    orders.forEach((order) => {
      const status = order.orderStatus.toLowerCase().replace(/_/g, "");
      if (stats.hasOwnProperty(status)) {
        stats[status]++;
      }
    });

    return stats;
  }, [orders]);

  /**
   * Refresh orders (untuk sync dengan server)
   * @param {Array} newOrders - Array orders baru dari server
   */
  const refreshOrders = useCallback((newOrders) => {
    setOrders(newOrders);
    setUpdateError(null);
  }, []);

  /**
   * Add new order
   * @param {Object} newOrder - Order baru
   */
  const addOrder = useCallback((newOrder) => {
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
  }, []);

  /**
   * Remove order
   * @param {string} orderId - ID order yang akan dihapus
   */
  const removeOrder = useCallback((orderId) => {
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== orderId)
    );
  }, []);

  return {
    // State
    orders,
    isUpdating,
    updateError,

    // Actions
    completeOrderOptimistic,
    markAsDelivered,
    markAsDisputed,
    updateOrderStatus,

    // Utilities
    rollbackLastUpdate,
    clearError,
    getOrderById,
    getOrdersByStatus,
    isOrderUpdating,
    getOrderStats,
    refreshOrders,
    addOrder,
    removeOrder,

    // Computed values
    hasError: !!updateError,
    isAnyUpdating: isUpdating,
    totalOrders: orders.length,
  };
};

/**
 * Hook untuk manage single order state
 * @param {Object} initialOrder - Order awal
 */
export const useSingleOrderManagement = (initialOrder) => {
  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const originalOrderRef = useRef(null);

  const updateOrder = useCallback(
    async (orderId, updates) => {
      setIsUpdating(true);
      setError(null);

      // Simpan original state
      originalOrderRef.current = { ...order };

      // Optimistic update
      setOrder((prevOrder) => ({ ...prevOrder, ...updates }));

      try {
        const response = await completeOrder(orderId);

        if (response.data) {
          setOrder((prevOrder) => ({ ...prevOrder, ...response.data }));
        }

        return { success: true, data: response.data };
      } catch (err) {
        // Rollback
        setOrder(originalOrderRef.current);
        setError(err.response?.data?.message || "Gagal mengupdate order");

        return {
          success: false,
          error: err.response?.data?.message || "Gagal mengupdate order",
        };
      } finally {
        setIsUpdating(false);
        originalOrderRef.current = null;
      }
    },
    [order]
  );

  const completeOrderOptimistic = useCallback(async () => {
    return updateOrder(order.id, {
      orderStatus: "COMPLETED",
      completedAt: new Date().toISOString(),
    });
  }, [order.id, updateOrder]);

  const rollback = useCallback(() => {
    if (originalOrderRef.current) {
      setOrder(originalOrderRef.current);
      setError(null);
      originalOrderRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    order,
    isUpdating,
    error,
    completeOrderOptimistic,
    updateOrder,
    rollback,
    clearError,
    hasError: !!error,
  };
};

export default useOrderManagement;
