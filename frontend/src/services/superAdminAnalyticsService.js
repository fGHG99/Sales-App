import api from "../utils/api";

/**
 * Super Admin Analytics Service - Handles all super admin analytics-related API calls
 * These endpoints aggregate data from ALL stores (not just one store like admin analytics)
 */

/**
 * Get aggregated sales analytics summary from all stores
 * @param {string} dateRange - "week" | "month" | "custom"
 * @param {string} startDate - ISO date (required if custom)
 * @param {string} endDate - ISO date (required if custom)
 * @returns {Promise} Aggregated analytics summary response
 */
export const getSuperAdminAnalyticsSummary = async (
  dateRange = "week",
  startDate = null,
  endDate = null
) => {
  try {
    const params = new URLSearchParams();
    params.append("dateRange", dateRange);

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get(
      `/super-admin/get-analytics-summary?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching super admin analytics summary:", error);
    throw error;
  }
};

/**
 * Get aggregated daily sales data from all stores for charts
 * @param {string} dateRange - "week" | "month" | "custom"
 * @param {string} startDate - ISO date (required if custom)
 * @param {string} endDate - ISO date (required if custom)
 * @returns {Promise} Aggregated daily sales data response
 */
export const getSuperAdminDailySales = async (
  dateRange = "week",
  startDate = null,
  endDate = null
) => {
  try {
    const params = new URLSearchParams();
    params.append("dateRange", dateRange);

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get(
      `/super-admin/get-analytics-daily-sales?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching super admin daily sales:", error);
    throw error;
  }
};

/**
 * Get aggregated export data from all stores for Excel export
 * @param {string} dateRange - "week" | "month" | "custom"
 * @param {string} startDate - ISO date (required if custom)
 * @param {string} endDate - ISO date (required if custom)
 * @returns {Promise} Aggregated export data response
 */
export const getSuperAdminExportData = async (
  dateRange = "week",
  startDate = null,
  endDate = null
) => {
  try {
    const params = new URLSearchParams();
    params.append("dateRange", dateRange);

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get(
      `/super-admin/get-export-data?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching super admin export data:", error);
    throw error;
  }
};

/**
 * Get store performance metrics for all stores
 * @param {string} dateRange - "week" | "month" | "custom"
 * @param {string} startDate - ISO date (required if custom)
 * @param {string} endDate - ISO date (required if custom)
 * @returns {Promise} Store performance data response
 */
export const getSuperAdminStorePerformance = async (
  dateRange = "week",
  startDate = null,
  endDate = null
) => {
  try {
    const params = new URLSearchParams();
    params.append("dateRange", dateRange);

    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get(
      `/super-admin/get-store-performance?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching super admin store performance:", error);
    throw error;
  }
};
