// fe/frontend/src/services/auditService.js
import api from "../utils/api";

/**
 * Get all audit logs with optional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.userId - Filter by specific user ID
 * @param {string} filters.entity - Filter by entity type (User, Order, Store, etc.)
 * @param {string} filters.action - Filter by action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, OTHER)
 * @param {string} filters.startDate - Filter from date (ISO string)
 * @param {string} filters.endDate - Filter to date (ISO string)
 * @param {number} filters.limit - Number of records to return (default: 50, max: 200)
 * @param {number} filters.page - Page number for pagination (default: 1)
 * @returns {Promise} Audit logs data with pagination
 */
export const getAuditLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.append(key, value);
      }
    });

    const response = await api.get(`/audit/audit-logs?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};

/**
 * Get activity history for a specific user
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back (default: 30, max: 365)
 * @returns {Promise} User activity data
 */
export const getUserActivity = async (userId, days = 30) => {
  try {
    const response = await api.get(
      `/audit/audit-logs/user/${userId}?days=${days}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user activity:", error);
    throw error;
  }
};

/**
 * Get change history for a specific entity
 * @param {string} entity - Entity type (User, Order, Store, etc.)
 * @param {string} entityId - Entity ID
 * @returns {Promise} Entity history data
 */
export const getEntityHistory = async (entity, entityId) => {
  try {
    const response = await api.get(
      `/audit/audit-logs/entity/${entity}/${entityId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching entity history:", error);
    throw error;
  }
};

/**
 * Get audit log statistics
 * @param {number} days - Number of days to analyze (default: 30, max: 365)
 * @returns {Promise} Audit log statistics
 */
export const getAuditStats = async (days = 30) => {
  try {
    const response = await api.get(`/audit/audit-logs/stats?days=${days}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching audit stats:", error);
    throw error;
  }
};

/**
 * Export audit logs to JSON file
 * @param {Array} auditLogs - Array of audit log data
 * @param {string} filename - Optional filename (default: auto-generated)
 * @returns {void}
 */
export const exportAuditLogs = (auditLogs, filename = null) => {
  try {
    const dataStr = JSON.stringify(auditLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      filename || `audit-logs-${new Date().toISOString().split("T")[0]}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    throw error;
  }
};

/**
 * Format audit log data for display
 * @param {Object} log - Audit log object
 * @returns {Object} Formatted audit log
 */
export const formatAuditLog = (log) => {
  return {
    id: log.id,
    timestamp: new Date(log.createdAt).toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    user: log.user?.name || "Unknown User",
    userEmail: log.user?.email || "N/A",
    oldValues: log.oldValues,
    newValues: log.newValues,
    createdAt: log.createdAt,
  };
};

/**
 * Get action badge color class
 * @param {string} action - Action type
 * @returns {string} CSS class for badge color
 */
export const getActionBadgeColor = (action) => {
  const colors = {
    CREATE: "bg-green-100 text-green-800 border-green-200",
    UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
    DELETE: "bg-red-100 text-red-800 border-red-200",
    LOGIN: "bg-purple-100 text-purple-800 border-purple-200",
    LOGOUT: "bg-gray-100 text-gray-800 border-gray-200",
    OTHER: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };
  return colors[action] || colors.OTHER;
};

/**
 * Format value for display in modal
 * @param {any} value - Value to format
 * @returns {string} Formatted value
 */
export const formatValue = (value) => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

/**
 * Validate entity type
 * @param {string} entity - Entity type to validate
 * @returns {boolean} True if valid
 */
export const isValidEntity = (entity) => {
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
  return validEntities.includes(entity);
};

/**
 * Validate action type
 * @param {string} action - Action type to validate
 * @returns {boolean} True if valid
 */
export const isValidAction = (action) => {
  const validActions = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "OTHER",
  ];
  return validActions.includes(action);
};
