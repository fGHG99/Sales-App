import api from "../utils/api";

// ========================================
// USER MANAGEMENT SERVICES
// ========================================

/**
 * Get users with pagination and filters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} search - Search term for name/email
 * @param {string} roleId - Filter by role ID
 * @param {boolean} includeDeleted - Include deleted users (isDeleted field included in response)
 * @returns {Promise} - Users data with pagination (includes isDeleted field)
 */
export const getUsers = async (
  page = 1,
  limit = 10,
  search = "",
  roleId = "",
  includeDeleted = false
) => {
  try {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", limit);
    if (search) params.append("search", search);
    if (roleId) params.append("roleId", roleId);
    if (includeDeleted) params.append("includeDeleted", "true");

    const response = await api.get(`/support/users?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get single user by ID
 * @param {string} id - User ID
 * @returns {Promise} - User data
 */
export const getUserById = async (id) => {
  try {
    const response = await api.get(`/support/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise} - Created user data
 */
export const createUser = async (userData) => {
  try {
    const response = await api.post("/support/users", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise} - Updated user data
 */
export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/support/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Delete user (soft delete)
 * @param {string} id - User ID
 * @returns {Promise} - Success message
 */
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/support/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Reset user password
 * @param {string} id - User ID
 * @param {string} newPassword - New password
 * @returns {Promise} - Success message
 */
export const resetUserPassword = async (id, newPassword) => {
  try {
    const response = await api.put(`/support/users/${id}/reset-password`, {
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ========================================
// ROLE MANAGEMENT SERVICES
// ========================================

/**
 * Get all roles with permissions
 * @returns {Promise} - Roles data
 */
export const getRoles = async () => {
  try {
    const response = await api.get("/support/roles");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get single role by ID
 * @param {string} id - Role ID
 * @returns {Promise} - Role data
 */
export const getRoleById = async (id) => {
  try {
    const response = await api.get(`/support/roles/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Create new role
 * @param {Object} roleData - Role data
 * @returns {Promise} - Created role data
 */
export const createRole = async (roleData) => {
  try {
    const response = await api.post("/support/roles", roleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update role
 * @param {string} id - Role ID
 * @param {Object} roleData - Updated role data
 * @returns {Promise} - Updated role data
 */
export const updateRole = async (id, roleData) => {
  try {
    const response = await api.put(`/support/roles/${id}`, roleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Delete role (soft delete)
 * @param {string} id - Role ID
 * @returns {Promise} - Success message
 */
export const deleteRole = async (id) => {
  try {
    const response = await api.delete(`/support/roles/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ========================================
// USER SEARCH SERVICES
// ========================================

/**
 * Search users by name with pagination
 * @param {string} name - Name to search
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {boolean} includeDeleted - Include deleted users in search results
 * @returns {Promise} - Users data with pagination (includes isDeleted field)
 */
export const searchUsers = async (
  name,
  page = 1,
  limit = 10,
  includeDeleted = false
) => {
  try {
    const params = new URLSearchParams();
    params.append("name", name);
    params.append("page", page);
    params.append("limit", limit);
    if (includeDeleted) params.append("includeDeleted", "true");

    const response = await api.get(
      `/support/get-user/search?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ========================================
// PERMISSION MANAGEMENT SERVICES
// ========================================

/**
 * Get all permissions/access keys with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} - Permissions data with pagination
 */
export const getPermissions = async (page = 1, limit = 10) => {
  try {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", limit);

    const response = await api.get(`/support/permissions?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Create new permission
 * @param {Object} permissionData - Permission data
 * @returns {Promise} - Created permission data
 */
export const createPermission = async (permissionData) => {
  try {
    const response = await api.post("/support/permissions", permissionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update permission
 * @param {string} id - Permission ID
 * @param {Object} permissionData - Updated permission data
 * @returns {Promise} - Updated permission data
 */
export const updatePermission = async (id, permissionData) => {
  try {
    const response = await api.put(
      `/support/permissions/${id}`,
      permissionData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Delete permission (soft delete)
 * @param {string} id - Permission ID
 * @returns {Promise} - Success message with affected roles count
 */
export const deletePermission = async (id) => {
  try {
    const response = await api.delete(`/support/permissions/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Search permissions by accessKey with pagination
 * @param {string} accessKey - Access key to search
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {boolean} includeDeleted - Include deleted permissions in search results
 * @returns {Promise} - Permissions data with pagination (includes isDeleted field)
 */
export const searchPermissions = async (
  accessKey,
  page = 1,
  limit = 10,
  includeDeleted = false
) => {
  try {
    const params = new URLSearchParams();
    params.append("accessKey", accessKey);
    params.append("page", page);
    params.append("limit", limit);
    if (includeDeleted) params.append("includeDeleted", "true");

    const response = await api.get(
      `/support/permissions/search?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw error;
  }
};