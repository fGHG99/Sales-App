import api from "../utils/api";

/**
 * Courier Service
 * Handles all courier-related API calls
 */

/**
 * Get courier's assigned deliveries
 * @param {string} status - Filter by status: 'active', 'completed', 'all'
 * @returns {Promise} Orders array
 */
export const getCourierDeliveries = async (status = "all") => {
  try {
    const response = await api.get("/orders/courier/my-deliveries", {
      params: { status },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching courier deliveries:", error);
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
    // Get all orders
    const response = await api.get("/orders/courier/my-deliveries", {
      params: { status: "all" },
    });

    const orders = response.data.orders || [];
    const today = new Date().toDateString();

    // Calculate stats
    const activeOrders = orders.filter(
      (order) =>
        !["COMPLETED", "CANCELED", "DISPUTED"].includes(order.orderStatus)
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
 * Get courier's notifications
 * @param {number} limit - Number of notifications to fetch
 * @param {number} offset - Pagination offset
 * @param {boolean} unreadOnly - Fetch only unread notifications
 * @returns {Promise} Notifications array with pagination
 */
export const getNotifications = async (
  limit = 20,
  offset = 0,
  unreadOnly = false
) => {
  try {
    const response = await api.get("/notifications/courier", {
      params: { limit, offset, unreadOnly },
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
