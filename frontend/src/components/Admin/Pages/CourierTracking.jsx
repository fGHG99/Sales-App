import React, { useState, useEffect } from "react";
import {
  Truck,
  Phone,
  Package,
  Navigation,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import {
  getCouriersInWorkspace,
  getCouriersWithActiveDeliveries,
  getCourierStatusBadgeColor,
  formatCourierStatus,
  formatCurrency,
  formatOrderStatus,
} from "../../../services/adminService";
import Pagination from "../../Pagination";

const CourierTracking = () => {
  const [couriers, setCouriers] = useState([]);
  const [totalCouriersInWorkspace, setTotalCouriersInWorkspace] = useState(0);
  const [totalActiveCouriers, setTotalActiveCouriers] = useState(0);
  const [totalActiveOrders, setTotalActiveOrders] = useState(0);
  const [filter, setFilter] = useState(null); // null = "all", "active", "available"
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemsPerPage = 5;

  // Fetch workspace couriers for total count
  useEffect(() => {
    const fetchWorkspaceCouriers = async () => {
      try {
        const response = await getCouriersInWorkspace();
        setTotalCouriersInWorkspace(response.data.totalCouriers);
      } catch (err) {
        console.error("Error fetching workspace couriers:", err);
        // Non-critical error, don't block the main data
      }
    };

    fetchWorkspaceCouriers();
  }, []);

  // Fetch couriers with active deliveries
  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getCouriersWithActiveDeliveries({
          page: currentPage,
          limit: itemsPerPage,
          status: filter,
        });

        setCouriers(response.data.couriers);
        setTotalActiveCouriers(response.data.totalActiveCouriers);
        setTotalActiveOrders(response.data.totalActiveOrders);
        setTotalPages(response.pagination.totalPages);
      } catch (err) {
        console.error("Error fetching couriers:", err);
        setError("Gagal memuat data kurir. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchCouriers();
  }, [currentPage, filter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  return (
    <div className="space-y-6" data-testid="courier-tracking">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Courier Tracking</h1>
        <p className="text-gray-600">
          Monitor courier locations and delivery progress
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: null, label: "Semua Kurir" },
          { key: "active", label: "Aktif" },
          { key: "available", label: "Tersedia" },
        ].map((tab) => (
          <button
            key={tab.key || "all"}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            data-testid={`filter-${tab.key || "all"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="total-couriers-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{totalCouriersInWorkspace}</p>
                <p className="text-sm text-gray-600">Total Kurir</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="active-couriers-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Navigation className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{totalActiveCouriers}</p>
                <p className="text-sm text-gray-600">Kurir Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="deliveries-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{totalActiveOrders}</p>
                <p className="text-sm text-gray-600">Pengiriman Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Memuat data kurir...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Couriers list */}
      {!loading && !error && (
        <div className="space-y-4">
          {couriers.length === 0 ? (
            <Card data-testid="no-couriers-message">
              <CardContent className="p-8 text-center">
                <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak ada kurir ditemukan
                </h3>
                <p className="text-gray-500">
                  {filter === "active"
                    ? "Tidak ada kurir yang sedang aktif."
                    : filter === "available"
                    ? "Tidak ada kurir yang tersedia."
                    : "Tidak ada kurir yang sesuai dengan kriteria filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            couriers.map((courier) => {
              return (
                <Card
                  key={courier.id}
                  className="hover:shadow-md transition-shadow"
                  data-testid={`courier-card-${courier.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          {/* Courier basic info */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Truck className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold">
                                {courier.name}
                              </h3>
                              <Badge
                                className={getCourierStatusBadgeColor(
                                  courier.status
                                )}
                                data-testid={`courier-status-${courier.id}`}
                              >
                                {formatCourierStatus(courier.status)}
                              </Badge>
                            </div>

                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span>ID: {courier.id.slice(0, 8)}</span>
                              {courier.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {courier.phone}
                                </div>
                              )}
                              <span>
                                {courier.activeDeliveriesCount} pengiriman aktif
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Current deliveries */}
                        {courier.activeDeliveries &&
                          courier.activeDeliveries.length > 0 && (
                            <div
                              className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                              data-testid={`active-deliveries-${courier.id}`}
                            >
                              <h4 className="font-medium text-blue-800 mb-2">
                                Pengiriman Aktif (
                                {courier.activeDeliveries.length})
                              </h4>
                              <div className="space-y-2">
                                {courier.activeDeliveries.map((delivery) => {
                                  return (
                                    <div
                                      key={delivery.orderId}
                                      className="flex items-center justify-between bg-white p-2 rounded"
                                    >
                                      <div>
                                        <p className="font-medium">
                                          #{delivery.orderId.slice(0, 8)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Ke:{" "}
                                          {
                                            delivery.deliveryAddress
                                              .recipientName
                                          }
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {delivery.orderItems
                                            .map(
                                              (item) =>
                                                `${item.quantity}x ${item.productName}`
                                            )
                                            .join(", ")}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <Badge
                                          className={`text-xs ${
                                            delivery.orderStatus ===
                                            "OUT_FOR_DELIVERY"
                                              ? "bg-green-100 text-green-800"
                                              : "bg-blue-100 text-blue-800"
                                          }`}
                                        >
                                          {formatOrderStatus(
                                            delivery.orderStatus
                                          )}
                                        </Badge>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {formatCurrency(
                                            Number(delivery.subtotal) +
                                              Number(delivery.deliveryFee)
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200" data-testid="tracking-info">
        <CardHeader>
          <CardTitle className="text-blue-800">
            Informasi Pelacakan Kurir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              • Monitor status kurir dan pengiriman aktif mereka secara
              real-time
            </p>
            <p>• Gunakan filter untuk melihat kurir aktif atau tersedia</p>
            <p>• Kurir "Aktif" adalah kurir yang sedang menangani pengiriman</p>
            <p>• Kurir "Tersedia" adalah kurir yang siap menerima order baru</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourierTracking;
