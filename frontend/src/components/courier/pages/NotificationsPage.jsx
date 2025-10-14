import { useState, useEffect } from "react";
import { Package, Bell, ShoppingBag, ChevronRight } from "lucide-react";
import api from "../../../utils/api";
import Pagination from "../../Pagination";

const CourierNotificationPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingOrder, setLoadingOrder] = useState({});
  const [counts, setCounts] = useState({ all: 0, ORDER: 0, INFO: 0 });

  const ITEMS_PER_PAGE = 4;

  const tabToType = (tab) => {
    if (tab === "transaction") return "ORDER";
    if (tab === "information") return "INFO";
    return "all";
  };

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const typeParam = tabToType(activeTab);
      const params = { limit: ITEMS_PER_PAGE, page };
      if (typeParam !== "all") params.type = typeParam;

      console.log("📡 [COURIER NOTIFICATIONS] Fetching notifications...");
      console.log(`   Tab: ${activeTab} (Type: ${typeParam})`);
      console.log(`   Page: ${page}`);
      console.log(`   Limit: ${ITEMS_PER_PAGE}`);

      const res = await api.get("/users/notifications", { params });
      const { notifications: data = [], pagination = {} } = res.data || {};

      console.log("✅ [COURIER NOTIFICATIONS] Fetch successful");
      console.log(`   Fetched: ${data.length} notifications`);
      console.log(`   Total: ${pagination.total || 0}`);
      console.log(`   Current Page: ${pagination.page || 1}`);
      console.log(`   Total Pages: ${pagination.totalPages || 1}`);
      console.log(`   Unread Count: ${pagination.unreadCount || 0}`);
      console.log("   Notifications:", data);

      setNotifications(data);
      setTotalPages(pagination.totalPages || 1);
      setTotal(pagination.total || 0);
      setCurrentPage(pagination.page || 1);
    } catch (e) {
      console.error("❌ [COURIER NOTIFICATIONS] Fetch failed:", e);
      console.error(
        `   Error message: ${e.response?.data?.error || e.message}`
      );
      setError(e.response?.data?.error || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      console.log("📊 [COURIER NOTIFICATIONS] Fetching notification counts...");
      // Fetch all notifications to count
      const resAll = await api.get("/notifications/courier", {
        params: { limit: 1000, page: 1 },
      });
      const allNotifs = resAll.data?.notifications || [];

      const counts = {
        all: allNotifs.length,
        ORDER: allNotifs.filter((n) => n.type === "ORDER").length,
        INFO: allNotifs.filter((n) => n.type === "INFO").length,
      };

      console.log("✅ [COURIER NOTIFICATIONS] Counts fetched:");
      console.log(`   Total: ${counts.all}`);
      console.log(`   ORDER: ${counts.ORDER}`);
      console.log(`   INFO: ${counts.INFO}`);

      setCounts(counts);
    } catch (e) {
      console.error("❌ [COURIER NOTIFICATIONS] Failed to fetch counts:", e);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchNotifications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchNotifications(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openModal = async (notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    if (notification?.type === "ORDER") {
      const orderId = notification.metadata?.orderId || notification.orderId;
      if (orderId && !orderDetails[orderId] && !loadingOrder[orderId]) {
        try {
          setLoadingOrder((prev) => ({ ...prev, [orderId]: true }));
          const res = await api.get(`/orders/detail/${orderId}`);
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
    <div className="bg-white border border-gray-200 p-4 animate-pulse flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-3 w-64 bg-gray-200 rounded" />
        <div className="h-3 w-24 bg-gray-200 rounded" />
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 mb-6">
            <div className="flex">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-3 px-4 text-sm font-medium relative ${
                  activeTab === "all"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Semua
                {counts.all > 0 && (
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {counts.all}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("transaction")}
                className={`flex-1 py-3 px-4 text-sm font-medium relative ${
                  activeTab === "transaction"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Transaksi
                {counts.ORDER > 0 && (
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {counts.ORDER}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("information")}
                className={`flex-1 py-3 px-4 text-sm font-medium relative ${
                  activeTab === "information"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Informasi
                {counts.INFO > 0 && (
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {counts.INFO}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
              {error}
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-3 mb-6">
            {loading && notifications.length === 0 ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : !loading && notifications.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tidak ada notifikasi
                </h3>
                <p className="text-gray-600">Anda belum memiliki notifikasi.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white border border-gray-200 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() =>
                    notification.type === "ORDER" && openModal(notification)
                  }
                >
                  <div className="p-4 flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          notification.type === "ORDER"
                            ? "bg-blue-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {notification.type === "ORDER" ? (
                          <ShoppingBag className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Bell className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900">
                          {notification.title}
                        </h3>
                        {notification.type === "ORDER" && (
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Detail Notifikasi
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
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

                  {(selectedNotification.metadata?.orderId ||
                    selectedNotification.orderId) && (
                    <div className="border-t pt-4">
                      {loadingOrder[
                        selectedNotification.metadata?.orderId ||
                          selectedNotification.orderId
                      ] ? (
                        <div className="text-sm text-gray-500">
                          Memuat detail pesanan...
                        </div>
                      ) : orderDetails[
                          selectedNotification.metadata?.orderId ||
                            selectedNotification.orderId
                        ] ? (
                        <div className="space-y-3">
                          {(() => {
                            const od =
                              orderDetails[
                                selectedNotification.metadata?.orderId ||
                                  selectedNotification.orderId
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
                          Detail pesanan tidak tersedia.
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
                className="px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800"
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

export default CourierNotificationPage;
