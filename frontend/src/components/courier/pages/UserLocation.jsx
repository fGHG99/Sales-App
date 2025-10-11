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
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../utils/api";
import CourierNavigationMap from "../maps/CourierNavigationMap";

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
        {/* Navigation Map - 2 columns */}
        <div className="lg:col-span-2">
          <CourierNavigationMap
            destination={{
              latitude: order.deliveryAddress.latitude,
              longitude: order.deliveryAddress.longitude,
              address: order.deliveryAddress.fullAddress,
              recipientName: order.deliveryAddress.recipientName,
            }}
            onArrived={handleArrival}
          />
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

          {/* Order Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status Order</span>
                <Badge
                  className={
                    order.orderStatus === "OUT_FOR_DELIVERY"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-orange-100 text-orange-800"
                  }
                >
                  {order.orderStatus === "OUT_FOR_DELIVERY"
                    ? "Dalam Perjalanan"
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

export default UserLocation;
