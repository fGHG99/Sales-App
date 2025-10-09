// src/middleware/PermissionBasedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import AccessDeniedPage from "@/components/AccessDeniedPage";

const PermissionBasedRoute = ({
  children,
  requiredPermissions = [],
  permission, // optional alias for single permission
  redirectTo = "/",
  showAccessDenied = true,
}) => {
  const { isAuthenticated, isChecking, permissions } = useAuth();

  // normalize props: support both `permission` (string) and `requiredPermissions` (array)
  const required = useMemo(() => {
    if (permission && !requiredPermissions.length) return [permission];
    return requiredPermissions;
  }, [permission, requiredPermissions]);

  const isAuthorized = useMemo(() => {
    if (!required.length) return true;
    if (!permissions?.length) return false;

    return required.every((p) =>
      permissions.some((perm) => perm.accessKey === p)
    );
  }, [permissions, required]);

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

  // Not authenticated
  if (!isAuthenticated) return <Navigate to="/auth/signin" replace />;

  // Not authorized
  if (!isAuthorized)
    return showAccessDenied ? (
      <Navigate to="/access-denied" replace />
    ) : (
      <Navigate to={redirectTo} replace />
    );

  // Authorized
  return children;
};

export default PermissionBasedRoute;
