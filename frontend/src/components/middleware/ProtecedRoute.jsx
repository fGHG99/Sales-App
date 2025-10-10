import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isChecking } = useAuth();
  const [showLoading, setShowLoading] = useState(true);

  // Prevent immediate redirects to reduce flickering
  useEffect(() => {
    if (!isChecking) {
      // Add a small delay to prevent flickering
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isChecking]);

  // Show loading state while checking auth or during the brief delay
  if (isChecking || showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("🔒 Redirecting to login");
    return <Navigate to="/auth/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;
