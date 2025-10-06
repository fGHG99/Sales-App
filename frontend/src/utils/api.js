import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BE_API_URL,
  withCredentials: true, // Important: This sends HTTP-only cookies with requests
});

// Request interceptor - adds access token to every request
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint - refreshToken is sent automatically via HTTP-only cookie
        const response = await axios.post(
          `${import.meta.env.VITE_BE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { NewAccessToken } = response.data;

        // Update access token in localStorage
        localStorage.setItem("accessToken", NewAccessToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${NewAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is invalid or expired - logout user
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/auth/signin";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
