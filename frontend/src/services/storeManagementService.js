import api from "../utils/api";

/**
 * Store Management Service - Handles all store management-related API calls
 * Uses real APIs from storeController.js instead of mock data
 */

/**
 * Get all stores with optional filtering
 * @param {boolean} includeDeleted - Include soft-deleted stores
 * @param {boolean} includeInactive - Include inactive stores
 * @returns {Promise} Stores list response
 */
export const getAllStores = async (
  includeDeleted = false,
  includeInactive = false
) => {
  try {
    const params = new URLSearchParams();
    if (includeDeleted) params.append("includeDeleted", "true");
    if (includeInactive) params.append("includeInactive", "true");

    const response = await api.get(`/store/get-all?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching stores:", error);
    throw error;
  }
};

/**
 * Create a new store
 * @param {Object} storeData - Store data including name, address, hours, adminId
 * @returns {Promise} Created store response
 */
export const createStore = async (storeData) => {
  try {
    const response = await api.post("/store/create", storeData);
    return response.data;
  } catch (error) {
    console.error("Error creating store:", error);
    throw error;
  }
};

/**
 * Update an existing store
 * @param {string} storeId - Store ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise} Updated store response
 */
export const updateStore = async (storeId, updateData) => {
  try {
    const response = await api.put(
      `/store/update-store/${storeId}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating store:", error);
    throw error;
  }
};

/**
 * Toggle store active status
 * @param {string} storeId - Store ID
 * @param {boolean} isActive - New active status
 * @returns {Promise} Updated store response
 */
export const toggleStoreStatus = async (storeId, isActive) => {
  try {
    const response = await api.patch(`/store/toggle-active/${storeId}`, {
      isActive,
    });
    return response.data;
  } catch (error) {
    console.error("Error toggling store status:", error);
    throw error;
  }
};

/**
 * Soft delete a store
 * @param {string} storeId - Store ID to delete
 * @returns {Promise} Deleted store response
 */
export const deleteStore = async (storeId) => {
  try {
    const response = await api.patch(`/store/soft-delete/${storeId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting store:", error);
    throw error;
  }
};

/**
 * Get store by ID
 * @param {string} storeId - Store ID
 * @returns {Promise} Store details response
 */
export const getStoreById = async (storeId) => {
  try {
    const response = await api.get(`/store/get-store/${storeId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching store:", error);
    throw error;
  }
};

/**
 * Assign admin to store
 * @param {string} storeId - Store ID
 * @param {string} adminId - Admin user ID
 * @returns {Promise} Updated store response
 */
export const assignAdminToStore = async (storeId, adminId) => {
  try {
    const response = await api.patch(`/store/assign-admin/${storeId}`, {
      adminId,
    });
    return response.data;
  } catch (error) {
    console.error("Error assigning admin:", error);
    throw error;
  }
};

/**
 * Get all admin users (users with roleType "ADMIN")
 * @returns {Promise} Admin users list response
 */
export const getAdminUsers = async () => {
  try {
    const response = await api.get("/users/admin");
    return response.data;
  } catch (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }
};
