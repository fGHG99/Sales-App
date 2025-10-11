import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";

/**
 * RouteRestriction Middleware
 *
 * Controls access to routes based on user authentication and role type.
 * - Allows unauthenticated users (guests/visitors) to access the route
 * - Prevents authenticated users with non-allowed roles from accessing
 * - Redirects authenticated users with wrong roles to their dashboards
 *
 * Usage:
 * <RouteRestriction allowedRoles={["user"]}>
 *   <HomePage />
 * </RouteRestriction>
 *
 * @param {Array<string>} allowedRoles - Array of role types allowed to access this route
 * @param {ReactNode} children - Component to render if access is granted
 */
const RouteRestriction = ({ children, allowedRoles = ["user"] }) => {
  const { isAuthenticated, isChecking, user } = useAuth();

  // Get user's role type
  const userRoleType = useMemo(() => {
    return user?.role?.roleType || null;
  }, [user]);

  // Check if user's role is allowed
  const isAllowed = useMemo(() => {
    // If no role type (null/undefined) for authenticated user, treat as "user" role
    if (!userRoleType) {
      return allowedRoles.includes("user");
    }
    return allowedRoles.includes(userRoleType);
  }, [userRoleType, allowedRoles]);

  // Role-based redirect mapping
  const getRoleRedirectPath = useMemo(() => {
    const redirectMap = {
      courier: "/courier",
      superadmin: "/s-admin",
      admin: "/admin",
      itsupport: "/support",
      user: "/",
    };
    return redirectMap[userRoleType] || "/";
  }, [userRoleType]);

  // Loading state
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center text-gray-600">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p>Checking access...</p>
        </div>
      </div>
    );
  }

  // ✅ Allow unauthenticated users (guests/visitors) to access
  if (!isAuthenticated) {
    console.log(
      "👤 RouteRestriction: Guest access granted (not authenticated)"
    );
    return <>{children}</>;
  }

  // ❌ Authenticated but not allowed - redirect to role-specific dashboard
  if (!isAllowed) {
    console.log(`🚫 RouteRestriction: Access denied`);
    console.log(`   User role: "${userRoleType || "no-role"}"`);
    console.log(`   Allowed roles: ${allowedRoles.join(", ")}`);
    console.log(`   Redirecting to: ${getRoleRedirectPath}`);
    return <Navigate to={getRoleRedirectPath} replace />;
  }

  // ✅ Authenticated and allowed
  console.log(
    `✅ RouteRestriction: Access granted for role "${
      userRoleType || "no-role"
    }"`
  );
  return <>{children}</>;
};

export default RouteRestriction;
