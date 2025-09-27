import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import NotificationDropdown from "./User/user-dropdown/NotificationDropdown";
import UserDropdown from "./User/user-dropdown/UserDropdown";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function AuthSection({
  isAuthenticated,
  user,
  handleCartClick,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef(null);
  const userDropdownRef = useRef(null);
  const [profilePicture, setProfilePicture] = useState(user.profilePicture);

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

  return (
    <div
      className={`flex items-center ${
        isAuthenticated ? "space-x-2" : "space-x-4"
      }`}
    >
      {/* Cart Section (shared) */}
      <button
        onClick={handleCartClick}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        aria-label="Shopping cart"
      >
        <img
          src="/assets/cart_icon.png"
          alt="Cart"
          className="w-6 h-6 object-contain"
        />
      </button>

      {/* Auth Section */}
      {!isAuthenticated ? (
        <>
          <Link
            to="/auth/signin"
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-inter font-medium"
          >
            Masuk
          </Link>
          <Link
            to="/auth/signup"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-inter font-medium"
          >
            Daftar
          </Link>
        </>
      ) : (
        <>
          {/* Notification (icon + dropdown container) */}
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

          {/* Order History */}
          <Link
            to="/user/orders"
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            aria-label="Order history"
          >
            <img
              src="/assets/order_icon.png"
              alt="Orders"
              className="w-6 h-6 object-contain"
            />
          </Link>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* User Menu with Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <div
              className="flex items-center space-x-1 cursor-pointer hover:text-blue-600 transition-colors duration-200"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 overflow-hidden">
                <Avatar className="h-32 w-32 border-2 border-gray-200 shadow-sm">
                  <AvatarImage
                    src={profilePicture}
                    alt="Profile"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-base font-semibold">
                    {user?.username?.charAt(0).toUpperCase() || "U"}{" "}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="font-regular text-sm text-gray-700 ml-2 overflow-hidden whitespace-nowrap select-none">
                {(() => {
                  const name = user?.name || "User";
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
              <div className="absolute right-0 top-full mt-2 z-50">
                <UserDropdown
                  userData={user}
                  onClose={() => setIsUserDropdownOpen(false)}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
