import { useState, useEffect } from "react";
import {
  Package,
  User,
  X,
  Truck,
  CreditCard,
  ShoppingBag,
  Shield,
  Mail,
  Settings,
  Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";

const NotificationDropdown = ({ isOpen, onToggle }) => {
  const [activeTab, setActiveTab] = useState("transaction");
  const [isMobile, setIsMobile] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toLink = () => {
    navigate("/notifications");
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getTabType = (tab) =>
    tab === "transaction"
      ? "ORDER"
      : tab === "information"
      ? "INFO"
      : undefined;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const fetchLatest = async () => {
      try {
        setLoading(true);
        const params = { limit: 10 };
        const type = getTabType(activeTab);
        if (type) params.type = type;
        const res = await api.get("/users/notifications", { params });
        if (cancelled) return;
        const latest = Array.isArray(res.data?.notifications)
          ? res.data.notifications
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
  }, [isOpen, activeTab]);

  const getTransactionIcon = (type) => {
    switch (type) {
      case "delivery":
        return <Truck className="w-4 h-4" />;
      case "payment":
        return <CreditCard className="w-4 h-4" />;
      case "order":
        return <ShoppingBag className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getInformationIcon = (type) => {
    switch (type) {
      case "profile":
        return <User className="w-4 h-4" />;
      case "security":
        return <Shield className="w-4 h-4" />;
      case "account":
        return <Mail className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-amber-600 bg-amber-50";
      case "pending":
        return "text-blue-600 bg-blue-50";
      case "info":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const markAsReadLocal = (id) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, hasRead: true } : n))
    );
  };

  const markAsReadRemote = async (id) => {
    try {
      await api.patch(`/users/notifications/${id}/read`);
    } catch (e) {
      // optional: rollback if needed, but keep lazy update for snappy UX
    }
  };

  const handleCardClickOrder = (n) => {
    if (!n.hasRead) {
      markAsReadLocal(n.id);
      markAsReadRemote(n.id);
    }
    navigate("/notifications", { state: { openNotification: n } });
    if (onToggle) onToggle();
  };

  const handleCardClickInfo = (n) => {
    if (!n.hasRead) {
      markAsReadLocal(n.id);
      markAsReadRemote(n.id);
    }
    // do nothing else for info type
  };

  if (!isOpen) return null;

  const EmptyState = (
    <div className="p-6 text-center text-gray-500">
      <Bell className="w-6 h-6 mx-auto mb-2 text-gray-300" />
      Tidak ada notifikasi
    </div>
  );

  const cardBaseCls = (hasRead) =>
    `rounded-xl border p-4 shadow-sm transition-all duration-200 ${
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

          {/* Mobile Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            <button
              onClick={() => setActiveTab("transaction")}
              className={`flex-1 py-4 px-6 text-base font-semibold transition-all relative ${
                activeTab === "transaction"
                  ? "text-blue-600 bg-white"
                  : "text-gray-500"
              }`}
            >
              Transaksi
              {activeTab === "transaction" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("information")}
              className={`flex-1 py-4 px-6 text-base font-semibold transition-all relative ${
                activeTab === "information"
                  ? "text-blue-600 bg-white"
                  : "text-gray-500"
              }`}
            >
              Informasi
              {activeTab === "information" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
              )}
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
              ) : activeTab === "transaction" ? (
                <div className="p-4 space-y-4">
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={cardBaseCls(n.hasRead)}
                      onClick={() => handleCardClickOrder(n)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            "pending"
                          )}`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span className="ml-2">Transaksi</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(n.createdAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2 text-base">
                        {n.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-1 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={cardBaseCls(n.hasRead)}
                      onClick={() => handleCardClickInfo(n)}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(
                            "info"
                          )}`}
                        >
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900 text-base">
                              {n.title}
                            </h4>
                            <span className="text-xs text-gray-400 ml-2">
                              {new Date(n.createdAt).toLocaleString("id-ID")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
            <h3 className="text-xl font-bold text-gray-900">Notifikasi</h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-50">
          <button
            onClick={() => setActiveTab("transaction")}
            className={`flex-1 py-4 px-6 text-sm font-semibold transition-all relative ${
              activeTab === "transaction"
                ? "text-blue-600 bg-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Transaksi
            {activeTab === "transaction" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("information")}
            className={`flex-1 py-4 px-6 text-sm font-semibold transition-all relative ${
              activeTab === "information"
                ? "text-blue-600 bg-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Informasi
            {activeTab === "information" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            )}
          </button>
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
            ) : activeTab === "transaction" ? (
              <div className="p-4 space-y-3">
                {items.map((n, index) => (
                  <div
                    key={n.id}
                    className={cardBaseCls(n.hasRead) + " group"}
                    onClick={() => handleCardClickOrder(n)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(
                          "pending"
                        )}`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="ml-2">Transaksi</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {n.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-1 leading-relaxed">
                      {n.message}
                    </p>
                    {index < items.length - 1 && (
                      <div className="mt-4 border-b border-gray-100"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {items.map((n, index) => (
                  <div
                    key={n.id}
                    className={cardBaseCls(n.hasRead) + " group"}
                    onClick={() => handleCardClickInfo(n)}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(
                          "info"
                        )}`}
                      >
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {n.title}
                          </h4>
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(n.createdAt).toLocaleString("id-ID")}
                          </span>
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
                ))}
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

export default NotificationDropdown;
