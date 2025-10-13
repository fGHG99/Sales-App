import { useState, useRef, useEffect } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  Outlet,
  ScrollRestoration,
} from "react-router-dom";
import {
  Home,
  Package,
  User,
  Bell,
  Menu,
  X,
  MapPin,
  Clock,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import {
  getCourierOrders,
  getCourierProfile,
  getNotifications,
  markNotificationAsRead,
} from "../../../services/courierService";
import NotificationCard from "./NotificationCard";
import NotificationSkeleton from "../../skeleton/NotificationSkeleton";
import LogoutModal from "../../modal/logout-confirmation";
import CourierNotificationDropdown from "./CourierNotificationDropdown";
import api from "../../../utils/api";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showDesktopNotifications, setShowDesktopNotifications] =
    useState(false);
  const closeTimeoutRef = useRef(null);
  const closeNotificationTimeoutRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // ✅ State untuk data dari backend
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [onRouteCount, setOnRouteCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // ✅ User data state (sesuaikan dengan data dari API/context Anda)
  const [userData, setUserData] = useState(null);
  const [profilePicture, setProfilePicture] = useState("");
  const BE_URL = import.meta.env.VITE_BE_API_URL;

  /**
   * Fetch notifications from backend using service function
   */
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await getNotifications(1, 10, false);

      if (response && Array.isArray(response.notifications)) {
        setNotifications(response.notifications);
        setUnreadCount(response.pagination?.unreadCount || 0);
      }
    } catch (err) {
      console.error("❌ Failed to fetch notifications:", err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const fetchCourierProfile = async () => {
    try {
      const res = await getCourierProfile();
      setUserData(res.courier);

      if (res.courier.image && res.courier.image.url) {
        setProfilePicture(`${BE_URL}${res.courier.image.url}`);
        console.log("✅ Profile picture loaded:", res.courier.image.url);
      } else {
        setProfilePicture(null);
      }
    } catch (error) {
      console.error("❌ Failed to fetch courier profile:", error);
      if (error.response?.status === 401) {
        handleLogout(); // jika token invalid, logout
      }
    }
  };

  /**
   * Fetch active orders count using new API with statusCounts
   */
  const fetchActiveOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const response = await getCourierOrders({
        filter: "active",
        enablePagination: false,
      });

      if (response) {
        const { statusCounts } = response;
        setActiveOrdersCount(statusCounts?.active || 0);
        setOnRouteCount(statusCounts?.OUT_FOR_DELIVERY || 0);
      }
    } catch (err) {
      console.error("❌ Failed to fetch active orders:", err);
      setActiveOrdersCount(0);
      setOnRouteCount(0);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  /**
   * Mark notification as read using service function
   */
  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prevNotifs) =>
        prevNotifs.map((n) =>
          n.id === notificationId ? { ...n, hasRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("❌ Failed to mark notification as read:", err);
      fetchNotifications();
    }
  };

  /**
   * Initial data fetch on component mount
   */
  useEffect(() => {
    // --- fungsi utama ---
    fetchNotifications();
    fetchActiveOrders();
    fetchCourierProfile();

    // --- interval 30 detik ---
    const interval = setInterval(() => {
      fetchNotifications();
      fetchActiveOrders();
      fetchCourierProfile();
    }, 30000);

    // --- listener custom event ---
    const handleUserUpdate = () => {
      console.log(
        "🔄 User updated event received, refetching courier profile..."
      );
      fetchCourierProfile();
    };

    window.addEventListener("userUpdated", handleUserUpdate);

    // --- cleanup ---
    return () => {
      clearInterval(interval);
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  const navItems = [
    {
      path: "/courier",
      icon: Home,
      label: "Dashboard",
      description: "",
    },
    {
      path: "/courier/orders",
      icon: Package,
      label: "Order history",
      description: "",
    },
  ];

  const openNotificationDropdown = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setShowNotifications(true);
  };

  const closeNotificationDropdown = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowNotifications(false);
    }, 100);
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const openDesktopNotificationDropdown = () => {
    if (closeNotificationTimeoutRef.current) {
      clearTimeout(closeNotificationTimeoutRef.current);
    }
    setShowDesktopNotifications(true);
  };

  const closeDesktopNotificationDropdown = () => {
    closeNotificationTimeoutRef.current = setTimeout(() => {
      setShowDesktopNotifications(false);
    }, 100);
  };

  // Cleanup timer saat component unmount
  useEffect(() => {
    return () => {
      if (closeNotificationTimeoutRef.current) {
        clearTimeout(closeNotificationTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await api.post("/auth/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setLogoutOpen(false);
      navigate("/auth/signin");
    } catch (error) {
      console.error("❌ Logout error:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setLogoutOpen(false);
      navigate("/auth/signin");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-8">
              <div className="flex-shrink-0 flex items-center">
                <Package className="h-8 w-8 text-blue-600 mr-2" />
                <div>
                  <span className="text-xl font-bold text-gray-900">
                    CourierPro
                  </span>
                  <div className="text-xs text-gray-500">
                    Delivery Management
                  </div>
                </div>
              </div>
            </div>
            {/* Navigation Items */}
            <div className="flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative group flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    <div className="flex flex-col">
                      <span>{item.label}</span>
                      <span
                        className={`text-xs ${
                          isActive
                            ? "text-blue-100"
                            : "text-gray-400 group-hover:text-blue-500"
                        }`}
                      >
                        {item.description}
                      </span>
                    </div>
                    {item.badge > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}

              {/* Desktop Notification Dropdown */}
              <div
                className="relative"
                onMouseEnter={openDesktopNotificationDropdown}
                onMouseLeave={closeDesktopNotificationDropdown}
              >
                <button
                  className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showDesktopNotifications && (
                  <CourierNotificationDropdown
                    isOpen={showDesktopNotifications}
                    onToggle={() => setShowDesktopNotifications(false)}
                  />
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative" ref={userDropdownRef}>
                <div
                  className="flex items-center space-x-1 cursor-pointer hover:text-blue-600 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation(); // ✅ mencegah event bubble ke document
                    setIsUserDropdownOpen(!isUserDropdownOpen);
                  }}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={profilePicture}
                        alt="Profile"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-semibold">
                        {userData?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="font-regular text-sm text-gray-700 ml-2 overflow-hidden whitespace-nowrap select-none">
                    {(() => {
                      const name = userData?.name || "User";
                      return name.length > 4 ? name.slice(0, 4) + "..." : name;
                    })()}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      isUserDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* User Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={profilePicture}
                            alt="Profile"
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-semibold">
                            {userData?.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {userData?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {userData?.email || "user@example.com"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/courier/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation(); // ✅ mencegah event global close
                          setIsUserDropdownOpen(false);
                        }}
                      >
                        <User className="h-4 w-4 mr-3 text-gray-500" />
                        My Profile
                      </Link>
                    </div>
                    <div className="border-t border-gray-200 py-1">
                      <button
                        onClick={() => setLogoutOpen(true)}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-lg font-bold text-gray-900">
                CourierPro
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {/* Mobile Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <Badge className="h-5 px-2 bg-red-500 text-white text-xs flex items-center justify-center">
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {isLoadingNotifications ? (
                        <NotificationSkeleton count={3} />
                      ) : notifications.filter((n) => !n.hasRead).length > 0 ? (
                        notifications
                          .filter((n) => !n.hasRead)
                          .slice(0, 3)
                          .map((notification) => (
                            <NotificationCard
                              key={notification.id}
                              notification={notification}
                              onMarkRead={markAsRead}
                              onClick={() => setShowNotifications(false)}
                            />
                          ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No unread notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile User Avatar */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="p-1"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profilePicture}
                      alt="Profile"
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-semibold">
                      {userData?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {/* Mobile User Dropdown */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={profilePicture}
                            alt="Profile"
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-semibold">
                            {userData?.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {userData?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {userData?.email || "user@example.com"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/courier/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3 text-gray-500" />
                        My Profile
                      </Link>
                    </div>
                    <div className="border-t border-gray-200 py-1">
                      <button
                        onClick={() => setLogoutOpen(true)}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="grid grid-cols-2 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center py-2 px-1 relative ${
                    isActive ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  <Icon className="h-6 w-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <Badge className="absolute top-0 right-2 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
        {/* Add padding for mobile fixed elements */}
        <div className="pb-20"></div>
      </div>
      {/* Add padding for desktop fixed nav */}
      <div className="hidden lg:block h-16"></div>
      {/* Courier page content */}
      <main className="min-h-screen bg-gray-50">
        <LogoutModal
          isOpen={logoutOpen}
          onClose={() => setLogoutOpen(false)}
          onConfirm={handleLogout}
          isLoading={isLoggingOut}
        />
        <ScrollRestoration />
        <Outlet />
      </main>
    </>
  );
};

export default Navigation;
