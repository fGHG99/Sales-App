import api from "../utils/api";

/**
 * Store Service - Handles all store-related API calls
 */

/**
 * Get all stores
 * @param {boolean} includeDeleted - Include deleted stores
 * @param {boolean} includeInactive - Include inactive stores
 * @returns {Promise} Stores response
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
 * Get store by ID
 * @param {string} storeId - Store ID
 * @returns {Promise} Store response
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
 * Get nearest stores to user's location
 * @param {string} addressId - User's address ID
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} limit - Maximum number of stores to return
 * @returns {Promise} Nearest stores response
 */
export const getNearestStores = async (
  addressId = null,
  latitude = null,
  longitude = null,
  limit = null
) => {
  try {
    const params = new URLSearchParams();
    if (addressId) params.append("addressId", addressId);
    if (latitude) params.append("latitude", latitude.toString());
    if (longitude) params.append("longitude", longitude.toString());
    if (limit) params.append("limit", limit.toString());

    const response = await api.get(`/store/nearest?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching nearest stores:", error);
    throw error;
  }
};

/**
 * Get stores by location (sorted by distance)
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @returns {Promise} Stores by location response
 */
export const getStoresByLocation = async (latitude, longitude) => {
  try {
    const params = new URLSearchParams();
    params.append("latitude", latitude.toString());
    params.append("longitude", longitude.toString());

    const response = await api.get(`/store/by-location?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching stores by location:", error);
    throw error;
  }
};
