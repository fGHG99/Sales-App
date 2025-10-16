import api from "../utils/api";

/**
 * User Service
 * Handles all user-related API calls
 */

/**
 * Verify email with token
 * @param {string} token - Email verification token from URL params
 * @returns {Promise} Verification response
 */
export const verifyEmail = async (token) => {
  try {
    const response = await api.get(`/auth/verify/${token}`);
    return response.data;
  } catch (error) {
    console.error("Error verifying email:", error);
    throw error;
  }
};

/**
 * Resend verification email
 * @param {string} email - User email address
 * @returns {Promise} Resend verification response
 */
export const resendVerificationEmail = async (email) => {
  try {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
  } catch (error) {
    console.error("Error resending verification email:", error);
    throw error;
  }
};

/**
 * Submit a dispute for an order
 * @param {Object} disputeData - Dispute data
 * @param {string} disputeData.orderId - Order ID
 * @param {string} disputeData.reason - Dispute reason (WRONG_ITEM, DAMAGED_ITEM, MISSING_ITEM, LATE_DELIVERY, POOR_QUALITY, OTHER)
 * @param {string} disputeData.description - Dispute description
 * @param {string[]} disputeData.imageUrl - Array of image URLs as evidence (optional)
 * @returns {Promise} Dispute creation response
 */
export const submitDispute = async (disputeData) => {
  try {
    const response = await api.post("/disputes/submit-dispute", disputeData);
    return response.data;
  } catch (error) {
    console.error("Error submitting dispute:", error);
    throw error;
  }
};

/**
 * Get user's order history
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.status - Order status filter
 * @param {string} params.date - Date filter (YYYY-MM-DD)
 * @param {string} params.search - Search query
 * @returns {Promise} User's orders with pagination
 */
export const getUserOrders = async (params = {}) => {
  try {
    const response = await api.get("/order/my-orders", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};

/**
 * Get user profile
 * @returns {Promise} User profile data
 */
export const getUserProfile = async () => {
  try {
    const response = await api.get("/users/profile");
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise} Updated profile data
 */
export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put("/users/profile", profileData);
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Upload profile picture
 * @param {FormData} formData - Form data containing profile picture
 * @returns {Promise} Upload response
 */
export const uploadProfilePicture = async (formData) => {
  try {
    const response = await api.post("/users/profile/picture", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

/**
 * Complete an order (mark as completed)
 * @param {string} orderId - Order ID to complete
 * @returns {Promise} Order completion response
 */
export const completeOrder = async (orderId) => {
  try {
    const response = await api.patch(`/order/complete-order/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Error completing order:", error);
    throw error;
  }
};

export const getCategoriesName = async () => {
  try {
    const response = await api.get("/inventory/categories-name");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProducts = async (offset = 0, limit = 18) => {
  try {
    const response = await api.get("/inventory/products", {
      params: {
        offset,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductBySlug = async (slug) => {
  try {
    const response = await api.get(`/api/inventory/products/${slug}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRelatedProducts = async (
  categoryName,
  offset = 0,
  limit = 20
) => {
  try {
    const response = await api.get(`/inventory/related/${categoryName}`, {
      params: {
        offset,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching related products:", error);
    throw error;
  }
};

/**
 * Get trending products
 * @returns {Promise} Trending products data
 */
export const getTrendingProducts = async () => {
  try {
    const response = await api.get("/inventory/trending");
    return response.data;
  } catch (error) {
    console.error("Error fetching trending products:", error);
    throw error;
  }
};

/**
 * Get newest products
 * @returns {Promise} Newest products data
 */
export const getNewProducts = async () => {
  try {
    const response = await api.get("/inventory/new");
    return response.data;
  } catch (error) {
    console.error("Error fetching new products:", error);
    throw error;
  }
};

/**
 * Get product detail by ID
 * @param {string} productId - Product ID
 * @returns {Promise} Product detail data
 */
export const getProductById = async (productId) => {
  try {
    const response = await api.get(`/inventory/product/${productId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching product detail:", error);
    throw error;
  }
};
