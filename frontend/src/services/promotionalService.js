import api from "../utils/api";

/**
 * Promotional Service
 * Handles all promotional-related API calls
 */

/**
 * Get all promotional images
 * @returns {Promise} Promotional images array
 */
export const getPromotionals = async () => {
  try {
    const response = await api.get("/promotionals/get-promotionals");
    return response.data;
  } catch (error) {
    console.error("Error fetching promotionals:", error);
    throw error;
  }
};

/**
 * Create new promotional image
 * @param {FormData} formData - Form data with image and altText
 * @returns {Promise} Created promotional data
 */
export const createPromotional = async (formData) => {
  try {
    const response = await api.post("/promotionals/post-promotional", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating promotional:", error);
    throw error;
  }
};

/**
 * Update promotional image
 * @param {string} id - Promotional ID
 * @param {FormData} formData - Form data with image and/or altText
 * @returns {Promise} Updated promotional data
 */
export const updatePromotional = async (id, formData) => {
  try {
    const response = await api.put(`/promotionals/update-promotional/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating promotional:", error);
    throw error;
  }
};

/**
 * Delete promotional image
 * @param {string} id - Promotional ID
 * @returns {Promise} Deletion confirmation
 */
export const deletePromotional = async (id) => {
  try {
    const response = await api.delete(`/promotionals/delete-promotional/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting promotional:", error);
    throw error;
  }
};
