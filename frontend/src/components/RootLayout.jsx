import { Outlet } from "react-router-dom";
import { AuthProvider } from "./middleware/AuthContext";

/**
 * RootLayout - Wrapper component that provides Auth context to all routes
 * This ensures AuthProvider is inside Router context so useNavigate() works
 */
const RootLayout = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
};

export default RootLayout;
