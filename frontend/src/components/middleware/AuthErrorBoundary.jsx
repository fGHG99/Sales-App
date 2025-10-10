import { Component } from "react";
import { Loader2 } from "lucide-react";

// Error Boundary must use class component (React limitation)
// This is a minimal wrapper - kept as simple as possible
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const isAuthError =
      error.message?.includes("auth") || error.message?.includes("401");

    if (isAuthError) {
      console.error("🚨 Authentication error caught:", error, errorInfo);

      // Clear corrupted auth data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      // Redirect to login after brief delay
      setTimeout(() => {
        window.location.href = "/auth/signin";
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Modern functional component wrapper
const AuthErrorBoundary = ({ children }) => {
  const fallbackUI = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Authentication Error
        </h2>
        <p className="text-gray-600 mb-6">
          Something went wrong with authentication. Redirecting to login...
        </p>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
      </div>
    </div>
  );

  return <ErrorBoundary fallback={fallbackUI}>{children}</ErrorBoundary>;
};

export default AuthErrorBoundary;
