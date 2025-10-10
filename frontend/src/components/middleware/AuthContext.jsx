import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    console.log("🚪 Logging out user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    setPermissions([]);
    navigate("/auth/signin");
  }, [navigate]);

  // Role-based redirect function
  const redirectBasedOnRole = useCallback(
    (userData) => {
      const roleType = userData?.role?.roleType;

      console.log("🔀 Redirecting based on role:");
      console.log("   User data:", userData);
      console.log("   Role object:", userData?.role);
      console.log("   Role type:", roleType);

      switch (roleType) {
        case "courier":
          console.log("   ➡️ Navigating to /courier");
          navigate("/courier", { replace: true });
          break;
        case "superadmin":
          console.log("   ➡️ Navigating to /s-admin");
          navigate("/s-admin", { replace: true });
          break;
        case "admin":
          console.log("   ➡️ Navigating to /admin");
          navigate("/admin", { replace: true });
          break;
        case "itsupport":
          console.log("   ➡️ Navigating to /support");
          navigate("/support", { replace: true });
          break;
        case "user":
        default:
          console.log("   ➡️ Navigating to / (default/user)");
          navigate("/", { replace: true });
          break;
      }
    },
    [navigate]
  );

  const checkAuth = useCallback(async () => {
    setIsChecking(true);

    try {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        // Validate token by making a simple API call instead of assuming it's valid
        try {
          await api.get("/users/permissions");
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          console.log("✅ Token is valid");
        } catch (verifyError) {
          // Token is invalid, try to refresh
          console.log("🔄 Token invalid, attempting refresh...");
          await attemptTokenRefresh();
        }
      } else {
        // No token or user data, try to refresh using HTTP-only cookie
        console.log("🔄 No stored token, attempting refresh...");
        await attemptTokenRefresh();
      }
    } catch (err) {
      console.error("❌ Authentication failed", err);
      handleLogout();
    } finally {
      setIsChecking(false);
    }
  }, [handleLogout]);

  const attemptTokenRefresh = useCallback(async () => {
    try {
      const res = await api.post("/auth/refresh");
      if (res.data?.NewAccessToken) {
        localStorage.setItem("accessToken", res.data.NewAccessToken);
        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
          setUser(res.data.user);
        }
        setIsAuthenticated(true);
        console.log("✅ Token refreshed successfully");
      } else {
        throw new Error("No access token in refresh response");
      }
    } catch (refreshError) {
      // Only throw if it's not a 401 (which means refresh token is invalid)
      if (refreshError.response?.status === 401) {
        console.log("🔒 Refresh token invalid or expired");
      } else {
        console.error("❌ Refresh attempt failed", refreshError);
      }
      throw refreshError;
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await api.get("/users/permissions");
      const perms = Array.isArray(res.data?.permissions)
        ? res.data.permissions.map((k) => ({ accessKey: k }))
        : [];
      setPermissions(perms);
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // fetch permissions after authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPermissions();
    } else {
      setPermissions([]);
    }
  }, [isAuthenticated, fetchPermissions]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isChecking,
        user,
        permissions,
        handleLogout,
        checkAuth,
        redirectBasedOnRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
