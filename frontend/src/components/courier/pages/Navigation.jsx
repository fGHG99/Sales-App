import { useState, useRef, useEffect } from "react";
import { Link, useLocation, Outlet, ScrollRestoration } from "react-router-dom";
import {
  Home,
  Package,
  User,
  Bell,
  Menu,
  X,
  MapPin,
  Clock,
} from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { mockNotifications } from "../../../utils/mockDataCourier";
import NotificationCard from "./NotificationCard";

const Navigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const closeTimeoutRef = useRef(null);
  const userDropdownRef = useRef(null);

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const navItems = [
    {
      path: "/courier",
      icon: Home,
      label: "Dashboard",
      description: "Overview & Stats",
    },
    {
      path: "/courier/orders",
      icon: Package,
      label: "Orders",
      description: "Manage Deliveries",
      badge: mockNotifications.filter((n) => !n.read && n.type === "new_order")
        .length,
    },
    {
      path: "/courier/profile",
      icon: User,
      label: "Profile",
      description: "Account Settings",
    },
  ];

  const quickActions = [
    { label: "Active Orders", count: 3, color: "bg-blue-500" },
    { label: "On Route", count: 1, color: "bg-green-500" },
  ];

  const openDropdown = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setShowNotifications(true);
  };

  const closeDropdown = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowNotifications(false);
    }, 100);
  };

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
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
              {/* Quick Status */}
              <div className="hidden xl:flex items-center space-x-4">
                {quickActions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-50"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${action.color}`}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {action.label}
                    </span>
                    <Badge className="bg-white text-gray-700 text-xs">
                      {action.count}
                    </Badge>
                  </div>
                ))}
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
              {/* Notifications */}
              <div
                className="relative"
                onMouseEnter={openDropdown}
                onMouseLeave={closeDropdown}
                ref={userDropdownRef}
              >
                <Button
                  variant="ghost"
                  className="p-2 hover:bg-blue-50"
                  onClick={handleNotificationClick}
                >
                  <Bell className="h-6 w-6 text-gray-600 hover:text-blue-700" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <p className="text-sm text-gray-600">
                        {unreadCount} unread messages
                      </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {mockNotifications.slice(0, 5).map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onClick={() => setShowNotifications(false)}
                        />
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <Button variant="ghost" className="w-full text-sm">
                        View All Notifications
                      </Button>
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
                  className="p-2"
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
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {mockNotifications.slice(0, 3).map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onClick={() => setShowNotifications(false)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="grid grid-cols-3 py-2">
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
        <ScrollRestoration />
        <Outlet />
      </main>
    </>
  );
};

export default Navigation;
