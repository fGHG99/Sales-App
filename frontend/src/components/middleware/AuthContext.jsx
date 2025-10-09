import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [permissions, setPermissions] = useState([]); // ⬅️ Tambahkan ini
  const [user, setUser] = useState(null);

  const checkAuth = useCallback(async () => {
    setIsChecking(true);

    try {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } else {
        // Try to refresh token using Axios interceptor
        console.log("🔄 AuthContext: Attempting refresh via interceptor...");
        const res = await api.post("/auth/refresh");
        if (res.data?.NewAccessToken) {
          localStorage.setItem("accessToken", res.data.NewAccessToken);
          if (res.data.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
            setUser(res.data.user);
          }
          setIsAuthenticated(true);
        } else {
          throw new Error("Refresh failed");
        }
      }
    } catch (err) {
      console.error("❌ AuthContext: Authentication failed", err);
      handleLogout();
    } finally {
      setIsChecking(false);
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
        permissions, // ⬅️ Tambahkan ini
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
