// fe/frontend/src/services/deliveryFeeService.js
import api from "../utils/api";

/**
 * Get current delivery fee
 * @returns {Promise} Current delivery fee data
 */
export const getCurrentDeliveryFee = async () => {
  try {
    const response = await api.get("/fee/delivery-fee");
    return response.data;
  } catch (error) {
    console.error("Error fetching current delivery fee:", error);
    throw error;
  }
};

/**
 * Update delivery fee (admin only)
 * @param {Object} feeData - Delivery fee data
 * @param {number} feeData.feeAmount - New delivery fee amount
 * @param {string} feeData.description - Description for the change
 * @returns {Promise} Update response
 */
export const updateDeliveryFee = async (feeData) => {
  try {
    const response = await api.post("/fee/delivery-fee", feeData);
    return response.data;
  } catch (error) {
    console.error("Error updating delivery fee:", error);
    throw error;
  }
};

/**
 * Get delivery fee change history
 * @returns {Promise} Delivery fee history
 */
export const getDeliveryFeeHistory = async () => {
  try {
    const response = await api.get("/fee/delivery-fee/history");
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery fee history:", error);
    throw error;
  }
};

/**
 * Format delivery fee to Indonesian currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatDeliveryFee = (amount) => {
  if (!amount || amount === 0) return "Rp 0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Parse delivery fee input
 * @param {string} input - User input (e.g., "15000", "15.000", "Rp 15.000")
 * @returns {number} Parsed amount
 */
export const parseDeliveryFeeInput = (input) => {
  if (!input) return 0;

  // Remove currency symbols and spaces
  const cleaned = input.replace(/[Rp\s]/g, "");

  // Remove thousand separators but keep decimal point
  const normalized = cleaned.replace(/\./g, "");

  return parseFloat(normalized) || 0;
};

/**
 * Validate delivery fee input
 * @param {string} input - User input
 * @returns {Object} Validation result
 */
export const validateDeliveryFeeInput = (input) => {
  const amount = parseDeliveryFeeInput(input);

  return {
    isValid: amount >= 0,
    amount: amount,
    error: amount < 0 ? "Delivery fee cannot be negative" : null,
  };
};
