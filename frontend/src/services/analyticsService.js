import api from "../utils/api";

/**
 * Analytics Service - Handles all analytics-related API calls
 */

/**
 * Get sales analytics summary
 * @param {string} dateRange - "week" | "month" | "custom"
 * @param {string} startDate - ISO date (required if custom)
 * @param {string} endDate - ISO date (required if custom)
 * @returns {Promise} Analytics summary response
 */
export const getAnalyticsSummary = async (
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
      `/admin/analytics/summary?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    throw error;
  }
};

/**
 * Get daily sales data for charts
 * @param {string} dateRange - "week" | "month" | "custom"
 * @param {string} startDate - ISO date (required if custom)
 * @param {string} endDate - ISO date (required if custom)
 * @returns {Promise} Daily sales data response
 */
export const getDailySales = async (
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
      `/admin/analytics/daily-sales?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching daily sales:", error);
    throw error;
  }
};

/**
 * Get export data for Excel export
 * @param {string} dateRange - "week" | "month" | "custom"
 * @param {string} startDate - ISO date (required if custom)
 * @param {string} endDate - ISO date (required if custom)
 * @returns {Promise} Export data response
 */
export const getExportData = async (
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
      `/admin/analytics/export-data?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching export data:", error);
    throw error;
  }
};
