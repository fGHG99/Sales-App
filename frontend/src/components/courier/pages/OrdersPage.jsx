import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  MapPin,
  Phone,
  Package,
  Navigation,
  CheckCircle2,
  Truck,
  AlertTriangle,
  X,
  Loader2,
  Store,
  RefreshCw,
  Upload,
} from "lucide-react";
import CancelOrderModal from "../modal/CancelOrderModal";
import UploadDeliveryProofModal from "../modal/UploadDeliveryProofModal";
import OrderCardSkeleton from "../../skeleton/OrderCardSkeleton";
import Pagination from "../../Pagination";
import {
  getCourierOrders,
  updateOrderStatus as updateOrderStatusAPI,
  uploadDeliveryProof as uploadDeliveryProofAPI,
} from "../../../services/courierService";
import useAwaitingProofOrders from "../../../hooks/useAwaitingProofOrders";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [isUploadProofModalOpen, setIsUploadProofModalOpen] = useState(false);
  const [selectedOrderForProof, setSelectedOrderForProof] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("active");
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [isMounted, setIsMounted] = useState(false); // ✅ Add mounted state
  // Use custom hook for cross-component synchronization
  const {
    awaitingProofOrders,
    addAwaitingProofOrder,
    removeAwaitingProofOrder,
    isAwaitingProof,
  } = useAwaitingProofOrders();

  // ✅ Component mounting detection
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    totalPages: 1,
    totalOrders: 0,
  });
  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    PENDING: 0,
    IN_PREPARATION: 0,
    READY_FOR_PICKUP: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    COMPLETED: 0,
    CANCELED: 0,
    DISPUTED: 0,
    GRACE_PERIOD: 0,
  });

  /**
   * Format number to Indonesian Rupiah (IDR)
   */
  const formatIDR = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /**
   * Fetch orders from backend with pagination and status filter
   */
  const fetchOrders = async (page = 1, filter = "active") => {
    try {
      setIsLoading(true);
      const response = await getCourierOrders({
        filter,
        page,
        limit: 5,
        enablePagination: true,
      });

      if (response && response.orders) {
        // Map backend data ke format yang dibutuhkan OrdersPage
        const mappedOrders = response.orders.map((order) => ({
          id: order.id,
          status: order.orderStatus,
          orderValue: parseFloat(order.subtotal || 0),
          deliveryFee: parseFloat(order.deliveryFee || 0),

          // Store/Pickup information
          storeName: order.pickupStore?.name || "Store",
          storeAddress:
            order.pickupStore?.address?.fullAddress || "Address not available",
          storeLatitude: order.pickupStore?.address?.latitude,
          storeLongitude: order.pickupStore?.address?.longitude,

          // Customer information
          customerName: order.deliveryAddress?.recipientName || "Customer",
          customerAddress:
            order.deliveryAddress?.fullAddress || "Address not available",
          customerPhone:
            order.deliveryAddress?.recipientPhone || "Phone not available",
          customerLatitude: order.deliveryAddress?.latitude,
          customerLongitude: order.deliveryAddress?.longitude,

          // Order items
          orderItems: order.orderItems || [],

          // Additional info
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        }));

        // ✅ Only update state if component is still mounted
        if (isMounted) {
          setOrders(mappedOrders);
          setPagination(response.pagination);
          setStatusCounts(response.statusCounts || {});
          setCurrentPage(page);
        }
      }
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err);
      // ✅ Only update state if component is still mounted
      if (isMounted) {
        setOrders([]);
      }
    } finally {
      // ✅ Only update loading state if component is still mounted
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Fetch orders on component mount and when page or tab changes
   */
  useEffect(() => {
    // Only fetch if component is mounted
    if (!isMounted) return;

    // Force re-render by clearing previous state
    setOrders([]);
    setIsLoading(true);

    // Fetch orders with slight delay to ensure proper state reset
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        fetchOrders(currentPage, activeTab);
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [currentPage, activeTab, isMounted]);

  /**
   * Handle page change from pagination component
   */
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Handle tab change
   */
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setCurrentPage(1); // Reset to page 1 when changing tabs
  };

  /**
   * Update order status via API
   */
  const updateOrderStatus = async (orderId, newStatus, notes = "") => {
    try {
      const response = await updateOrderStatusAPI(orderId, newStatus, notes);

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        )
      );

      // Refresh to get latest data
      await fetchOrders(currentPage, activeTab);

      return response;
    } catch (err) {
      console.error("Error updating order status:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to update order status";
      throw err;
    }
  };

  /**
   * Mark order as picked up (READY_FOR_PICKUP => OUT_FOR_DELIVERY)
   */
  const markAsPickedUp = async (orderId) => {
    return await updateOrderStatus(
      orderId,
      "OUT_FOR_DELIVERY",
      "Paket telah diambil dan sedang dalam perjalanan"
    );
  };

  /**
   * Mark order as arrived at destination
   * This changes status to ARRIVED_AT_DESTINATION
   */
  const markAsArrived = async (orderId) => {
    try {
      // ✅ FIX: First update backend status via API
      await updateOrderStatus(
        orderId,
        "ARRIVED_AT_DESTINATION",
        "Order arrived at destination"
      );

      // ✅ Only update frontend state after successful API call
      addAwaitingProofOrder(orderId);

      return { success: true };
    } catch (err) {
      console.error("Error marking as arrived:", err);
      throw err;
    }
  };

  /**
   * Upload delivery proof and change status to DELIVERED
   * This is the final step that actually completes the delivery
   */
  const uploadDeliveryProof = async (orderId, photoFile) => {
    try {
      // Upload the photo
      const response = await uploadDeliveryProofAPI(orderId, photoFile);

      // Remove from awaiting proof set (synced across components)
      removeAwaitingProofOrder(orderId);

      // Don't update local state here - let refresh handle it
      return response;
    } catch (err) {
      console.error("Error uploading delivery proof:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to upload delivery proof";
      throw err;
    }
  };

  /**
   * Open upload proof modal
   */
  const handleOpenUploadModal = (orderId) => {
    setSelectedOrderForProof(orderId);
    setIsUploadProofModalOpen(true);
  };

  /**
   * Close upload proof modal
   */
  const handleCloseUploadModal = () => {
    setIsUploadProofModalOpen(false);
    setSelectedOrderForProof(null);

    // Refresh orders after modal closes
    setTimeout(() => {
      fetchOrders(currentPage, activeTab);
    }, 200); // Increased delay to ensure modal is fully unmounted
  };

  /**
   * Handle upload from modal
   * ✅ FIX: Proper async handling with refresh after modal closes
   */
  const handleUploadFromModal = async (orderId, file) => {
    try {
      setUpdatingOrder(orderId);

      // Upload delivery proof
      await uploadDeliveryProof(orderId, file);

      // Upload complete, reset state
      setUpdatingOrder(null);

      // Return success to modal
    } catch (err) {
      // Error already handled in uploadDeliveryProof
      setUpdatingOrder(null);
      throw err; // Re-throw to let modal know
    }
  };

  // Order action configuration map
  const ACTION_CONFIG = {
    accept: {
      status: "IN_PREPARATION",
      message: "Order accepted successfully!",
      optimisticOnly: true, // Just optimistic update for now
    },
    pickup: {
      apiCall: markAsPickedUp, // Actual API call
    },
    arrived: {
      apiCall: markAsArrived, // Mark as arrived (awaiting proof)
    },
    upload_proof: {
      // This will be handled via file input
      requiresFileInput: true,
    },
    call_customer: {
      customHandler: () => {
        console.log("Calling customer...");
      },
    },
  };

  const handleOrderAction = async (orderId, action) => {
    const config = ACTION_CONFIG[action];

    if (!config) {
      console.warn(`Unknown action: ${action}`);
      return;
    }

    // Handle custom actions (like call_customer)
    if (config.customHandler) {
      config.customHandler();
      return;
    }

    try {
      setUpdatingOrder(orderId);

      // Handle API calls (pickup, complete)
      if (config.apiCall) {
        await config.apiCall(orderId);
        return;
      }

      // Handle optimistic-only updates (accept)
      if (config.optimisticOnly) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: config.status } : order
          )
        );
        // TODO: Call actual backend API for accept when available
      }
    } catch (err) {
      console.error("❌ Failed to update order:", err);
      // API calls already show toast errors, only handle optimistic updates
      if (config.optimisticOnly) {
        fetchOrders(currentPage, activeTab);
      }
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleCancelOrder = async (orderId, cancelData) => {
    try {
      // Optimistic UI update
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              status: "CANCELED",
              cancelReason: cancelData.reasonLabel,
              cancelNotes: cancelData.notes,
              cancelledAt: cancelData.timestamp,
            };
          }
          return order;
        })
      );

      // TODO: Call actual backend API when available
      // await api.put(`/orders/${orderId}/cancel`, cancelData);
    } catch (err) {
      console.error("❌ Failed to cancel order:", err);
      // Revert optimistic update on error
      fetchOrders();
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: "bg-gray-100 text-gray-800", text: "Pending" },
      IN_PREPARATION: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Preparing",
      },
      READY_FOR_PICKUP: {
        color: "bg-orange-100 text-orange-800",
        text: "Ready",
      },
      OUT_FOR_DELIVERY: {
        color: "bg-purple-100 text-purple-800",
        text: "In Transit",
      },
      ARRIVED_AT_DESTINATION: {
        color: "bg-blue-100 text-blue-800",
        text: "Arrived",
      },
      DELIVERED: { color: "bg-green-100 text-green-800", text: "Delivered" },
      COMPLETED: { color: "bg-green-100 text-green-800", text: "Completed" },
      CANCELED: { color: "bg-red-100 text-red-800", text: "Cancelled" },
      DISPUTED: { color: "bg-red-100 text-red-800", text: "Disputed" },
      GRACE_PERIOD: {
        color: "bg-purple-100 text-purple-800",
        text: "In Transit",
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  // Button factory functions for reusable components
  const createActionButton = (
    key,
    onClick,
    className,
    Icon,
    label,
    isUpdating = false
  ) => (
    <Button
      key={key}
      onClick={onClick}
      className={className}
      disabled={isUpdating}
    >
      {isUpdating ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Updating...
        </>
      ) : (
        <>
          <Icon className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );

  const createOutlineButton = (key, onClick, className, Icon, label) => (
    <Button key={key} onClick={onClick} variant="outline" className={className}>
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );

  const createNavigateButton = (key, to, Icon, label) => (
    <Link key={key} to={to}>
      <Button
        variant="outline"
        className="border-blue-600 text-blue-600 hover:bg-blue-50"
      >
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </Button>
    </Link>
  );

  const createUploadProofButton = (
    key,
    orderId,
    className,
    Icon,
    label,
    isUpdating = false
  ) => (
    <Button
      key={key}
      onClick={() => handleOpenUploadModal(orderId)}
      className={className}
      disabled={isUpdating}
    >
      {isUpdating ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <Icon className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );

  // Order actions configuration map
  const ORDER_ACTIONS_CONFIG = {
    PENDING: (order, isUpdating) => [
      createActionButton(
        "accept",
        () => handleOrderAction(order.id, "accept"),
        "bg-blue-600 hover:bg-blue-700",
        CheckCircle2,
        "Accept Order",
        isUpdating
      ),
      createOutlineButton(
        "cancel",
        () => setCancelModalOrder(order),
        "border-red-600 text-red-600 hover:bg-red-50",
        X,
        "Cancel Order"
      ),
    ],

    IN_PREPARATION: (order, isUpdating) => [
      createNavigateButton(
        "navigate-store",
        `/courier/store-location/order/${order.id}`,
        Navigation,
        "Navigate to Store"
      ),
      createActionButton(
        "pickup",
        () => handleOrderAction(order.id, "pickup"),
        "bg-orange-600 hover:bg-orange-700",
        Package,
        "Mark Picked Up",
        isUpdating
      ),
      createOutlineButton(
        "cancel",
        () => setCancelModalOrder(order),
        "border-red-600 text-red-600 hover:bg-red-50",
        X,
        "Cancel"
      ),
    ],

    OUT_FOR_DELIVERY: (order, isUpdating) => {
      return [
        createNavigateButton(
          "navigate-customer",
          `/courier/customer-location/order/${order.id}`,
          Navigation,
          "Navigate to Customer"
        ),
        createOutlineButton(
          "call",
          () => handleOrderAction(order.id, "call_customer"),
          "border-gray-600 text-gray-600 hover:bg-gray-50",
          Phone,
          "Call Customer"
        ),
        createActionButton(
          "arrived",
          () => handleOrderAction(order.id, "arrived"),
          "bg-green-600 hover:bg-green-700",
          CheckCircle2,
          "Mark as Arrived",
          isUpdating
        ),
      ];
    },

    ARRIVED_AT_DESTINATION: (order, isUpdating) => {
      // ✅ Use Set.has() directly - O(1) lookup, no unnecessary memoization
      const awaitingProof = awaitingProofOrders.has(order.id);

      return [
        createNavigateButton(
          "navigate-customer",
          `/courier/customer-location/order/${order.id}`,
          Navigation,
          "Navigate to Customer"
        ),
        createOutlineButton(
          "call",
          () => handleOrderAction(order.id, "call_customer"),
          "border-gray-600 text-gray-600 hover:bg-gray-50",
          Phone,
          "Call Customer"
        ),
        // Show different button based on whether awaiting proof upload
        awaitingProof
          ? createUploadProofButton(
              "upload-proof",
              order.id,
              "bg-blue-600 hover:bg-blue-700",
              Upload,
              "Upload Proof",
              isUpdating
            )
          : createActionButton(
              "delivered",
              () => handleOrderAction(order.id, "delivered"),
              "bg-purple-600 hover:bg-purple-700",
              CheckCircle2,
              "Mark as Delivered",
              isUpdating
            ),
      ];
    },
  };

  // Assign shared configurations
  ORDER_ACTIONS_CONFIG.READY_FOR_PICKUP = ORDER_ACTIONS_CONFIG.IN_PREPARATION;
  ORDER_ACTIONS_CONFIG.GRACE_PERIOD = ORDER_ACTIONS_CONFIG.OUT_FOR_DELIVERY;

  const getOrderActions = (order) => {
    // Non-actionable statuses
    const NON_ACTIONABLE = ["CANCELED", "DISPUTED", "COMPLETED", "DELIVERED"];
    if (NON_ACTIONABLE.includes(order.status)) {
      return [];
    }

    const isUpdating = updatingOrder === order.id;
    const actionsFactory = ORDER_ACTIONS_CONFIG[order.status];
    return actionsFactory ? actionsFactory(order, isUpdating) : [];
  };

  const OrderCard = ({ order }) => (
    <Card className="mb-4 transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Order #{order.id.substring(0, 8)}
            </h3>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {getStatusBadge(order.status)}
          </div>
        </div>

        {order.status === "CANCELED" && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800 mb-1">
              <X className="h-4 w-4 mr-2" />
              <span className="font-medium">Order Cancelled</span>
            </div>
            <p className="text-sm text-red-700">
              <strong>Reason:</strong> {order.cancelReason}
            </p>
            {order.cancelNotes && (
              <p className="text-sm text-red-700 mt-1">
                <strong>Notes:</strong> {order.cancelNotes}
              </p>
            )}
            <p className="text-xs text-red-600 mt-1">
              Cancelled at: {new Date(order.cancelledAt).toLocaleString()}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Store Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Pickup Location</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <Store className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{order.storeName}</span>
              </div>
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{order.storeAddress}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">
              Delivery Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-gray-700">{order.customerName}</p>
                  <p className="text-gray-600">{order.customerAddress}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-gray-700">{order.customerPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            {order.orderItems && order.orderItems.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {order.orderItems.map((item, index) => (
                  <li
                    key={index}
                    className="text-gray-700 flex justify-between"
                  >
                    <span>
                      • {item.quantity}x {item.productName}
                    </span>
                    <span className="text-gray-600">
                      {formatIDR(item.pricePerItem * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No items found</p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="flex justify-between items-center mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="text-gray-700">
                Order: {formatIDR(order.orderValue)}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">
                Fee: {formatIDR(order.deliveryFee)}
              </span>
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-900">
            Total: {formatIDR(order.orderValue + order.deliveryFee)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">{getOrderActions(order)}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order Management
        </h1>
        <p className="text-gray-600">
          Manage your assigned deliveries and track progress
        </p>
      </div>

      {/* Loading State with Skeleton UI */}
      {isLoading ? (
        <div className="space-y-4">
          <OrderCardSkeleton count={5} />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="w-full overflow-x-auto mb-6">
            <TabsList className="inline-flex gap-2 p-1 md:w-full md:grid md:grid-cols-7 md:gap-0">
              <TabsTrigger
                value="active"
                className="flex-shrink-0 px-4 md:px-2"
              >
                All ({statusCounts.active || 0})
              </TabsTrigger>
              <TabsTrigger
                value="PENDING"
                className="flex-shrink-0 px-4 md:px-2"
              >
                Pending ({statusCounts.PENDING || 0})
              </TabsTrigger>
              <TabsTrigger
                value="IN_PREPARATION"
                className="flex-shrink-0 px-4 md:px-2"
              >
                Preparing ({statusCounts.IN_PREPARATION || 0})
              </TabsTrigger>
              <TabsTrigger
                value="READY_FOR_PICKUP"
                className="flex-shrink-0 px-4 md:px-2"
              >
                Ready ({statusCounts.READY_FOR_PICKUP || 0})
              </TabsTrigger>
              <TabsTrigger
                value="OUT_FOR_DELIVERY"
                className="flex-shrink-0 px-4 md:px-2"
              >
                In Transit ({statusCounts.OUT_FOR_DELIVERY || 0})
              </TabsTrigger>
              <TabsTrigger
                value="COMPLETED"
                className="flex-shrink-0 px-4 md:px-2"
              >
                Completed ({statusCounts.COMPLETED || 0})
              </TabsTrigger>
              <TabsTrigger
                value="CANCELED"
                className="flex-shrink-0 px-4 md:px-2"
              >
                Cancelled ({statusCounts.CANCELED || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="mt-0">
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Active Orders
                  </h3>
                  <p className="text-gray-600">
                    All your orders are completed. Great job!
                  </p>
                </div>
              )}
            </div>

            {/* Pagination - only show if totalPages > 1 */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>

          <TabsContent value="PENDING" className="mt-0">
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Pending Orders
                  </h3>
                  <p className="text-gray-600">No new orders at the moment.</p>
                </div>
              )}
            </div>

            {/* Pagination - only show if totalPages > 1 */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>

          <TabsContent value="IN_PREPARATION" className="mt-0">
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Orders Being Prepared
                  </h3>
                  <p className="text-gray-600">No orders in preparation.</p>
                </div>
              )}
            </div>

            {/* Pagination - only show if totalPages > 1 */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>

          <TabsContent value="READY_FOR_PICKUP" className="mt-0">
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Orders Ready for Pickup
                  </h3>
                  <p className="text-gray-600">No orders waiting for pickup.</p>
                </div>
              )}
            </div>

            {/* Pagination - only show if totalPages > 1 */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>

          <TabsContent value="OUT_FOR_DELIVERY" className="mt-0">
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <Truck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Orders In Transit
                  </h3>
                  <p className="text-gray-600">
                    No deliveries currently in progress.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination - only show if totalPages > 1 */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>

          <TabsContent value="COMPLETED" className="mt-0">
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Completed Orders
                  </h3>
                  <p className="text-gray-600">
                    Completed orders will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination - only show if totalPages > 1 */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>

          <TabsContent value="CANCELED" className="mt-0">
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <X className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Cancelled Orders
                  </h3>
                  <p className="text-gray-600">
                    Cancelled orders will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination - only show if totalPages > 1 */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={!!cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        order={cancelModalOrder}
        onConfirm={handleCancelOrder}
      />

      {/* Upload Delivery Proof Modal */}
      <UploadDeliveryProofModal
        isOpen={isUploadProofModalOpen}
        onClose={handleCloseUploadModal}
        orderId={selectedOrderForProof}
        onUploadSuccess={handleUploadFromModal}
      />
    </div>
  );
};

export default OrdersPage;
