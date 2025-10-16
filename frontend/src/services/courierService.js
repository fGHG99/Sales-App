import api from "../utils/api";

/**
 * Courier Service
 * Handles all courier-related API calls
 */

/**
 * Get courier's orders with flexible filtering
 * @param {Object} options - Query options
 * @param {string} options.filter - Filter type: "active", specific status, or omit for all
 * @param {number} options.page - Page number for pagination
 * @param {number} options.limit - Items per page
 * @param {boolean} options.enablePagination - Enable/disable pagination (default: true)
 * @returns {Promise} Orders with pagination and status counts
 */
export const getCourierOrders = async ({
  filter = null,
  page = 1,
  limit = 10,
  enablePagination = true,
} = {}) => {
  try {
    const params = {};
    if (filter) params.filter = filter;
    if (enablePagination) {
      params.page = page;
      params.limit = limit;
    } else {
      params.enablePagination = "false";
    }

    const response = await api.get("/orders/courier", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching courier orders:", error);
    throw error;
  }
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New status value
 * @param {string} notes - Optional notes
 * @returns {Promise} Updated order
 */
export const updateOrderStatus = async (orderId, newStatus, notes = "") => {
  try {
    const response = await api.put(`/orders/${orderId}/status`, {
      newStatus,
      notes,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

/**
 * Upload delivery proof photo
 * Updates order status to ARRIVED_AT_DESTINATION
 * @param {string} orderId - Order ID
 * @param {File} photoFile - Photo file
 * @returns {Promise} Updated order with delivery proof
 */
export const uploadDeliveryProof = async (orderId, photoFile) => {
  try {
    const formData = new FormData();
    formData.append("deliveryProof", photoFile);

    const response = await api.post(
      `/orders/${orderId}/delivery-proof`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading delivery proof:", error);
    throw error;
  }
};

/**
 * Get courier's statistics for today
 * @returns {Promise} Stats object
 */
export const getCourierStats = async () => {
  try {
    // Get all orders without pagination
    const response = await getCourierOrders({ enablePagination: false });

    const orders = response.orders || [];
    const today = new Date().toDateString();

    // Calculate stats
    const activeOrders = orders.filter(
      (order) =>
        ![
          "COMPLETED",
          "CANCELED",
          "DISPUTED",
          "GRACE_PERIOD",
          "ARRIVED_AT_DESTINATION",
        ].includes(order.orderStatus)
    );

    const completedToday = orders.filter((order) => {
      const orderDate = new Date(order.updatedAt).toDateString();
      return order.orderStatus === "COMPLETED" && orderDate === today;
    });

    const totalEarningsToday = completedToday.reduce((sum, order) => {
      return sum + (Number(order.deliveryFee) || 0);
    }, 0);

    const inTransit = orders.filter(
      (order) => order.orderStatus === "OUT_FOR_DELIVERY"
    );

    return {
      activeOrders: activeOrders.length,
      completedToday: completedToday.length,
      totalEarningsToday,
      inTransit: inTransit.length,
      totalOrders: orders.length,
    };
  } catch (error) {
    console.error("Error fetching courier stats:", error);
    throw error;
  }
};

/**
 * Get active orders for dashboard (no pagination)
 * @returns {Promise} Active orders array
 */
export const getActiveOrders = async () => {
  try {
    const response = await getCourierOrders({
      filter: "active",
      enablePagination: false,
    });
    return response;
  } catch (error) {
    console.error("Error fetching active orders:", error);
    throw error;
  }
};

/**
 * Get order details by ID
 * @param {string} orderId - Order ID
 * @returns {Promise} Order details
 */
export const getOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching order details:", error);
    throw error;
  }
};

/**
 * Get courier's location from cache
 * @param {string} courierId - Courier ID
 * @returns {Promise} Location data
 */
export const getCourierLocation = async (courierId) => {
  try {
    const response = await api.get(`/courier/location/${courierId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching courier location:", error);
    throw error;
  }
};

/**
 * Update courier's location
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise} Location update confirmation
 */
export const updateCourierLocation = async (latitude, longitude) => {
  try {
    const response = await api.post("/courier/location", {
      latitude,
      longitude,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating courier location:", error);
    throw error;
  }
};

/**
 * Get courier's notifications with page-based pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @param {boolean} unreadOnly - Fetch only unread notifications (default: false)
 * @returns {Promise} Notifications array with pagination metadata
 */
export const getNotifications = async (
  page = 1,
  limit = 20,
  unreadOnly = false
) => {
  try {
    const response = await api.get("/notifications/get-all-notifications", {
      params: { page, limit, unreadOnly },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise} Updated notification
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise} Update count
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.put("/notifications/read-all");
    return response.data;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Delete notification (soft delete)
 * @param {string} notificationId - Notification ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

/**
 * Generate QR code for order pickup
 * @param {string} orderId - Order ID
 * @returns {Promise} QR code data
 */
export const generateQrCode = async (orderId) => {
  try {
    const response = await api.post(`/orders/${orderId}/generate-qr`);
    return response.data;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
};

/**
 * Verify QR code and update order status to OUT_FOR_DELIVERY
 * @param {string} qrCode - QR code string
 * @returns {Promise} Verified order data
 */
export const verifyQrCode = async (qrCode) => {
  try {
    const response = await api.post("/orders/verify-qr", { qrCode });
    return response.data;
  } catch (error) {
    console.error("Error verifying QR code:", error);
    throw error;
  }
};

/**
 * Update courier's work area postal codes
 * @param {string[]} postalCodes - Array of postal codes
 * @returns {Promise} Updated courier data
 */
export const updateWorkAreaPostalCodes = async (postalCodes) => {
  try {
    const response = await api.patch("/users/courier/work-area", {
      postalCodes,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating work area postal codes:", error);
    throw error;
  }
};

export const getCourierProfile = async () => {
  try {
    const response = await api.get("/users/courier/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching courier profile:", error);
    throw error;
  }
};
