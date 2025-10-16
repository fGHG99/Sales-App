import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Package,
  MapPin,
  Navigation,
  CheckCircle2,
  Truck,
  RefreshCw,
  Wifi,
  WifiOff,
  Phone,
  User,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import useCourierDashboard from "../../../hooks/useCourierDashboard";
import { useAuth } from "../../middleware/AuthContext";
import { formatCurrency } from "../../../utils/formatters";
import QrCodeScanner from "../QrCodeScanner";
import UploadDeliveryProofModal from "../modal/UploadDeliveryProofModal";
import {
  generateQrCode,
  verifyQrCode,
  uploadDeliveryProof as uploadDeliveryProofAPI,
} from "../../../services/courierService";
import useAwaitingProofOrders from "../../../hooks/useAwaitingProofOrders";

const CourierDashboard = () => {
  const { user } = useAuth();
  const {
    notifications,
    activeOrders,
    loading,
    error,
    socketConnected,
    refresh,
    updateOrderStatus,
    markAsPickedUp,
    markAsDelivered: markAsDeliveredFromHook, // Rename to avoid conflict
  } = useCourierDashboard();

  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUploadProofModalOpen, setIsUploadProofModalOpen] = useState(false);
  const [selectedOrderForProof, setSelectedOrderForProof] = useState(null);

  // Use custom hook for cross-component synchronization
  const {
    awaitingProofOrders,
    addAwaitingProofOrder,
    removeAwaitingProofOrder,
    isAwaitingProof,
  } = useAwaitingProofOrders();

  // Listen for delivery proof upload completion
  // Refresh data AFTER modal has fully closed to prevent race conditions
  // useEffect(() => {
  //   const handleDeliveryProofUploaded = (event) => {
  //     console.log(
  //       "Delivery proof uploaded, refreshing dashboard...",
  //       event.detail
  //     );
  //     // Small delay to ensure modal is fully unmounted
  //     setTimeout(() => {
  //       refresh();
  //     }, 100);
  //   };

  //   window.addEventListener(
  //     "deliveryProofUploaded",
  //     handleDeliveryProofUploaded
  //   );

  //   return () => {
  //     window.removeEventListener(
  //       "deliveryProofUploaded",
  //       handleDeliveryProofUploaded
  //     );
  //   };
  // }, [refresh]);

  // QR Code handlers
  const handleGenerateQr = async (orderId) => {
    try {
      const result = await generateQrCode(orderId);
      return result;
    } catch (err) {
      console.error("Error generating QR code:", err);
      toast.error(err.response?.data?.message || "Gagal generate QR code");
      throw err;
    }
  };

  const handleScanSuccess = async (qrCodeString) => {
    try {
      setIsVerifying(true);
      toast.info("Memverifikasi QR code...");

      const result = await verifyQrCode(qrCodeString);

      if (result.success) {
        toast.success(
          result.message ||
            "QR code berhasil diverifikasi! Status order diupdate ke OUT_FOR_DELIVERY"
        );

        // Refresh data after successful verification
        await refresh();
      } else {
        toast.error(result.message || "Gagal memverifikasi QR code");
      }
    } catch (err) {
      console.error("Error verifying QR code:", err);
      toast.error(
        err.response?.data?.message ||
          "QR code tidak valid atau sudah digunakan"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScanError = (err) => {
    console.error("Scan error:", err);
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

      toast.success(
        "Order marked as arrived. Please upload delivery proof to complete."
      );

      return { success: true };
    } catch (err) {
      console.error("Error marking as arrived:", err);
      toast.error("Failed to mark order as arrived");
      throw err;
    }
  };

  /**
   * Upload delivery proof and change status to DELIVERED
   */
  const uploadDeliveryProof = async (orderId, photoFile) => {
    try {
      // Upload the photo
      const response = await uploadDeliveryProofAPI(orderId, photoFile);

      // Remove from awaiting proof set (synced across components)
      removeAwaitingProofOrder(orderId);

      // DON'T refresh here - it causes re-render conflict with modal closing
      // Refresh will be called AFTER modal closes in handleUploadFromModal

      return response;
    } catch (err) {
      console.error("Error uploading delivery proof:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to upload delivery proof";
      toast.error(errorMsg);
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

    setTimeout(() => {
      refresh();
    }, 100); // Small delay to ensure modal is fully unmounted
  };

  /**
   * Handle upload from modal
   */
  const handleUploadFromModal = async (orderId, file) => {
    try {
      setUpdatingOrder(orderId);

      // Upload delivery proof
      await uploadDeliveryProof(orderId, file);

      // ✅ Important: Reset updating state immediately
      setUpdatingOrder(null);

      // ✅ Return success first - let modal close
      return Promise.resolve();
    } catch (err) {
      setUpdatingOrder(null);
      throw err;
    }
  };

  // Order action handlers configuration
  const ACTION_HANDLERS = {
    ready: (orderId) =>
      updateOrderStatus(orderId, "READY_FOR_PICKUP", "Paket siap diambil"),
    pickup: (orderId) => markAsPickedUp(orderId),
    arrived: (orderId) => markAsArrived(orderId),
    DELIVERED: (orderId) => markAsDeliveredFromHook(orderId),
  };

  const handleOrderAction = async (orderId, action) => {
    const handler = ACTION_HANDLERS[action];

    if (!handler) {
      console.warn(`Unknown action: ${action}`);
      return;
    }

    try {
      setUpdatingOrder(orderId);
      await handler(orderId);
      await refresh();
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error("Failed to update order");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleCancelOrder = async (orderId, cancelData) => {
    try {
      // In future: implement cancel order API
      toast.info("Cancel order feature coming soon");
    } catch (err) {
      console.error("Error cancelling order:", err);
      toast.error("Failed to cancel order");
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
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  // Button factory functions for reusability
  const createNavigateButton = (to, label, Icon) => (
    <Link to={to}>
      <Button
        size="sm"
        variant="outline"
        className="border-blue-600 text-blue-600 hover:bg-blue-50"
      >
        <Icon className="w-4 h-4 mr-1" />
        {label}
      </Button>
    </Link>
  );

  const createActionButton = (onClick, isUpdating, className, label, Icon) => (
    <Button
      onClick={onClick}
      size="sm"
      className={className}
      disabled={isUpdating}
    >
      {isUpdating ? (
        <>
          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
          Updating...
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 mr-1" />}
          {label}
        </>
      )}
    </Button>
  );

  const createUploadProofButton = (
    orderId,
    className,
    label,
    Icon,
    isUpdating
  ) => (
    <Button
      onClick={() => handleOpenUploadModal(orderId)}
      size="sm"
      className={className}
      disabled={isUpdating}
    >
      {isUpdating ? (
        <>
          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 mr-1" />}
          {label}
        </>
      )}
    </Button>
  );

  // Action button configuration map
  const BUTTON_CONFIG = {
    IN_PREPARATION: (order, isUpdating) =>
      createActionButton(
        () => handleOrderAction(order.id, "ready"),
        isUpdating,
        "bg-orange-600 hover:bg-orange-700",
        "Mark Ready",
        null
      ),

    READY_FOR_PICKUP: (order, isUpdating) => (
      <div className="flex space-x-2">
        {createNavigateButton(
          `/courier/store-location/order/${order.id}`,
          "Navigate to store",
          MapPin
        )}
        {createActionButton(
          () => handleOrderAction(order.id, "pickup"),
          isUpdating,
          "bg-purple-600 hover:bg-purple-700",
          "Pick Up",
          Package
        )}
      </div>
    ),

    OUT_FOR_DELIVERY: (order, isUpdating) => {
      return (
        <div className="flex space-x-2">
          {createNavigateButton(
            `/courier/customer-location/order/${order.id}`,
            "Customer",
            Navigation
          )}
          {createActionButton(
            () => handleOrderAction(order.id, "arrived"),
            isUpdating,
            "bg-green-600 hover:bg-green-700",
            "Mark as Arrived",
            CheckCircle2
          )}
        </div>
      );
    },

    ARRIVED_AT_DESTINATION: (order, isUpdating) => {
      // ✅ Use Set.has() directly - O(1) lookup, no unnecessary memoization
      const awaitingProof = awaitingProofOrders.has(order.id);

      return (
        <div className="flex space-x-2">
          {createNavigateButton(
            `/courier/customer-location/order/${order.id}`,
            "Customer",
            Navigation
          )}
          {/* Show different button based on whether awaiting proof upload */}
          {awaitingProof
            ? createUploadProofButton(
                order.id,
                "bg-blue-600 hover:bg-blue-700",
                "Upload Proof",
                Upload,
                isUpdating
              )
            : createActionButton(
                () => handleOrderAction(order.id, "DELIVERED"),
                isUpdating,
                "bg-purple-600 hover:bg-purple-700",
                "Mark as Delivered",
                CheckCircle2
              )}
        </div>
      );
    },

    DELIVERED: (order) => null,
  };

  const getActionButton = (order) => {
    const isUpdating = updatingOrder === order.id;

    // Early return for non-actionable statuses
    if (["CANCELED", "DISPUTED"].includes(order.orderStatus)) {
      return null;
    }

    // ✅ ADD COMPLETED to prevent button after fully done
    if (order.orderStatus === "DELIVERED") {
      return null;
    }

    const buttonFactory = BUTTON_CONFIG[order.orderStatus];
    return buttonFactory ? buttonFactory(order, isUpdating) : null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || "Courier"}!
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <span>Your delivery zone</span>
            {socketConnected ? (
              <Badge className="bg-green-100 text-green-800">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </p>
        </div>
        <Button
          onClick={refresh}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* QR Code Generator - Development (Commented) */}
      {/* {activeOrders.length > 0 && activeOrders[0] && (
        <QrCodeGenerator
          orderId={activeOrders[0].id}
          onGenerate={handleGenerateQr}
          onError={(err) => console.error("QR Generator error:", err)}
        />
      )} */}

      {/* Active Orders & QR Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Active Orders - Left Column */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Truck className="h-5 w-5 text-blue-600 mr-2" />
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
                <p className="text-gray-500">Loading orders...</p>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active orders at the moment</p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Order #{order.id.substring(0, 8)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {order.user?.name || "Customer"}
                      </p>
                    </div>
                    {getStatusBadge(order.orderStatus)}
                  </div>

                  <div className="space-y-2 text-sm">
                    {order.deliveryAddress && (
                      <div className="flex items-start text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {order.deliveryAddress.fullAddress ||
                            `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Package className="h-4 w-4 mr-2" />
                      <span>
                        Total: {formatCurrency(Number(order.subtotal || 0))} +
                        {formatCurrency(Number(order.deliveryFee || 0))} fee
                      </span>
                    </div>
                    {order.deliveryAddress && (
                      <div className="flex flex-col text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Atas nama,{" "}
                          <span className="font-semibold ml-1">
                            {order.deliveryAddress.recipientName}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 mr-2" />
                          {order.deliveryAddress.recipientPhone}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t">{getActionButton(order)}</div>

                  {order.orderStatus === "CANCELED" && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      <strong>Cancelled</strong>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Link to view all orders */}
            {!loading && activeOrders.length > 0 && (
              <div className="pt-2">
                <Link to="/courier/orders">
                  <Button variant="outline" className="w-full">
                    View All Orders
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Scanner - Right Column */}
        <div>
          <QrCodeScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />
        </div>
      </div>

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

export default CourierDashboard;
