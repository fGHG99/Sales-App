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
  Store,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../utils/api";
import CourierNavigationMap from "../maps/CourierNavigationMap";

/**
 * Store Location Page - Courier Navigation to Pickup Store
 * Uses OpenRouteService for real-time navigation to store
 * Auto-updates location to Redis every 3 seconds
 */
const StoreLocation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);

  /**
   * Fetch order details with pickup store information
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
        console.log("📦 Fetched order data:", orderData);

        // Validate pickup store exists
        if (!orderData.pickupStore) {
          throw new Error("Data toko pickup tidak tersedia untuk order ini");
        }

        // Validate store address coordinates
        if (
          !orderData.pickupStore.address?.latitude ||
          !orderData.pickupStore.address?.longitude
        ) {
          throw new Error(
            "Koordinat lokasi toko tidak tersedia. Hubungi admin untuk update koordinat toko."
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
   * Handle courier arrival at store (called from CourierNavigationMap)
   */
  const handleArrival = () => {
    setHasArrived(true);
    toast.success("Anda telah tiba di toko!", {
      description:
        "Navigasi akan otomatis berhenti dalam 3 detik. Silakan ambil paket untuk dikirim ke customer.",
      duration: 6000,
    });
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

        {/* Conditional Header - Show arrival status */}
        {hasArrived ? (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 rounded-full p-2">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-green-900">
                  🎉 Anda Telah Sampai di Toko!
                </h1>
                <p className="text-green-700 mt-1">
                  Navigasi akan otomatis berhenti. Silakan ambil paket untuk
                  dikirim ke customer.
                </p>
              </div>
              <Badge className="bg-green-500 text-white text-sm px-3 py-1">
                Tiba di Toko
              </Badge>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Navigasi ke Toko Pickup
            </h1>
            <p className="text-gray-600">Order #{order.id.substring(0, 8)}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Map - Show when READY_FOR_PICKUP or OUT_FOR_DELIVERY */}
        <div className="lg:col-span-2">
          {order.orderStatus === "READY_FOR_PICKUP" ||
          order.orderStatus === "OUT_FOR_DELIVERY" ? (
            <CourierNavigationMap
              destination={{
                latitude: order.pickupStore.address.latitude,
                longitude: order.pickupStore.address.longitude,
                address: order.pickupStore.address.fullAddress,
                recipientName: order.pickupStore.name,
              }}
              orderId={order.id}
              onArrived={handleArrival}
            />
          ) : (
            <Card className="h-96">
              <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
                <Store className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Navigation Not Available
                </h3>
                <p className="text-gray-600 max-w-md">
                  {order.orderStatus === "PENDING"
                    ? "Waiting for order to be prepared. Navigation will be available when ready for pickup."
                    : order.orderStatus === "IN_PREPARATION"
                    ? "Order is being prepared. Navigation will be available once ready for pickup."
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

        {/* Store Details Sidebar - 1 column */}
        <div className="space-y-4">
          {/* Store Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Store className="w-5 h-5 text-blue-600 mr-2" />
                Detail Toko Pickup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Nama Toko</p>
                  <p className="font-medium text-gray-900">
                    {order.pickupStore.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Alamat Lengkap</p>
                  <p className="text-sm text-gray-700">
                    {order.pickupStore.address.fullAddress}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.pickupStore.address.city},{" "}
                    {order.pickupStore.address.province}
                  </p>
                </div>

                {order.pickupStore.phoneNumber && (
                  <div>
                    <p className="text-xs text-gray-500">Nomor Telepon Toko</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-medium text-gray-900">
                        {order.pickupStore.phoneNumber}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          window.open(`tel:${order.pickupStore.phoneNumber}`);
                        }}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Hubungi
                      </Button>
                    </div>
                  </div>
                )}

                {/* Store Hours */}
                <div>
                  <p className="text-xs text-gray-500">Jam Operasional</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-700">
                      {new Date(order.pickupStore.openHour).toLocaleTimeString(
                        "id-ID",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}{" "}
                      -{" "}
                      {new Date(order.pickupStore.closeHour).toLocaleTimeString(
                        "id-ID",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items to Pickup */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Package className="w-5 h-5 text-blue-600 mr-2" />
                Paket yang Akan Diambil
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
                          {Number(
                            item.price || item.pricePerItem || 0
                          ).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Rp {Number(item.total || 0).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}

                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ongkir</span>
                    <span className="font-medium">
                      Rp{" "}
                      {Number(order.deliveryFee || 0).toLocaleString("id-ID")}
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
                      Rp{" "}
                      {Number(order.changeAmount || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <MapPin className="w-5 h-5 text-orange-600 mr-2" />
                Alamat Tujuan Pengiriman
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Penerima</p>
                <p className="font-medium text-gray-900">
                  {order.deliveryAddress.recipientName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Alamat</p>
                <p className="text-sm text-gray-700">
                  {order.deliveryAddress.fullAddress}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {order.deliveryAddress.city}, {order.deliveryAddress.province}
                </p>
              </div>
              {order.deliveryAddress.recipientPhone && (
                <div>
                  <p className="text-xs text-gray-500">No. Telepon</p>
                  <p className="text-sm font-medium text-gray-900">
                    {order.deliveryAddress.recipientPhone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status Order</span>
                <Badge
                  className={
                    order.orderStatus === "OUT_FOR_DELIVERY"
                      ? "bg-purple-100 text-purple-800"
                      : order.orderStatus === "READY_FOR_PICKUP"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-orange-100 text-orange-800"
                  }
                >
                  {order.orderStatus === "OUT_FOR_DELIVERY"
                    ? "Dalam Perjalanan"
                    : order.orderStatus === "READY_FOR_PICKUP"
                    ? "Siap Diambil"
                    : order.orderStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StoreLocation;
