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

// Track ongoing refresh to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

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

      // Skip refresh for auth endpoints to prevent infinite loops
      if (originalRequest.url?.includes("/auth/")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

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

        // Process any queued requests
        processQueue(null, NewAccessToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${NewAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Process queue with error
        processQueue(refreshError, null);

        // Only redirect if it's a 401 (invalid refresh token)
        if (refreshError.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          window.location.href = "/auth/signin";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
