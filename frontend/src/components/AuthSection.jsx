import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import NotificationDropdown from "./User/user-dropdown/NotificationDropdown";
import UserDropdown from "./User/user-dropdown/UserDropdown";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import AuthSectionSkeleton from "./skeleton/AuthSectionSkeleton";
import AuthButtonsSkeleton from "./skeleton/AuthButtonsSkeleton";
import api from "../utils/api";

export default function AuthSection({
  isAuthenticated,
  user,
  handleCartClick,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const closeTimeoutRef = useRef(null);
  const userDropdownRef = useRef(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [userData, setUserData] = useState(user);
  const BE_URL = import.meta.env.VITE_BE_API_URL;
  const [cartCount, setCartCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [isLoadingCartCount, setIsLoadingCartCount] = useState(true);
  const [isLoadingNotifCount, setIsLoadingNotifCount] = useState(true);
  const [isLoadingPendingOrders, setIsLoadingPendingOrders] = useState(true);
  const [hasVisitedOrdersPage, setHasVisitedOrdersPage] = useState(false);

  // Check if user has visited orders page
  useEffect(() => {
    const visited = localStorage.getItem("hasVisitedOrdersPage");
    setHasVisitedOrdersPage(visited === "true");
  }, []);

  // Reset visited status when new pending orders appear
  useEffect(() => {
    if (pendingOrdersCount > 0 && hasVisitedOrdersPage) {
      // Check if there are new pending orders since last visit
      const lastVisitedCount = localStorage.getItem("lastVisitedPendingCount");
      const currentCount = pendingOrdersCount;

      console.log("🔍 Checking for new pending orders:", {
        currentCount,
        lastVisitedCount: lastVisitedCount ? parseInt(lastVisitedCount) : null,
        hasVisitedOrdersPage,
      });

      if (!lastVisitedCount || parseInt(lastVisitedCount) < currentCount) {
        // New orders appeared, reset visited status
        console.log(
          "🆕 New pending orders detected - red circle will reappear"
        );
        setHasVisitedOrdersPage(false);
        localStorage.removeItem("hasVisitedOrdersPage");
        localStorage.setItem(
          "lastVisitedPendingCount",
          currentCount.toString()
        );
      }
    }
  }, [pendingOrdersCount, hasVisitedOrdersPage]);

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) {
        setIsLoadingUserData(false);
        return;
      }

      try {
        setIsLoadingUserData(true);
        const response = await api.get("/users/me");
        const fetchedUser = response.data.user;

        setUserData(fetchedUser);

        // Update localStorage with fresh data
        localStorage.setItem("user", JSON.stringify(fetchedUser));

        // Set profile picture
        if (fetchedUser.image && fetchedUser.image.url) {
          setProfilePicture(`${BE_URL}${fetchedUser.image.url}`);
        } else {
          setProfilePicture(null);
        }

        console.log("✅ User data fetched from API:", fetchedUser);
      } catch (error) {
        console.error("❌ Failed to fetch user data:", error);
        // Fallback to localStorage
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        setUserData(storedUser);
        if (storedUser.image && storedUser.image.url) {
          setProfilePicture(`${BE_URL}${storedUser.image.url}`);
        }
      } finally {
        setIsLoadingUserData(false);
      }
    };

    fetchUserData();

    // Listen for custom event when user updates profile
    const handleUserUpdate = () => {
      fetchUserData();
    };

    window.addEventListener("userUpdated", handleUserUpdate);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, [isAuthenticated, BE_URL]);

  // Fetch cart count and listen for cart updates
  useEffect(() => {
    if (!isAuthenticated) {
      setCartCount(0);
      setIsLoadingCartCount(false);
      return;
    }

    const fetchCartCount = async () => {
      try {
        setIsLoadingCartCount(true);
        const res = await api.get("/cart/get-cart");
        const items = res.data?.cart?.cartItems || [];
        setCartCount(Array.isArray(items) ? items.length : 0);
      } catch (err) {
        setCartCount(0);
      } finally {
        setIsLoadingCartCount(false);
      }
    };

    fetchCartCount();

    const onCartUpdated = () => fetchCartCount();
    window.addEventListener("cartUpdated", onCartUpdated);
    return () => window.removeEventListener("cartUpdated", onCartUpdated);
  }, [isAuthenticated]);

  // Fetch notification count (total)
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifCount(0);
      setIsLoadingNotifCount(false);
      return;
    }
    let cancelled = false;
    const fetchNotifCount = async () => {
      try {
        setIsLoadingNotifCount(true);
        const res = await api.get("/users/notifications/count");
        if (!cancelled) setNotifCount(Number(res.data?.total || 0));
      } catch (e) {
        if (!cancelled) setNotifCount(0);
      } finally {
        if (!cancelled) setIsLoadingNotifCount(false);
      }
    };

    fetchNotifCount();

    // Optional: refresh on visibility change
    const onFocus = () => fetchNotifCount();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated]);

  // Fetch pending orders count
  useEffect(() => {
    if (!isAuthenticated) {
      setPendingOrdersCount(0);
      setIsLoadingPendingOrders(false);
      return;
    }
    let cancelled = false;
    const fetchPendingOrdersCount = async () => {
      try {
        setIsLoadingPendingOrders(true);
        const res = await api.get("/order/my-orders/status/PENDING");
        if (!cancelled) {
          const pendingCount = res.data?.orders?.length || 0;
          setPendingOrdersCount(pendingCount);
        }
      } catch (e) {
        if (!cancelled) setPendingOrdersCount(0);
      } finally {
        if (!cancelled) setIsLoadingPendingOrders(false);
      }
    };

    fetchPendingOrdersCount();

    // Listen for order updates
    const onOrderUpdated = () => fetchPendingOrdersCount();
    window.addEventListener("orderUpdated", onOrderUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("orderUpdated", onOrderUpdated);
    };
  }, [isAuthenticated]);

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

  const hasNotification = notifCount > 0;
  const hasPendingOrders = pendingOrdersCount > 0 && !hasVisitedOrdersPage;

  // Handle order history click
  const handleOrderHistoryClick = () => {
    console.log("👆 User clicked order history - red circle will disappear");
    setHasVisitedOrdersPage(true);
    localStorage.setItem("hasVisitedOrdersPage", "true");
    localStorage.setItem(
      "lastVisitedPendingCount",
      pendingOrdersCount.toString()
    );
  };

  // Show skeleton while loading
  if (
    isAuthenticated &&
    (isLoadingUserData ||
      isLoadingCartCount ||
      isLoadingNotifCount ||
      isLoadingPendingOrders)
  ) {
    return <AuthSectionSkeleton />;
  }

  // Show skeleton for non-authenticated state (while determining auth status)
  if (!isAuthenticated && isLoadingUserData) {
    return <AuthButtonsSkeleton />;
  }

  return (
    <div
      className={`flex items-center ${
        isAuthenticated ? "space-x-2" : "space-x-4"
      }`}
    >
      {/* Cart Section (shared) */}
      <button
        onClick={handleCartClick}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        aria-label="Shopping cart"
      >
        <img
          src="/assets/cart_icon.png"
          alt="Cart"
          className="w-6 h-6 object-contain"
        />
        {cartCount > 0 && (
          <span className="absolute -top-[-3px] -right-[-2px] flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
            {cartCount}
          </span>
        )}
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
                    {notifCount}
                  </span>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 z-50 w-64">
                <NotificationDropdown
                  isOpen={isOpen}
                  onToggle={() => setIsOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Order History */}
          <Link
            to="/user/orders"
            onClick={handleOrderHistoryClick}
            className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            aria-label="Order history"
          >
            <img
              src="/assets/order_icon.png"
              alt="Orders"
              className="w-6 h-6 object-contain"
            />
            {hasPendingOrders && (
              <span className="absolute -top-[-3px] -right-[-2px] flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white">
                {pendingOrdersCount}
              </span>
            )}
          </Link>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* User Menu with Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <div
              className="flex items-center space-x-1 cursor-pointer hover:text-blue-600 transition-colors duration-200"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
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
              <div className="absolute right-0 top-full mt-2 z-50">
                <UserDropdown
                  userData={userData}
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
