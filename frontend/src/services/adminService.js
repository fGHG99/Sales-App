import api from "../utils/api";

/**
 * Admin Service
 * Handles all admin store-related API calls
 */

/**
 * Get dashboard statistics
 * Returns: total orders today, pending preparation, active disputes, active couriers, today & weekly revenue
 * @returns {Promise} Dashboard statistics
 */
export const getDashboardStats = async () => {
  try {
    const response = await api.get("/admin/admin/dashboard/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

/**
 * Get recent orders for admin's store
 * @param {number} limit - Number of orders to fetch (default: 5)
 * @returns {Promise} Recent orders
 */
export const getRecentOrders = async (limit = 5) => {
  try {
    const response = await api.get("/admin/admin/dashboard/recent-orders", {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    throw error;
  }
};

/**
 * Get urgent issues (pending orders + high priority disputes)
 * @param {number} limit - Number of items to fetch (default: 5)
 * @returns {Promise} Urgent issues (pending orders and disputes)
 */
export const getUrgentIssues = async (limit = 5) => {
  try {
    const response = await api.get("/admin/admin/dashboard/urgent-issues", {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching urgent issues:", error);
    throw error;
  }
};

/**
 * Format currency to IDR
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get status badge color based on order status
 * @param {string} status - Order status
 * @returns {string} Tailwind CSS classes for badge
 */
export const getStatusBadgeColor = (status) => {
  const statusMap = {
    DELIVERED: "bg-green-100 text-green-800",
    GRACE_PERIOD: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-green-100 text-green-800",
    OUT_FOR_DELIVERY: "bg-blue-100 text-blue-800",
    READY_FOR_PICKUP: "bg-blue-100 text-blue-800",
    IN_PREPARATION: "bg-yellow-100 text-yellow-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    DISPUTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  return statusMap[status] || "bg-gray-100 text-gray-800";
};

/**
 * Format order status to readable text
 * @param {string} status - Order status
 * @returns {string} Readable status text
 */
export const formatOrderStatus = (status) => {
  const statusMap = {
    PENDING: "Pending",
    IN_PREPARATION: "Sedang Disiapkan",
    PREPARED: "Sudah Disiapkan",
    READY_FOR_PICKUP: "Siap Diambil",
    OUT_FOR_DELIVERY: "Dalam Perjalanan",
    ARRIVED_AT_DESTINATION: "Telah Tiba",
    DELIVERED: "Dikirimkan",
    GRACE_PERIOD: "Completed by System",
    COMPLETED: "Selesai",
    DISPUTED: "Dalam Sengketa",
    CANCELED: "Dibatalkan",
  };

  return statusMap[status] || status;
};

/**
 * Get all orders with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 5)
 * @param {string} params.status - Filter by order status (optional)
 * @returns {Promise} Orders with pagination metadata
 */
export const getAllOrders = async ({
  page = 1,
  limit = 5,
  status = null,
} = {}) => {
  try {
    const params = { page, limit };
    if (status) {
      // Special handling for "COMPLETED" - include both COMPLETED and GRACE_PERIOD
      if (status === "COMPLETED") {
        params.status = "COMPLETED"; // Backend will handle including GRACE_PERIOD
      } else {
        params.status = status;
      }
    }

    const response = await api.get("/admin/get-all/orders", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New order status
 * @returns {Promise} Updated order response
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const response = await api.patch(`/admin/update-status/orders/${orderId}`, {
      newStatus,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

/**
 * Get next status in workflow
 * @param {string} currentStatus - Current order status
 * @returns {string|null} Next status or null if no transition available
 */
export const getNextStatus = (currentStatus) => {
  const statusWorkflow = {
    PENDING: "IN_PREPARATION",
    IN_PREPARATION: "PREPARED",
    PREPARED: "READY_FOR_PICKUP",
  };

  return statusWorkflow[currentStatus] || null;
};

/**
 * Get button config for status transition
 * @param {string} currentStatus - Current order status
 * @returns {Object|null} Button configuration or null
 */
export const getStatusButtonConfig = (currentStatus) => {
  const buttonConfig = {
    PENDING: {
      text: "Mulai Persiapan",
      nextStatus: "IN_PREPARATION",
    },
    IN_PREPARATION: {
      text: "Tandai Sudah Disiapkan",
      nextStatus: "PREPARED",
    },
    PREPARED: {
      text: "Siap Diambil Kurir",
      nextStatus: "READY_FOR_PICKUP",
    },
  };

  return buttonConfig[currentStatus] || null;
};

// ==================== COURIER TRACKING ====================

/**
 * Get all couriers in workspace (by postal code)
 * @returns {Promise} Couriers with workspace info
 */
export const getCouriersInWorkspace = async () => {
  try {
    const response = await api.get("/admin/couriers/workspace");
    return response.data;
  } catch (error) {
    console.error("Error fetching couriers in workspace:", error);
    throw error;
  }
};

/**
 * Get couriers with their active deliveries (with pagination and filtering)
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 5)
 * @param {string} params.status - Filter by status: "active", "available" (optional)
 * @returns {Promise} Couriers with active deliveries
 */
export const getCouriersWithActiveDeliveries = async ({
  page = 1,
  limit = 5,
  status = null,
} = {}) => {
  try {
    const params = { page, limit };
    if (status) {
      params.status = status;
    }

    const response = await api.get("/admin/couriers/active-deliveries", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching couriers with active deliveries:", error);
    throw error;
  }
};

/**
 * Get courier status badge color
 * @param {string} status - Courier status
 * @returns {string} Badge color classes
 */
export const getCourierStatusBadgeColor = (status) => {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    available: "bg-gray-100 text-gray-800",
  };

  return statusColors[status] || "bg-gray-100 text-gray-800";
};

/**
 * Format courier status to Indonesian
 * @param {string} status - Courier status
 * @returns {string} Formatted status
 */
export const formatCourierStatus = (status) => {
  const statusMap = {
    active: "Aktif",
    available: "Tersedia",
  };

  return statusMap[status] || status;
};

// ==================== DISPUTE MANAGEMENT ====================

/**
 * Get all disputes with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 5)
 * @param {string} params.status - Filter by dispute status: PENDING, IN_PROGRESS, RESOLVED, REJECTED (optional)
 * @returns {Promise} Disputes with pagination and counts
 */
export const getAllDisputes = async ({
  page = 1,
  limit = 5,
  status = null,
} = {}) => {
  try {
    const params = { page, limit };
    if (status) {
      params.status = status;
    }

    const response = await api.get("/disputes/get-all/disputes", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching disputes:", error);
    throw error;
  }
};

/**
 * Update dispute status
 * @param {string} disputeId - Dispute ID
 * @param {string} newStatus - New status: PENDING, IN_PROGRESS, REJECTED
 * @returns {Promise} Updated dispute response
 */
export const updateDisputeStatus = async (disputeId, newStatus) => {
  try {
    const response = await api.patch(`/disputes/update-status/${disputeId}`, {
      newStatus,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating dispute status:", error);
    throw error;
  }
};

/**
 * Resolve dispute with admin response
 * @param {string} disputeId - Dispute ID
 * @param {string} response - Admin response text
 * @returns {Promise} Resolved dispute response
 */
export const resolveDispute = async (disputeId, response) => {
  try {
    const apiResponse = await api.patch(
      `/disputes/resolve-dispute/${disputeId}`,
      {
        response,
      }
    );
    return apiResponse.data;
  } catch (error) {
    console.error("Error resolving dispute:", error);
    throw error;
  }
};

/**
 * Get dispute status badge color
 * @param {string} status - Dispute status
 * @returns {string} Badge color classes
 */
export const getDisputeStatusBadgeColor = (status) => {
  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
    REJECTED: "bg-gray-100 text-gray-800",
  };

  return statusColors[status] || "bg-gray-100 text-gray-800";
};

/**
 * Format dispute status to Indonesian
 * @param {string} status - Dispute status
 * @returns {string} Formatted status
 */
export const formatDisputeStatus = (status) => {
  const statusMap = {
    PENDING: "Menunggu",
    IN_PROGRESS: "Dalam Proses",
    RESOLVED: "Selesai",
    REJECTED: "Ditolak",
  };

  return statusMap[status] || status;
};

/**
 * Format dispute reason to Indonesian
 * @param {string} reason - Dispute reason
 * @returns {string} Formatted reason
 */
export const formatDisputeReason = (reason) => {
  const reasonMap = {
    WRONG_ITEM: "Barang Salah",
    DAMAGED_ITEM: "Barang Rusak",
    MISSING_ITEM: "Barang Kurang",
    LATE_DELIVERY: "Terlambat",
    POOR_QUALITY: "Kualitas Buruk",
    OTHER: "Lainnya",
  };

  return reasonMap[reason] || reason;
};

// ==================== USER PROFILE ====================

/**
 * Get current authenticated user data
 * @returns {Promise} User profile data with image, addresses, and role
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw error;
  }
};

// ==================== NOTIFICATIONS ====================

/**
 * Get admin notifications
 * @param {number} limit - Number of notifications to fetch (default: 10)
 * @param {number} page - Page number (default: 1)
 * @param {string} type - Filter by type: "all", "ORDER", "INFO" (default: "all")
 * @returns {Promise} Notifications with pagination metadata
 */
export const getNotifications = async (limit = 10, page = 1, type = "all") => {
  try {
    const params = { limit, page };
    if (type && type !== "all") {
      params.type = type;
    }

    const response = await api.get("/users/notifications", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

// ==================== SEARCH ====================

/**
 * Search orders by orderId, courierId, courier name, or disputeId
 * @param {string} query - Search query (minimum 2 characters)
 * @returns {Promise} Array of matching order IDs with search metadata
 */
export const searchOrders = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: { orders: [], couriers: [], disputes: [] },
        meta: { totalResults: 0, searchQuery: query, searchType: "string" },
      };
    }

    const response = await api.get("/admin/search-things", {
      params: { q: query.trim() },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching orders:", error);
    throw error;
  }
};

// ==================== SALES ANALYTICS ====================

/**
 * Get sales analytics summary
 * @param {string} dateRange - "week" | "month" | "custom"
 * @param {string} startDate - ISO date (for custom range)
 * @param {string} endDate - ISO date (for custom range)
 */
export const getSalesSummary = async (
  dateRange,
  startDate = null,
  endDate = null
) => {
  try {
    const params = { dateRange };
    if (dateRange === "custom" && startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }

    const response = await api.get("/admin/analytics/summary", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    throw error;
  }
};

/**
 * Get daily sales data for charts
 */
export const getDailySalesData = async (
  dateRange,
  startDate = null,
  endDate = null
) => {
  try {
    const params = { dateRange };
    if (dateRange === "custom" && startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }

    const response = await api.get("/admin/analytics/daily-sales", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching daily sales:", error);
    throw error;
  }
};

/**
 * Get complete sales data for Excel export
 */
export const getSalesExportData = async (
  dateRange,
  startDate = null,
  endDate = null
) => {
  try {
    const params = { dateRange };
    if (dateRange === "custom" && startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }

    const response = await api.get("/admin/analytics/export-data", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching export data:", error);
    throw error;
  }
};

// ==================== QR CODE GENERATION ====================

/**
 * Generate QR code for courier pickup confirmation
 * @param {string} orderId - Order ID to generate QR code for
 * @returns {Promise} QR code data with expiration info
 */
export const generateQrCode = async (orderId) => {
  try {
    const response = await api.post(`/orders/generate-qr/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
};
