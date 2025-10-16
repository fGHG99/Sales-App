import React, { useState, useEffect } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  User,
  MapPin,
  Calendar,
  Loader2,
  QrCode,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  getAllOrders,
  updateOrderStatus as updateOrderStatusAPI,
  formatCurrency,
  getStatusBadgeColor,
  formatOrderStatus,
  getStatusButtonConfig,
  generateQrCode,
} from "../../../services/adminService";
import Pagination from "../../Pagination";
import QrCodeGenerator from "../QrCodeGenerator";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState(null); // null for "all"
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [selectedOrderForQr, setSelectedOrderForQr] = useState(null);

  const itemsPerPage = 5;

  // Status tabs configuration
  const statusTabs = [
    { key: null, label: "Semua Order" },
    { key: "PENDING", label: "Pending" },
    { key: "IN_PREPARATION", label: "Sedang Disiapkan" },
    { key: "PREPARED", label: "Sudah Disiapkan" },
    { key: "READY_FOR_PICKUP", label: "Siap Diambil" },
    { key: "OUT_FOR_DELIVERY", label: "Dalam Perjalanan" },
    { key: "ARRIVED_AT_DESTINATION", label: "Telah Tiba" },
    { key: "DELIVERED", label: "Dikirimkan" },
    { key: "GRACE_PERIOD", label: "Grace Period" },
    { key: "COMPLETED", label: "Selesai" },
    { key: "DISPUTED", label: "Dalam Sengketa" },
    { key: "CANCELED", label: "Dibatalkan" },
  ];

  // Fetch orders whenever page or filter changes
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllOrders({
          page: currentPage,
          limit: itemsPerPage,
          status: filter,
        });

        setOrders(response.data);
        setTotalPages(response.pagination.totalPages);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Gagal memuat data order. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, filter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);

      await updateOrderStatusAPI(orderId, newStatus);

      // Refresh orders after successful update
      const response = await getAllOrders({
        page: currentPage,
        limit: itemsPerPage,
        status: filter,
      });

      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Gagal memperbarui status order. Silakan coba lagi.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleGenerateQrCode = (order) => {
    setSelectedOrderForQr(order);
    setQrCodeModalOpen(true);
  };

  const handleQrCodeError = (error) => {
    console.error("QR Code generation error:", error);
    // You can add toast notification here if needed
  };

  const getActionButton = (order) => {
    const buttonConfig = getStatusButtonConfig(order.orderStatus);
    if (!buttonConfig) return null;

    const isUpdating = updatingOrderId === order.id;

    return (
      <Button
        variant="default"
        size="sm"
        onClick={() =>
          handleUpdateOrderStatus(order.id, buttonConfig.nextStatus)
        }
        className="ml-2"
        disabled={isUpdating}
        data-testid={`update-status-${order.id}`}
      >
        {isUpdating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            {buttonConfig.text}
          </>
        )}
      </Button>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const OrderDetailsModal = ({ order }) => (
    <DialogContent className="max-w-2xl" data-testid="order-details-modal">
      <DialogHeader>
        <DialogTitle>Order Details - #{order.id.slice(0, 8)}</DialogTitle>
        <DialogDescription>
          Complete information about this order
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Order Items */}
        <div>
          <h3 className="font-semibold mb-3">Order Items</h3>
          <div className="space-y-2">
            {order.orderItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.total)}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(item.pricePerItem)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Biaya Pengiriman:</span>
              <span>{formatCurrency(Number(order.deliveryFee))}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total Amount:</span>
              <span>
                {formatCurrency(
                  Number(order.subtotal) + Number(order.deliveryFee)
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Customer Information</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <span>{order.deliveryAddress.recipientName}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>Ordered: {formatDate(order.createdAt)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Delivery Information</h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                <span className="text-sm">
                  {order.deliveryAddress.fullAddress}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Courier Information */}
        {order.courier && (
          <div>
            <h3 className="font-semibold mb-3">Assigned Courier</h3>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p>
                <span className="font-medium">Name:</span> {order.courier.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Phone:</span>{" "}
                {order.courier.phone}
              </p>
            </div>
          </div>
        )}

        {/* Status & Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <Badge
              className={getStatusBadgeColor(order.orderStatus)}
              data-testid={`order-status-${order.id}`}
            >
              {formatOrderStatus(order.orderStatus)}
            </Badge>
          </div>
          {getActionButton(order)}
        </div>
      </div>
    </DialogContent>
  );

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6" data-testid="order-management">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">
            Manage order preparation and fulfillment workflow
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6" data-testid="order-management">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">
            Manage order preparation and fulfillment workflow
          </p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingPreparationOrders = orders.filter(
    (order) =>
      order.orderStatus === "PENDING" || order.orderStatus === "IN_PREPARATION"
  );

  return (
    <div className="space-y-6" data-testid="order-management">
      {/* Page header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600">
          Manage order preparation and fulfillment workflow
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
        {statusTabs.map((tab) => (
          <button
            key={tab.key || "all"}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
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

      {/* Preparation notifications */}
      {filter === null && pendingPreparationOrders.length > 0 && (
        <Card
          className="border-orange-200 bg-orange-50"
          data-testid="preparation-alert"
        >
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Items Need Preparation
            </CardTitle>
            <CardDescription className="text-orange-700">
              {pendingPreparationOrders.length} orders are waiting for item
              preparation
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Orders list */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card data-testid="no-orders-message">
            <CardContent className="p-8 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-500">
                {filter
                  ? `No orders match the "${formatOrderStatus(filter)}" filter.`
                  : "No orders available at the moment."}
              </p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card
              key={order.id}
              className="hover:shadow-md transition-shadow"
              data-testid={`order-card-${order.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          #{order.id.slice(0, 8)}
                        </h3>
                        <p className="text-gray-600">
                          {order.deliveryAddress.recipientName}
                        </p>
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-1">
                          {order.orderItems.length} items •{" "}
                          {formatCurrency(
                            Number(order.subtotal) + Number(order.deliveryFee)
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          Ordered: {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Show items that need preparation */}
                    {(order.orderStatus === "PENDING" ||
                      order.orderStatus === "IN_PREPARATION") && (
                      <div
                        className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                        data-testid={`preparation-items-${order.id}`}
                      >
                        <h4 className="font-medium text-yellow-800 mb-2">
                          Items to Prepare:
                        </h4>
                        <div className="space-y-1">
                          {order.orderItems.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-yellow-700">
                                {item.quantity}x {item.productName}
                              </span>
                              {order.orderStatus === "PENDING" && (
                                <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                  Prepare Now
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <Badge
                        className={getStatusBadgeColor(order.orderStatus)}
                        data-testid={`status-badge-${order.id}`}
                      >
                        {formatOrderStatus(order.orderStatus)}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            data-testid={`view-details-${order.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <OrderDetailsModal order={order} />
                      </Dialog>

                      {/* Generate QR Code Button - Only visible for READY_FOR_PICKUP orders */}
                      {order.orderStatus === "READY_FOR_PICKUP" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateQrCode(order)}
                          className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                          data-testid={`generate-qr-${order.id}`}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Generate QR
                        </Button>
                      )}

                      {getActionButton(order)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Status transition info */}
      <Card className="bg-blue-50 border-blue-200" data-testid="workflow-info">
        <CardHeader>
          <CardTitle className="text-blue-800">Order Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
                1
              </div>
              <p className="text-yellow-700 text-xs">Pending</p>
            </div>
            <div className="flex-1 h-px bg-blue-300 mx-2"></div>
            <div className="text-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
                2
              </div>
              <p className="text-orange-700 text-xs">Sedang Disiapkan</p>
            </div>
            <div className="flex-1 h-px bg-blue-300 mx-2"></div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
                3
              </div>
              <p className="text-blue-700 text-xs">Sudah Disiapkan</p>
            </div>
            <div className="flex-1 h-px bg-blue-300 mx-2"></div>
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
                4
              </div>
              <p className="text-purple-700 text-xs">Siap Diambil</p>
            </div>
            <div className="flex-1 h-px bg-blue-300 mx-2"></div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mb-2">
                5
              </div>
              <p className="text-green-700 text-xs">Dalam Perjalanan</p>
            </div>
          </div>
          <p className="text-blue-700 text-xs mt-4 text-center">
            * Admin can update status from Pending → Ready for Pickup
          </p>
        </CardContent>
      </Card>

      {/* QR Code Generator Modal */}
      <Dialog open={qrCodeModalOpen} onOpenChange={setQrCodeModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-purple-600" />
              Generate QR Code for Pickup
            </DialogTitle>
            <DialogDescription>
              Generate QR code untuk konfirmasi pickup order oleh kurir
            </DialogDescription>
          </DialogHeader>

          {selectedOrderForQr && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      Order #{selectedOrderForQr.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Customer:{" "}
                      {selectedOrderForQr.deliveryAddress.recipientName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status:{" "}
                      <span className="font-medium text-purple-600">
                        READY_FOR_PICKUP
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code Generator Component */}
              <QrCodeGenerator
                orderId={selectedOrderForQr.id}
                onGenerate={generateQrCode}
                onError={handleQrCodeError}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;
