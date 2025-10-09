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
import api from "../../../utils/api";

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingOrder, setLoadingOrder] = useState({});

  const [cache, setCache] = useState({
    all: { items: [], cursor: null },
    ORDER: { items: [], cursor: null },
    INFO: { items: [], cursor: null },
  });

  const tabToType = (tab) => {
    if (tab === "transaction") return "ORDER";
    if (tab === "information") return "INFO";
    return "all";
  };

  const uniqById = (arr) => {
    const seen = new Set();
    return arr.filter((n) => {
      if (!n || !n.id) return false;
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  };

  const fetchNotifications = async (opts = {}) => {
    const { reset = false } = opts;
    const typeParam = tabToType(activeTab);

    const hasItems = notifications && notifications.length > 0;
    if (!hasItems) setLoading(true);

    setError("");
    try {
      const params = { limit: 10 };
      if (typeParam === "ORDER") params.type = "ORDER";
      else if (typeParam === "INFO") params.type = "INFO";

      const cursorToUse = reset ? null : nextCursor || cache[typeParam].cursor;
      if (cursorToUse) params.cursor = cursorToUse;

      const res = await api.get("/users/notifications", { params });
      const { notifications: data = [], nextCursor: nc = null } =
        res.data || {};

      const newItemsRaw = reset ? data : [...notifications, ...data];
      const newItems = uniqById(newItemsRaw);
      setNotifications(newItems);
      setNextCursor(nc);

      setCache((prev) => ({
        ...prev,
        [typeParam]: {
          items: uniqById(reset ? data : [...prev[typeParam].items, ...data]),
          cursor: nc,
        },
        // Only update 'all' when fetching the 'all' tab to avoid double counting
        ...(typeParam === "all"
          ? {
              all: {
                items: uniqById(reset ? data : [...prev.all.items, ...data]),
                cursor: nc,
              },
            }
          : {}),
      }));
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const typeParam = tabToType(activeTab);
    const cached = cache[typeParam];
    if (cached && cached.items) {
      setNotifications(cached.items);
      setNextCursor(cached.cursor);
    }
    fetchNotifications({ reset: (cached?.items?.length || 0) === 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filteredNotifications = notifications;

  const allItems = cache.all.items || [];
  const totalCount = allItems.length;
  const transactionCount = allItems.filter((n) => n.type === "ORDER").length;
  const informationCount = allItems.filter((n) => n.type === "INFO").length;

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

  const currentNotifications = filteredNotifications;

  const handleLoadMore = () => {
    if (nextCursor && !loading) fetchNotifications();
  };

  const openModal = async (notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    if (notification?.type === "ORDER") {
      const orderId = notification.metadata?.orderId;
      if (orderId && !orderDetails[orderId] && !loadingOrder[orderId]) {
        try {
          setLoadingOrder((prev) => ({ ...prev, [orderId]: true }));
          const res = await api.get(`/order/my-orders/${orderId}`);
          setOrderDetails((prev) => ({ ...prev, [orderId]: res.data?.order }));
        } catch (e) {
          // ignore
        } finally {
          setLoadingOrder((prev) => ({ ...prev, [orderId]: false }));
        }
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-5 w-64 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-80 bg-gray-200 rounded" />
    </div>
  );

  return (
    <>
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
                  {totalCount}
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
            {error && (
              <div className="bg-white rounded-2xl border border-red-200 p-4 text-red-700">
                {error}
              </div>
            )}

            {/* Show skeletons only on initial empty load to avoid blank delay */}
            {loading && currentNotifications.length === 0 && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}

            {!loading && currentNotifications.length === 0 ? (
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
                  key={notification.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-6"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center px-3 py-1.5 rounded-full text-sm font-medium border text-blue-700 bg-blue-50 border-blue-200">
                        {notification.type === "ORDER" ? (
                          <ShoppingBag className="w-5 h-5" />
                        ) : (
                          <Bell className="w-5 h-5" />
                        )}
                        <span className="ml-2">
                          {notification.type === "ORDER"
                            ? "Transaksi"
                            : "Informasi"}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(notification.createdAt).toLocaleString(
                          "id-ID"
                        )}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {notification.message}
                    </p>
                    {notification.type === "ORDER" && (
                      <div className="mt-4">
                        <button
                          onClick={() => openModal(notification)}
                          className="px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white"
                        >
                          Lihat detil pesanan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More */}
          <div className="mt-8 flex justify-center">
            {nextCursor ? (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-60"
              >
                {loading ? "Memuat..." : "Muat lebih banyak"}
              </button>
            ) : (
              notifications.length > 0 && (
                <span className="text-sm text-gray-500">
                  Semua notifikasi telah dimuat
                </span>
              )
            )}
          </div>
        </div>
      </div>
      {isModalOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Detil Notifikasi
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div>
                <div className="text-sm text-gray-500">
                  {new Date(selectedNotification.createdAt).toLocaleString(
                    "id-ID"
                  )}
                </div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {selectedNotification.title}
                </div>
                <div className="text-gray-700 mt-1">
                  {selectedNotification.message}
                </div>
              </div>

              {selectedNotification.type === "ORDER" && (
                <>
                  {Array.isArray(selectedNotification.metadata?.items) &&
                    selectedNotification.metadata.items.length > 0 && (
                      <div>
                        <div className="font-semibold text-gray-900 mb-2">
                          Item Pesanan
                        </div>
                        <div className="space-y-3">
                          {selectedNotification.metadata.items.map(
                            (it, idx) => (
                              <div
                                key={`modal-item-${idx}`}
                                className="flex items-center gap-3"
                              >
                                {it.thumbnailUrl || it.imageUrl ? (
                                  <img
                                    src={it.thumbnailUrl || it.imageUrl}
                                    alt={it.altText || it.productName}
                                    className="w-12 h-12 rounded object-cover border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded bg-gray-100 border" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {it.productName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Qty: {it.quantity}
                                  </div>
                                </div>
                                <div className="text-sm font-semibold text-gray-900">
                                  Rp{" "}
                                  {Number(it.total || 0).toLocaleString(
                                    "id-ID"
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {selectedNotification.metadata?.orderId && (
                    <div className="border-t pt-4">
                      {loadingOrder[selectedNotification.metadata.orderId] ? (
                        <div className="text-sm text-gray-500">
                          Memuat detil pesanan...
                        </div>
                      ) : orderDetails[
                          selectedNotification.metadata.orderId
                        ] ? (
                        <div className="space-y-3">
                          {(() => {
                            const od =
                              orderDetails[
                                selectedNotification.metadata.orderId
                              ];
                            return (
                              <>
                                <div className="text-sm text-gray-600">
                                  ID Pesanan: {od.id}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Tipe Pengiriman: {od.deliveryType}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Status Pembayaran: {od.paymentStatus}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Status Order: {od.orderStatus}
                                </div>
                                {od.deliveryAddress && (
                                  <div className="text-sm text-gray-700">
                                    <div className="font-semibold text-gray-900 mb-1">
                                      Alamat Pengiriman
                                    </div>
                                    <div>
                                      {od.deliveryAddress.recipientName} (
                                      {od.deliveryAddress.recipientPhone})
                                    </div>
                                    <div>{od.deliveryAddress.fullAddress}</div>
                                    {od.deliveryAddress.city && (
                                      <div>{od.deliveryAddress.city}</div>
                                    )}
                                    {od.deliveryAddress.province && (
                                      <div>{od.deliveryAddress.province}</div>
                                    )}
                                    {od.deliveryAddress.postalCode && (
                                      <div>
                                        Kode Pos:{" "}
                                        {od.deliveryAddress.postalCode}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {od.pickupStore && (
                                  <div className="text-sm text-gray-700">
                                    <div className="font-semibold text-gray-900 mb-1">
                                      Pickup Store
                                    </div>
                                    <div>{od.pickupStore.name}</div>
                                    {od.pickupStore.address && (
                                      <div className="text-gray-600">
                                        {od.pickupStore.address.fullAddress ||
                                          ""}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="text-sm text-gray-700">
                                  <div className="font-semibold text-gray-900 mb-1">
                                    Ringkasan Biaya
                                  </div>
                                  <div>
                                    Subtotal: Rp{" "}
                                    {Number(od.subtotal).toLocaleString(
                                      "id-ID"
                                    )}
                                  </div>
                                  <div>
                                    Ongkir: Rp{" "}
                                    {Number(od.deliveryFee).toLocaleString(
                                      "id-ID"
                                    )}
                                  </div>
                                  <div className="font-semibold">
                                    Total: Rp{" "}
                                    {Number(od.total).toLocaleString("id-ID")}
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Detil pesanan tidak tersedia.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-md bg-gray-900 text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationsPage;
