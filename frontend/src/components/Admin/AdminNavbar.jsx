import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import AdminSearch from "./AdminSearch";
import LogoutModal from "../modal/logout-confirmation";
import NotificationDropdown from "../User/user-dropdown/NotificationDropdown";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import api from "../../utils/api";
import { getCurrentUser, getNotifications } from "../../services/adminService";

export default function AdminNavbar({
  searchQuery,
  setSearchQuery,
  setSidebarOpen,
  onSearchSelect,
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [, setIsUserDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const closeTimeoutRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Get user initials from name
  const getInitials = (name) => {
    if (!name) return "U";

    const nameParts = name.trim().split(" ");

    if (nameParts.length >= 2) {
      // Take first letter of first two words
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    } else {
      // Take first two letters of single word
      return name.substring(0, 2).toUpperCase();
    }
  };

  const openDropdown = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setIsOpen(true);
  };

  const closeDropdown = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoadingUser(true);
        const response = await getCurrentUser();
        setUserData(response.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
        // If user data fetch fails, might indicate auth issue
        // Keep userData as null, component will show loading state or fallback
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications(10, 1, "all");
        setNotifications(response.notifications || []);
        setUnreadCount(response.pagination?.unreadCount || 0);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        // Keep empty notifications on error
      }
    };

    fetchNotifications();
  }, []);

  // Cleanup timer saat component unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const hasNotification = unreadCount > 0;

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      console.log("🔵 [AdminNavbar] confirmLogout started");
      setIsLoggingOut(true);

      // Call the logout API endpoint
      console.log("🔵 [AdminNavbar] Calling POST /auth/logout...");
      const response = await api.post("/auth/logout");
      console.log("✅ [AdminNavbar] Logout API successful:", response.data);

      // Clear local storage
      console.log("🔵 [AdminNavbar] Clearing localStorage...");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      console.log("✅ [AdminNavbar] localStorage cleared");

      // Close the modal
      setShowLogoutModal(false);

      // Redirect to login page
      console.log("🔵 [AdminNavbar] Redirecting to /login...");
      navigate("/auth/signin");
      console.log("✅ [AdminNavbar] Logout complete");
    } catch (error) {
      console.error("❌ [AdminNavbar] Logout API error:", error);

      // Even if API call fails, clear local data and logout
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      // Close the modal
      setShowLogoutModal(false);

      // Redirect
      navigate("/auth/signin");
    } finally {
      setIsLoggingOut(false);
    }
  };
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-3"
              data-testid="mobile-menu-button"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>

            {/* Admin Search Component */}
            <div className="w-80">
              <AdminSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelect={onSearchSelect}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div
              className="relative"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
            >
              <button
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                aria-label="Notifications"
              >
                <div className="relative w-6 h-6">
                  <img
                    src="/assets/notification_icon.png"
                    alt="Notification"
                    className="w-6 h-6 object-contain"
                  />
                  {hasNotification && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="absolute top-full left-0 z-50 w-64">
                  <NotificationDropdown
                    isOpen={isOpen}
                    onToggle={setIsOpen}
                    notifications={notifications}
                  />
                </div>
              )}
            </div>

            {/* Profile section */}
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                {userData?.image?.url ? (
                  <AvatarImage
                    src={`${import.meta.env.VITE_BE_API_URL}${
                      userData.image.url
                    }`}
                    alt={userData?.name || "Admin Avatar"}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {loadingUser
                    ? "..."
                    : getInitials(userData?.name || "Admin User")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <div
                  className="text-sm font-medium text-gray-900"
                  data-testid="admin-name"
                >
                  {loadingUser ? "Loading..." : userData?.name || "Admin User"}
                </div>
                <div
                  className="text-xs text-gray-500"
                  data-testid="admin-email"
                >
                  {loadingUser
                    ? "..."
                    : userData?.email || "admin@geeksales.com"}
                </div>
              </div>
              <div className="p-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors duration-200 group"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showLogoutModal &&
        createPortal(
          <LogoutModal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={confirmLogout}
            isLoading={isLoggingOut}
          />,
          document.body
        )}
    </div>
  );
}
