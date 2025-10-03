import { useState, useRef, useEffect } from "react";
import { Menu, LogOut } from "lucide-react";
import AdminSearch from "./AdminSearch";
import LogoutModal from "../modal/logout-confirmation";
import NotificationDropdown from "../User/user-dropdown/NotificationDropdown";

export default function AdminNavbar({
  searchQuery,
  setSearchQuery,
  setSidebarOpen,
  onSearchSelect,
}) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [, setIsUserDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef(null);
  const userDropdownRef = useRef(null);

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

  // Cleanup timer saat component unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const hasNotification = true;
  const notif = [1, 2];

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Add your logout logic here
    console.log("User logged out");
    setShowLogoutModal(false);
    if (onClose) onClose();
    // Add actual logout functionality here
    // For example: dispatch logout action, clear localStorage, redirect, etc.
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
                      {notif.length}
                    </span>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="absolute top-full left-0 z-50 w-64">
                  <NotificationDropdown
                    isOpen={isOpen}
                    onToggle={setIsOpen}
                    notifications={notif}
                  />
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="flex items-center space-x-3">
              <img
                className="h-8 w-8 rounded-full"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt="Admin Avatar"
                data-testid="admin-avatar"
              />
              <div className="hidden md:block">
                <div
                  className="text-sm font-medium text-gray-900"
                  data-testid="admin-name"
                >
                  John Admin
                </div>
                <div
                  className="text-xs text-gray-500"
                  data-testid="admin-email"
                >
                  admin@geeksales.com
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
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
