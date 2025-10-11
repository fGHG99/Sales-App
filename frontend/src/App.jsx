import {
  createBrowserRouter,
  RouterProvider,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import RootLayout from "./components/RootLayout";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Register from "./components/Register";
import Login from "./components/Login";
import AuthLayout from "./components/AuthLayout";
import TermsConditions from "./components/TermsCon";
import ProductDetail from "./components/ProductDetail";
import Cart from "./components/User/user-cart/Cart";
import NotFound from "./components/NotFound";
import ProductPageResult from "./components/ProductSearchResult";
import OrderHistory from "./components/OrderHistory";
import EditProfile from "./components/User/user-profile/EditProfile";
import AddressSearchWithHandler from "./components/address/pages/AddressSearchWHandler";
import OrderCheckout from "./components/User/user-order/OrderCheckout";
import CourierTracking from "./components/User/user-order/CourierTracking";
import AdminLayout from "./components/Admin/Admin-Layout";
import { EmailVerificationSent } from "./components/EmailVerif";
import AdminDashboard from "./components/Admin/Pages/Dashboard";
import OrderManagement from "./components/Admin/Pages/OrderManagement";
import DisputesManagement from "./components/Admin/Pages/DisputeManagement";
import SalesAnalytics from "./components/Admin/Pages/SalesAnalytics";
import AdminCourierTracking from "./components/Admin/Pages/CourierTracking";
import SuperAdminLayout from "./components/superAdmin/layout/SuperAdminLayout";
import SuperAdminDashboard from "./components/superAdmin/page/Dashboard";
import StoreManagement from "./components/superAdmin/page/StoreManagement";
import SuperAdminOrderManagement from "./components/superAdmin/page/OrderManagement";
import ProductManagement from "./components/superAdmin/page/ProductManagement";
import FeeSetup from "./components/superAdmin/page/FeeSetup";
import GlobalReports from "./components/superAdmin/page/GlobalReports";
import CourierDashboard from "./components/courier/pages/DashboardCourier";
import OrdersPage from "./components/courier/pages/Orders";
import ProfilePage from "./components/courier/pages/Profile";
import ForgotPassword from "./components/ForgotPass";
import MapNavigation from "./components/courier/pages/MapNavigation";
import Navigation from "./components/courier/pages/Navigation";
import UserLocation from "./components/courier/pages/UserLocation";
import StoreLocation from "./components/courier/pages/StoreLocation";
import SupportDashboard from "./components/it-support/pages/SupportDashboard";
import NotificationsPage from "./components/User/pages/NotificationsPage";
import api from "./utils/api";
import ProtectedRoute from "./components/middleware/ProtecedRoute";
import PermissionBasedRoute from "./components/middleware/Rbac";
import RouteRestriction from "./components/middleware/RouteRestriction";
import AccessDeniedPage from "./components/AccessDeniedPage";

// Mock category and other pages
const CategoryPage = () => {
  const { categoryName } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Kategori: {categoryName}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Explore products in the {categoryName} category
          </p>
          <div className="bg-white rounded-lg shadow-md p-12">
            <p className="text-gray-500 text-xl">
              Coming soon - Products will be displayed here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Email Verification Page Component
const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("emailUser") || "";

  const handleResendEmail = async () => {
    try {
      await api.post("/auth/resend-verification", { email });
      alert("Verification email resent successfully!");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to resend email. Please try again."
      );
    }
  };

  const handleBackToLogin = () => {
    navigate("/auth/signin");
  };

  return (
    <EmailVerificationSent
      email={email}
      onResendEmail={handleResendEmail}
      onBackToLogin={handleBackToLogin}
    />
  );
};

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: (
          <RouteRestriction allowedRoles={["user"]}>
            <Layout />
          </RouteRestriction>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: "category/:categoryName", element: <CategoryPage /> },
          { path: "search", element: <ProductPageResult /> },
          { path: "cart", element: <Cart /> },
          { path: "terms-conditions", element: <TermsConditions /> },
          { path: "p/:productname", element: <ProductDetail /> },
          { path: "notifications", element: <NotificationsPage /> },
        ],
      },
      {
        path: "/auth",
        element: <AuthLayout />,
        children: [
          { path: "signin", element: <Login /> },
          { path: "signup", element: <Register /> },
          { path: "verify-email", element: <EmailVerificationPage /> },
        ],
      },
      {
        path: "/user",
        element: (
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        ),
        children: [
          { path: "orders", element: <OrderHistory /> },
          { path: "profile", element: <EditProfile /> },
          { path: "addresses", element: <AddressSearchWithHandler /> },
        ],
      },
      {
        path: "/order",
        element: (
          <ProtectedRoute>
            {/* <PermissionBasedRoute requiredPermissions={["order.create"]}> */}
            <Layout />
            {/* </PermissionBasedRoute> */}
          </ProtectedRoute>
        ),
        children: [
          { path: "checkout/:orderId", element: <OrderCheckout /> },
          { path: "success/:orderId", element: <CourierTracking /> },
        ],
      },
      {
        path: "/courier",
        element: (
          <ProtectedRoute>
            <PermissionBasedRoute requiredPermissions={["courier.access"]}>
              <Navigation />
            </PermissionBasedRoute>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <CourierDashboard /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "forgot-password", element: <ForgotPassword /> },
          { path: "order/:orderId", element: <MapNavigation /> },
          {
            path: "customer-location/order/:orderId",
            element: <UserLocation />,
          },
          {
            path: "store-location/order/:orderId",
            element: <StoreLocation />,
          },
        ],
      },
      {
        path: "/admin",
        element: (
          <ProtectedRoute>
            <PermissionBasedRoute requiredPermissions={["admin.access"]}>
              <AdminLayout />
            </PermissionBasedRoute>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "orders", element: <OrderManagement /> },
          { path: "couriers", element: <AdminCourierTracking /> },
          { path: "disputes", element: <DisputesManagement /> },
          { path: "analytics", element: <SalesAnalytics /> },
        ],
      },
      {
        path: "/s-admin",
        element: (
          <ProtectedRoute>
            <PermissionBasedRoute requiredPermissions={["superadmin.access"]}>
              <SuperAdminLayout />
            </PermissionBasedRoute>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <SuperAdminDashboard /> },
          { path: "stores", element: <StoreManagement /> },
          { path: "orders", element: <SuperAdminOrderManagement /> },
          { path: "products", element: <ProductManagement /> },
          { path: "fees", element: <FeeSetup /> },
          { path: "reports", element: <GlobalReports /> },
        ],
      },
      {
        path: "/support",
        element: (
          <ProtectedRoute>
            <PermissionBasedRoute requiredPermissions={["support.access"]}>
              <SupportDashboard />
            </PermissionBasedRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: "/access-denied",
        element: <AccessDeniedPage />,
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
