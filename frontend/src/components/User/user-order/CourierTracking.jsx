import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Truck, Clock, Phone } from "lucide-react";
import CourierTrackingMap from "./CourierTrackingMap";
import api from "../../../utils/api";

const BE_URL = import.meta.env.VITE_BE_API_URL;

const CourierTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("Order ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log("📦 Fetching order details for tracking:", orderId);
        const response = await api.get(`/order/detail/${orderId}`);

        console.log("✅ Order fetched:", response.data);
        setOrder(response.data.order);

        // Validate order has required data for tracking
        if (!response.data.order.courier) {
          setError("No courier assigned to this order");
        } else if (
          !response.data.order.deliveryAddress?.latitude ||
          !response.data.order.deliveryAddress?.longitude
        ) {
          setError("Delivery address coordinates not available");
        }
      } catch (err) {
        console.error("❌ Failed to fetch order:", err);
        setError(err.response?.data?.message || "Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const formatCurrency = (amount) => {
    return `Rp ${parseFloat(amount).toLocaleString("id-ID")}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_PREPARATION: "bg-blue-100 text-blue-800",
      READY_FOR_PICKUP: "bg-purple-100 text-purple-800",
      OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
      DELIVERED: "bg-green-100 text-green-800",
      COMPLETED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Get initials from name for avatar fallback
  const getInitials = (name) => {
    if (!name) return "??";
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Format phone number for WhatsApp (remove leading 0, add country code)
  const formatWhatsAppNumber = (phone) => {
    if (!phone) return "";
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, "");
    // If starts with 0, replace with 62 (Indonesia country code)
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.substring(1);
    }
    // If doesn't start with country code, add 62
    if (!cleaned.startsWith("62")) {
      cleaned = "62" + cleaned;
    }
    return cleaned;
  };

  // Handle WhatsApp click
  const handleWhatsAppClick = () => {
    const formattedNumber = formatWhatsAppNumber(order.courier.phone);
    const message = encodeURIComponent(
      `Halo ${
        order.courier.name
      }, saya ingin menanyakan tentang pengiriman order #${order.id.slice(
        0,
        8
      )}`
    );
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Truck className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Tracking Unavailable
          </h2>
          <p className="text-gray-600 mb-6">{error || "Order not found"}</p>
          <button
            onClick={() => navigate("/user/orders")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/user/orders")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Orders</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Track Your Delivery
              </h1>
              <p className="text-gray-600">
                Order #{order.id.slice(0, 8)} •
                <span
                  className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order.orderStatus
                  )}`}
                >
                  {order.orderStatus.replace(/_/g, " ")}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Live Location
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time tracking of your order
                </p>
              </div>
              <div className="h-96 lg:h-[500px]">
                <CourierTrackingMap
                  order={order}
                  courierId={order.courier.id}
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Courier and Order Info */}
          <div className="space-y-6">
            {/* Courier Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Courier Information
              </h2>

              {/* Courier Avatar and Details */}
              <div className="space-y-4">
                {/* Avatar Section */}
                <div className="flex items-center gap-4 pb-4 border-b">
                  {order.courier.image?.url ? (
                    // Profile Image
                    <img
                      src={`${BE_URL}${order.courier.image.url}`}
                      alt={order.courier.image.altText || order.courier.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-100"
                    />
                  ) : (
                    // Fallback Avatar with Initials
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-2 ring-blue-100">
                      <span className="text-white text-xl font-bold">
                        {getInitials(order.courier.name)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg">
                      {order.courier.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Your Delivery Courier
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a
                    href={`tel:${order.courier.phone}`}
                    className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2 mt-1"
                  >
                    <Phone className="h-4 w-4" />
                    {order.courier.phone}
                  </a>
                </div>

                {/* WhatsApp Button */}
                <div>
                  <button
                    onClick={handleWhatsAppClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors group"
                  >
                    <img
                      src="/icons/whatsapp.svg"
                      alt="WhatsApp"
                      className="w-5 h-5"
                    />
                    <span className="text-green-700 font-medium text-sm">
                      Chat via WhatsApp
                    </span>
                  </button>
                </div>

                {order.courier.vehicleType && (
                  <div>
                    <p className="text-sm text-gray-500">Vehicle</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {order.courier.vehicleType}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Delivery Address
              </h2>

              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">
                  {order.deliveryAddress.recipientName}
                </p>
                <p className="text-gray-600">
                  {order.deliveryAddress.recipientPhone}
                </p>
                <p className="text-gray-600">
                  {order.deliveryAddress.fullAddress}
                </p>
                <p className="text-gray-600">
                  {order.deliveryAddress.city}, {order.deliveryAddress.province}{" "}
                  {order.deliveryAddress.postalCode}
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Order Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items</span>
                  <span className="font-medium">
                    {order.orderItems?.length || 0} item(s)
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">
                    {formatCurrency(order.deliveryFee)}
                  </span>
                </div>

                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourierTracking;
