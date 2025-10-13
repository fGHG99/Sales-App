import { useNavigate } from "react-router-dom";
import {
  Package,
  AlertCircle,
  Clock,
  MessageSquare,
  ChevronRight,
  Camera,
} from "lucide-react";

const NotificationCard = ({ notification, onClick, onMarkRead }) => {
  const navigate = useNavigate();

  const handleMarkAsRead = async () => {
    // Call parent's onMarkRead to trigger API call
    if (onMarkRead && !notification.hasRead && !notification.read) {
      await onMarkRead(notification.id);
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      "new-delivery-assignment": Package,
      "order-status-updated": AlertCircle,
      "delivery-proof-uploaded": Camera,
      system: Clock,
      customer_update: MessageSquare,
      // Legacy support
      new_order: Package,
      order_update: AlertCircle,
    };
    return iconMap[type] || AlertCircle;
  };

  const getNotificationColor = (type) => {
    // ✅ Highlight biru untuk notification yang belum dibaca (hasRead: false)
    if (!notification.hasRead && !notification.read) {
      return "bg-blue-50 border-l-blue-500 hover:bg-blue-100";
    }
    return "bg-gray-50 border-l-gray-300 hover:bg-gray-100";
  };

  /**
   * Format tanggal ke WIB timezone
   * Menampilkan format: "10:30 WIB" atau "12 Oct, 10:30 WIB"
   */
  const formatTimeWIB = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    // Format waktu ke WIB (UTC+7)
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    };

    const timeString = date.toLocaleTimeString("en-US", options);

    // Jika bukan hari ini, tambahkan tanggal
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

  const handleNotificationClick = async () => {
    // Mark as read
    await handleMarkAsRead();

    // Navigate to order if orderId exists
    if (notification.orderId) {
      navigate(`/courier/order/${notification.orderId}`);
    }

    if (onClick) onClick();
  };

  const Icon = getNotificationIcon(notification.type);

  return (
    <div
      className={`p-3 border-l-4 cursor-pointer transition-colors ${getNotificationColor(
        notification.type
      )}`}
      onClick={handleNotificationClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div
            className={`p-1.5 rounded-full ${
              notification.hasRead || notification.read
                ? "bg-gray-200"
                : "bg-blue-100"
            }`}
          >
            <Icon
              className={`h-4 w-4 ${
                notification.hasRead || notification.read
                  ? "text-gray-600"
                  : "text-blue-600"
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4
                className={`font-medium text-sm ${
                  notification.hasRead || notification.read
                    ? "text-gray-700"
                    : "text-gray-900"
                }`}
              >
                {notification.title || "Notification"}
              </h4>
              {!(notification.hasRead || notification.read) && (
                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message ||
                notification.data?.message ||
                "New notification"}
            </p>

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                {formatTimeWIB(
                  notification.createdAt || notification.timestamp
                )}
              </span>

              {notification.orderId && (
                <div className="flex items-center text-blue-600 hover:text-blue-800">
                  <span className="text-xs font-medium">View Order</span>
                  <ChevronRight className="h-3 w-3 ml-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
