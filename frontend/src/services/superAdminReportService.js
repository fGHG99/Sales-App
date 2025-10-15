// fe/frontend/src/services/superAdminReportService.js
import api from "../utils/api";

/**
 * Get all stores for reports dropdown and quick stats
 * @returns {Promise} Stores data with stats
 */
export const getStores = async () => {
  try {
    const response = await api.get("/super-admin/reports/stores");
    return response.data;
  } catch (error) {
    console.error("Error fetching stores for reports:", error);
    throw error;
  }
};

/**
 * Generate and download report file
 * @param {Object} config - Report configuration
 * @param {string} config.reportType - Type of report (sales, inventory, orders)
 * @param {string} config.storeFilter - Store filter (all or store UUID)
 * @param {string} config.dateFrom - Start date (YYYY-MM-DD)
 * @param {string} config.dateTo - End date (YYYY-MM-DD)
 * @param {string} config.format - Export format (excel, csv)
 * @returns {Promise} Blob response for file download
 */
export const generateReport = async (config) => {
  try {
    const response = await api.post(
      "/super-admin/reports/generate-export",
      config,
      {
        responseType: "blob",
        headers: {
          Accept:
            config.format === "excel"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "text/csv",
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
};

/**
 * Helper function to trigger file download from blob response
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename for download
 */
export const downloadFile = (blob, filename) => {
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Extract filename from Content-Disposition header
 * @param {string} contentDisposition - Content-Disposition header value
 * @param {string} fallbackFilename - Fallback filename if header parsing fails
 * @returns {string} Extracted filename
 */
export const extractFilename = (contentDisposition, fallbackFilename) => {
  if (!contentDisposition) {
    return fallbackFilename;
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
  return filenameMatch ? filenameMatch[1] : fallbackFilename;
};
