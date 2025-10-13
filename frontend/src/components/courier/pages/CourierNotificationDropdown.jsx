import { useState, useEffect } from "react";
import {
  Package,
  X,
  Bell,
  AlertCircle,
  Clock,
  MessageSquare,
  Camera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationAsRead,
} from "../../../services/courierService";

const CourierNotificationDropdown = ({ isOpen, onToggle }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toLink = () => {
    navigate("/courier/notifications");
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const fetchLatest = async () => {
      try {
        setLoading(true);
        const response = await getNotifications(1, 10, false);
        if (cancelled) return;
        const latest = Array.isArray(response?.notifications)
          ? response.notifications
          : [];
        setItems(latest);
      } catch (e) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLatest();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const getNotificationIcon = (type) => {
    const iconMap = {
      "new-delivery-assignment": Package,
      "order-status-updated": AlertCircle,
      "delivery-proof-uploaded": Camera,
      system: Clock,
      customer_update: MessageSquare,
      new_order: Package,
      order_update: AlertCircle,
    };
    return iconMap[type] || AlertCircle;
  };

  const getStatusColor = (hasRead) => {
    return hasRead ? "text-gray-600 bg-gray-50" : "text-blue-600 bg-blue-50";
  };

  const markAsReadLocal = (id) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, hasRead: true } : n))
    );
  };

  const markAsReadRemote = async (id) => {
    try {
      await markNotificationAsRead(id);
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const handleCardClick = (n) => {
    if (!n.hasRead) {
      markAsReadLocal(n.id);
      markAsReadRemote(n.id);
    }
    if (n.orderId) {
      navigate(`/courier/order/${n.orderId}`);
    }
    if (onToggle) onToggle();
  };

  const formatTimeWIB = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const options = {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    };

    const timeString = date.toLocaleTimeString("en-US", options);

    if (!isToday) {
      const dateOptions = {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Jakarta",
      };
      const dateString = date.toLocaleDateString("en-US", dateOptions);
      return `${dateString}, ${timeString} WIB`;
    }

    return `${timeString} WIB`;
  };

  if (!isOpen) return null;

  const EmptyState = (
    <div className="p-6 text-center text-gray-500">
      <Bell className="w-6 h-6 mx-auto mb-2 text-gray-300" />
      Tidak ada notifikasi
    </div>
  );

  const cardBaseCls = (hasRead) =>
    `rounded-xl border p-4 shadow-sm transition-all duration-200 cursor-pointer ${
      hasRead
        ? "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm"
        : "bg-blue-50 border-blue-200 hover:bg-blue-100"
    }`;

  // Mobile Modal Layout
  if (isMobile) {
    return (
      <>
        {/* Mobile Overlay */}
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onToggle}
        />

        {/* Mobile Modal */}
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Notifikasi</h3>
            <button
              onClick={onToggle}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="p-4 space-y-3">
                  <div className="h-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-20 bg-gray-100 rounded animate-pulse" />
                </div>
              ) : items.length === 0 ? (
                EmptyState
              ) : (
                <div className="p-4 space-y-4">
                  {items.map((n) => {
                    const Icon = getNotificationIcon(n.type);
                    return (
                      <div
                        key={n.id}
                        className={cardBaseCls(n.hasRead)}
                        onClick={() => handleCardClick(n)}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(
                              n.hasRead
                            )}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-900 text-base">
                                {n.title}
                              </h4>
                              {!n.hasRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-2">
                              {n.message}
                            </p>
                            <span className="text-xs text-gray-400">
                              {formatTimeWIB(n.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              className="w-full py-3 text-center text-base text-blue-600 hover:text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
              onClick={toLink}
            >
              Lihat Selengkapnya
            </button>
          </div>
        </div>
      </>
    );
  }

  // Desktop Dropdown Layout
  return (
    <>
      <div className="absolute top-full right-0 mt-3 w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              Notifikasi Kurir
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="h-96 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-hide">
            {loading ? (
              <div className="p-4 space-y-3">
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : items.length === 0 ? (
              EmptyState
            ) : (
              <div className="p-4 space-y-3">
                {items.map((n, index) => {
                  const Icon = getNotificationIcon(n.type);
                  return (
                    <div
                      key={n.id}
                      className={cardBaseCls(n.hasRead) + " group"}
                      onClick={() => handleCardClick(n)}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(
                            n.hasRead
                          )}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {n.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400">
                                {formatTimeWIB(n.createdAt)}
                              </span>
                              {!n.hasRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                      {index < items.length - 1 && (
                        <div className="mt-4 border-b border-gray-100"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={toLink}
            className="w-full py-3 text-center text-sm text-blue-600 hover:text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
          >
            Lihat Selengkapnya
          </button>
        </div>
      </div>
    </>
  );
};

export default CourierNotificationDropdown;
