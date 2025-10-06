import { useState, useEffect } from "react";
import {
  Package,
  User,
  Truck,
  CreditCard,
  ShoppingBag,
  Shield,
  Mail,
  Settings,
  Bell,
} from "lucide-react";
import {
  transactionNotifications,
  informationNotifications,
} from "../data/MockNotifications";
import Pagination from "../../Pagination";

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Combine and add tab identifier to notifications
  useEffect(() => {
    const allNotifications = [
      ...transactionNotifications.map((n) => ({ ...n, tab: "transaction" })),
      ...informationNotifications.map((n) => ({ ...n, tab: "information" })),
    ].sort((a, b) => {
      // Simple timestamp sorting (in real app, use proper date parsing)
      const timeA = a.timestamp.includes("jam")
        ? 1
        : a.timestamp.includes("hari")
        ? parseInt(a.timestamp) * 24
        : 168;
      const timeB = b.timestamp.includes("jam")
        ? 1
        : b.timestamp.includes("hari")
        ? parseInt(b.timestamp) * 24
        : 168;
      return timeA - timeB;
    });

    setNotifications(allNotifications);
  }, []);

  // Filter notifications based on active tab
  useEffect(() => {
    let filtered = notifications;

    // Filter by tab
    if (activeTab === "transaction") {
      filtered = filtered.filter((n) => n.tab === "transaction");
    } else if (activeTab === "information") {
      filtered = filtered.filter((n) => n.tab === "information");
    }

    setFilteredNotifications(filtered);
    setCurrentPage(1); // Reset to first page when tab changes
  }, [notifications, activeTab]);

  const getTransactionIcon = (type) => {
    switch (type) {
      case "delivery":
        return <Truck className="w-5 h-5" />;
      case "payment":
        return <CreditCard className="w-5 h-5" />;
      case "order":
        return <ShoppingBag className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getInformationIcon = (type) => {
    switch (type) {
      case "profile":
        return <User className="w-5 h-5" />;
      case "security":
        return <Shield className="w-5 h-5" />;
      case "account":
        return <Mail className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200";
      case "warning":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "pending":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const transactionCount = notifications.filter(
    (n) => n.tab === "transaction"
  ).length;
  const informationCount = notifications.filter(
    (n) => n.tab === "information"
  ).length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const showPagination = filteredNotifications.length > itemsPerPage;

  // Get current page data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = filteredNotifications.slice(
    startIndex,
    endIndex
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of notifications list
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 min-w-0 py-4 px-6 text-sm font-semibold transition-all relative ${
                activeTab === "all"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Semua
              <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                {notifications.length}
              </span>
              {activeTab === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("transaction")}
              className={`flex-1 min-w-0 py-4 px-6 text-sm font-semibold transition-all relative ${
                activeTab === "transaction"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Transaksi
              <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                {transactionCount}
              </span>
              {activeTab === "transaction" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("information")}
              className={`flex-1 min-w-0 py-4 px-6 text-sm font-semibold transition-all relative ${
                activeTab === "information"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Informasi
              <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                {informationCount}
              </span>
              {activeTab === "information" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Tidak ada notifikasi
              </h3>
              <p className="text-gray-600">Anda belum memiliki notifikasi.</p>
            </div>
          ) : (
            currentNotifications.map((notification) => (
              <div
                key={`${notification.tab}-${notification.id}`}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6"
              >
                {notification.tab === "transaction" ? (
                  // Transaction Notification Layout
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(
                          notification.status
                        )}`}
                      >
                        {getTransactionIcon(notification.type)}
                        <span className="ml-2">{notification.category}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {notification.timestamp}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {notification.description}
                    </p>

                    {notification.product && (
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <img
                          src={notification.product.image}
                          alt={notification.product.name}
                          className="w-16 h-16 rounded-xl object-cover shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 leading-tight">
                            {notification.product.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Information Notification Layout
                  <div className="flex items-start space-x-4">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border ${getStatusColor(
                        notification.status
                      )}`}
                    >
                      {getInformationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {notification.title}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {notification.timestamp}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination - Bottom Right */}
        {showPagination && (
          <div className="mt-8 flex justify-end">
            <Pagination
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
