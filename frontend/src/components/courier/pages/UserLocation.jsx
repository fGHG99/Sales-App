import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Package,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../utils/api";
import CourierNavigationMap from "../maps/CourierNavigationMap";
import UploadDeliveryProofModal from "../modal/UploadDeliveryProofModal";
import useAwaitingProofOrders from "../../../hooks/useAwaitingProofOrders";
import {
  updateOrderStatus as updateOrderStatusAPI,
  uploadDeliveryProof as uploadDeliveryProofAPI,
} from "../../../services/courierService";

/**
 * User Location Page - Courier Navigation to Customer
 * Uses OpenRouteService for real-time navigation
 * Auto-updates location to Redis every 3 seconds
 */
const UserLocation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasArrived, setHasArrived] = useState(false); // ✅ Track arrival state
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [isUploadProofModalOpen, setIsUploadProofModalOpen] = useState(false);

  // Use custom hook for cross-component synchronization
  const {
    awaitingProofOrders,
    addAwaitingProofOrder,
    removeAwaitingProofOrder,
  } = useAwaitingProofOrders();

  /**
   * Fetch order details
   */
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/orders/detail/${orderId}`);

        if (!response.data?.order) {
          throw new Error("Order tidak ditemukan");
        }

        const orderData = response.data.order;

        // Validate delivery address coordinates
        if (
          !orderData.deliveryAddress?.latitude ||
          !orderData.deliveryAddress?.longitude
        ) {
          throw new Error(
            "Koordinat alamat pengiriman tidak tersedia. Hubungi customer untuk koordinat yang valid."
          );
        }

        setOrder(orderData);
      } catch (err) {
        console.error("❌ Failed to fetch order:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Gagal memuat detail order"
        );
        toast.error("Gagal memuat detail order");
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  /**
   * Handle courier arrival (called from CourierNavigationMap)
   */
  const handleArrival = () => {
    setHasArrived(true); // ✅ Update arrival state
    toast.success("Anda telah tiba di lokasi customer!", {
      description:
        "Navigasi akan otomatis berhenti dalam 3 detik. Silakan hubungi customer untuk pengiriman paket.",
      duration: 6000,
    });
  };

  /**
   * Fetch fresh order data
   */
  const refreshOrderData = async () => {
    try {
      const response = await api.get(`/orders/detail/${orderId}`);
      if (response.data?.order) {
        setOrder(response.data.order);
      }
    } catch (err) {
      console.error("Error refreshing order data:", err);
    }
  };

  /**
   * Mark order as arrived at destination
   * This changes status to ARRIVED_AT_DESTINATION
   */
  const markAsArrived = async () => {
    try {
      setUpdatingOrder(true);

      // Update backend status via API
      await updateOrderStatusAPI(
        orderId,
        "ARRIVED_AT_DESTINATION",
        "Order arrived at destination"
      );

      // Update frontend state after successful API call
      addAwaitingProofOrder(orderId);

      // Refresh order data to get updated status
      await refreshOrderData();

      toast.success(
        "Order marked as arrived. Please upload delivery proof to complete."
      );

      return { success: true };
    } catch (err) {
      console.error("Error marking as arrived:", err);
      toast.error("Failed to mark order as arrived");
      throw err;
    } finally {
      setUpdatingOrder(false);
    }
  };

  /**
   * Upload delivery proof and change status to DELIVERED
   */
  const uploadDeliveryProof = async (photoFile) => {
    try {
      setUpdatingOrder(true);

      // Upload the photo
      const response = await uploadDeliveryProofAPI(orderId, photoFile);

      // Remove from awaiting proof set (synced across components)
      removeAwaitingProofOrder(orderId);

      // Refresh order data
      await refreshOrderData();

      toast.success("Delivery proof uploaded successfully!");

      return response;
    } catch (err) {
      console.error("Error uploading delivery proof:", err);
      const errorMsg =
        err.response?.data?.message || "Failed to upload delivery proof";
      toast.error(errorMsg);
      throw err;
    } finally {
      setUpdatingOrder(false);
    }
  };

  /**
   * Open upload proof modal
   */
  const handleOpenUploadModal = () => {
    setIsUploadProofModalOpen(true);
  };

  /**
   * Close upload proof modal
   */
  const handleCloseUploadModal = () => {
    setIsUploadProofModalOpen(false);
  };

  /**
   * Handle upload from modal
   */
  const handleUploadFromModal = async (orderIdParam, file) => {
    try {
      // Upload delivery proof
      await uploadDeliveryProof(file);

      // Return success to modal
      return Promise.resolve();
    } catch (err) {
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Memuat detail order...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Terjadi Kesalahan</h3>
            <p className="text-sm text-red-700 mt-1">
              {error || "Order tidak ditemukan"}
            </p>
            <Button
              onClick={() => navigate("/courier/orders")}
              variant="outline"
              className="mt-3"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Order
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header - Dynamic based on arrival status */}
      <div className="mb-6">
        <Button
          onClick={() => navigate("/courier/orders")}
          variant="outline"
          size="sm"
          className="mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Daftar Order
        </Button>

        {/* ✅ Conditional Header - Show arrival status */}
        {hasArrived ? (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 rounded-full p-2">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-green-900">
                  🎉 Anda Telah Sampai!
                </h1>
                <p className="text-green-700 mt-1">
                  Navigasi akan otomatis berhenti. Silakan hubungi customer
                  untuk menyerahkan paket.
                </p>
              </div>
              <Badge className="bg-green-500 text-white text-sm px-3 py-1">
                Tiba di Tujuan
              </Badge>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Navigasi ke Customer
            </h1>
            <p className="text-gray-600">Order #{order.id.substring(0, 8)}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Map - Available for OUT_FOR_DELIVERY and ARRIVED_AT_DESTINATION */}
        <div className="lg:col-span-2">
          {order.orderStatus === "OUT_FOR_DELIVERY" ||
          order.orderStatus === "ARRIVED_AT_DESTINATION" ? (
            <CourierNavigationMap
              destination={{
                latitude: order.deliveryAddress.latitude,
                longitude: order.deliveryAddress.longitude,
                address: order.deliveryAddress.fullAddress,
                recipientName: order.deliveryAddress.recipientName,
              }}
              orderId={order.id}
              onArrived={handleArrival}
            />
          ) : (
            <Card className="h-96">
              <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
                <MapPin className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Navigation Not Available
                </h3>
                <p className="text-gray-600 max-w-md">
                  {order.orderStatus === "PENDING"
                    ? "You can only navigate when order status is OUT_FOR_DELIVERY"
                    : order.orderStatus === "IN_PREPARATION"
                    ? "Order is being prepared. Navigation will be available once you pick it up."
                    : order.orderStatus === "READY_FOR_PICKUP"
                    ? "Please pick up the order from the store first."
                    : order.orderStatus === "DELIVERED"
                    ? "Order has been delivered. Navigation is no longer needed."
                    : "Navigation is not available for this order status."}
                </p>
                <Badge className="mt-4 bg-gray-100 text-gray-800">
                  Status: {order.orderStatus.replace(/_/g, " ")}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Details Sidebar - 1 column */}
        <div className="space-y-4">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                Detail Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Penerima</p>
                  <p className="font-medium text-gray-900">
                    {order.deliveryAddress.recipientName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Alamat Lengkap</p>
                  <p className="text-sm text-gray-700">
                    {order.deliveryAddress.fullAddress}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.deliveryAddress.city},{" "}
                    {order.deliveryAddress.province}
                  </p>
                </div>

                {order.deliveryAddress.recipientPhone && (
                  <div>
                    <p className="text-xs text-gray-500">Nomor Telepon</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-medium text-gray-900">
                        {order.deliveryAddress.recipientPhone}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open(
                            `tel:${order.deliveryAddress.recipientPhone}`
                          );
                        }}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Hubungi
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Package className="w-5 h-5 text-blue-600 mr-2" />
                Paket Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.orderItems &&
                  typeof order.orderItems === "object" &&
                  Array.isArray(order.orderItems) &&
                  order.orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} × Rp{" "}
                          {Number(item.price || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Rp {Number(item.total || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ongkir</span>
                  <span className="font-medium">
                    Rp {Number(order.deliveryFee || 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-blue-600">
                    Rp{" "}
                    {(
                      (Array.isArray(order.orderItems)
                        ? order.orderItems.reduce(
                            (sum, item) => sum + Number(item.total || 0),
                            0
                          )
                        : 0) + Number(order.deliveryFee || 0)
                    ).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Uang yang Harus Dibawa</span>
                  <span className="font-medium text-gray-900">
                    Rp {Number(order.changeAmount || 0).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action & Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Action & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status Order</span>
                <Badge
                  className={
                    order.orderStatus === "OUT_FOR_DELIVERY"
                      ? "bg-purple-100 text-purple-800"
                      : order.orderStatus === "ARRIVED_AT_DESTINATION"
                      ? "bg-blue-100 text-blue-800"
                      : order.orderStatus === "DELIVERED"
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }
                >
                  {order.orderStatus === "OUT_FOR_DELIVERY"
                    ? "Dalam Perjalanan"
                    : order.orderStatus === "ARRIVED_AT_DESTINATION"
                    ? "Tiba di Lokasi"
                    : order.orderStatus === "DELIVERED"
                    ? "Terkirim"
                    : order.orderStatus}
                </Badge>
              </div>

              {/* Action Buttons - Conditional based on status */}
              {order.orderStatus === "OUT_FOR_DELIVERY" && (
                <Button
                  onClick={markAsArrived}
                  disabled={updatingOrder}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {updatingOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Arrived
                    </>
                  )}
                </Button>
              )}

              {order.orderStatus === "ARRIVED_AT_DESTINATION" &&
                awaitingProofOrders.has(orderId) && (
                  <Button
                    onClick={handleOpenUploadModal}
                    disabled={updatingOrder}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {updatingOrder ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Proof
                      </>
                    )}
                  </Button>
                )}

              {order.orderStatus === "DELIVERED" && (
                <div className="text-center text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                  ✓ Delivery completed successfully
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Delivery Proof Modal */}
      <UploadDeliveryProofModal
        isOpen={isUploadProofModalOpen}
        onClose={handleCloseUploadModal}
        orderId={orderId}
        onUploadSuccess={handleUploadFromModal}
      />
    </div>
  );
};

export default UserLocation;
