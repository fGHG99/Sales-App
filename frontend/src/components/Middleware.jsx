import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const user = localStorage.getItem("user");

      // If both token and user exist, user is authenticated
      if (token && user) {
        console.log(
          "✅ ProtectedRoute: Access token found, user authenticated"
        );
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // If no access token, try to refresh using refresh token (HTTP-only cookie)
      console.log(
        "🔄 ProtectedRoute: No access token found, attempting to refresh..."
      );
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { NewAccessToken } = response.data;

        if (NewAccessToken) {
          console.log("✅ ProtectedRoute: Token refreshed successfully");
          localStorage.setItem("accessToken", NewAccessToken);
          setIsAuthenticated(true);
        } else {
          console.log("❌ ProtectedRoute: No token returned from refresh");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log(
          "❌ ProtectedRoute: Token refresh failed, redirecting to login"
        );
        console.error("Refresh error:", error.response?.data);

        // Clear any stale data
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after check, redirect to login
  if (!isAuthenticated) {
    console.log(
      "🔒 ProtectedRoute: Not authenticated, redirecting to /auth/signin"
    );
    return <Navigate to="/auth/signin" replace />;
  }

  console.log(
    "✅ ProtectedRoute: User authenticated, rendering protected content"
  );
  return children;
};

export default ProtectedRoute;
