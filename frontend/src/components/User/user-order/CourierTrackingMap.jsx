import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { Truck, MapPin, Navigation, AlertCircle } from "lucide-react";
import api from "../../../utils/api";

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

/**
 * CourierTrackingMap Component - Optimized for Web-Based Tracking
 *
 * Features:
 * - Dual markers: Courier (blue truck) + User delivery address (red pin)
 * - Adaptive polling: 5s for OUT_FOR_DELIVERY, 15s for READY_FOR_PICKUP
 * - Stale detection: Warning if location > 5 minutes old
 * - Retry logic: Max 5 consecutive failures before stopping
 * - Auto-fit bounds to show both markers
 *
 * @param {Object} order - Order object dengan deliveryAddress dan courier info
 * @param {string} courierId - ID kurir untuk fetch location dari Redis
 */
const CourierTrackingMap = ({ order, courierId }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const courierMarker = useRef(null);
  const userMarker = useRef(null);
  const [courierLocation, setCourierLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const intervalRef = useRef(null);

  // ✅ Fetch courier location dengan stale detection
  const fetchCourierLocation = async () => {
    try {
      const response = await api.get(`/courier/location/${courierId}`);

      if (response.data.success && response.data.location) {
        const { latitude, longitude, timestamp } = response.data.location;

        const location = {
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
          timestamp: new Date(timestamp),
        };

        setCourierLocation(location);
        setError(null);
        setRetryCount(0);

        // ✅ Check if location is stale (> 5 minutes old)
        const ageMinutes = (new Date() - location.timestamp) / (1000 * 60);
        setIsStale(ageMinutes > 5);

        console.log("📍 Courier location:", {
          lat: latitude,
          lng: longitude,
          ageMinutes: Math.floor(ageMinutes),
          isStale: ageMinutes > 5,
        });
      } else {
        setError("Lokasi kurir tidak tersedia");
      }
    } catch (err) {
      console.error("Error fetching courier location:", err);

      setRetryCount((prev) => prev + 1);

      // ✅ Stop polling after 5 consecutive failures
      if (retryCount >= 5) {
        setError("Gagal mengambil lokasi kurir setelah beberapa percobaan");
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setError(`Gagal mengambil lokasi (percobaan ${retryCount + 1}/5)`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    maptilersdk.config.apiKey = MAPTILER_API_KEY;

    // Default center (akan di-adjust nanti)
    const center =
      order.deliveryAddress?.longitude && order.deliveryAddress?.latitude
        ? [order.deliveryAddress.longitude, order.deliveryAddress.latitude]
        : [107.6191, -6.9175]; // Default Bandung

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: center,
      zoom: 14,
    });

    map.current.on("load", () => {
      setIsLoading(false);
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [order]);

  // Add/update user location marker (delivery address)
  useEffect(() => {
    if (!map.current || !order.deliveryAddress) return;

    const { latitude, longitude } = order.deliveryAddress;

    if (!latitude || !longitude) {
      console.warn("Delivery address tidak memiliki koordinat");
      return;
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLng)) {
      console.warn("Koordinat delivery address tidak valid");
      return;
    }

    // Create custom HTML element for user marker
    const userMarkerEl = document.createElement("div");
    userMarkerEl.className = "custom-marker-user";
    userMarkerEl.innerHTML = `
      <div style="
        background: #ef4444;
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          style="transform: rotate(45deg);"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `;

    if (!userMarker.current) {
      userMarker.current = new maptilersdk.Marker({ element: userMarkerEl })
        .setLngLat([userLng, userLat])
        .setPopup(
          new maptilersdk.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px;">
              <strong>Alamat Pengiriman</strong><br/>
              ${
                order.deliveryAddress.fullAddress || "Alamat tidak tersedia"
              }<br/>
              <small>${order.deliveryAddress.city}, ${
              order.deliveryAddress.province
            }</small>
            </div>`
          )
        )
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([userLng, userLat]);
    }
  }, [order, map.current]);

  // Add/update courier location marker
  useEffect(() => {
    if (!map.current || !courierLocation) return;

    const { lat, lng } = courierLocation;

    // Create custom HTML element for courier marker (truck icon)
    const courierMarkerEl = document.createElement("div");
    courierMarkerEl.className = "custom-marker-courier";
    courierMarkerEl.innerHTML = `
      <div style="
        background: #3b82f6;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        animation: pulse 2s infinite;
      ">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
        >
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
      </div>
    `;

    // Add CSS animation
    if (!document.getElementById("courier-marker-animation")) {
      const style = document.createElement("style");
      style.id = "courier-marker-animation";
      style.textContent = `
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `;
      document.head.appendChild(style);
    }

    if (!courierMarker.current) {
      courierMarker.current = new maptilersdk.Marker({
        element: courierMarkerEl,
      })
        .setLngLat([lng, lat])
        .setPopup(
          new maptilersdk.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px;">
              <strong>🚚 Kurir</strong><br/>
              ${order.courier?.name || "Kurir"}<br/>
              <small>Diperbarui: ${courierLocation.timestamp.toLocaleTimeString(
                "id-ID"
              )}</small>
            </div>`
          )
        )
        .addTo(map.current);
    } else {
      // Smooth animation when updating position
      courierMarker.current.setLngLat([lng, lat]);
    }

    // Fit bounds to show both markers
    if (userMarker.current && courierMarker.current) {
      const userPos = userMarker.current.getLngLat();
      const courierPos = courierMarker.current.getLngLat();

      const bounds = new maptilersdk.LngLatBounds()
        .extend([userPos.lng, userPos.lat])
        .extend([courierPos.lng, courierPos.lat]);

      map.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 15,
      });
    }
  }, [courierLocation, order]);

  // ✅ Adaptive polling based on order status
  useEffect(() => {
    if (!courierId) return;

    // Initial fetch
    fetchCourierLocation();

    // ✅ Adaptive interval:
    // - 5 seconds for OUT_FOR_DELIVERY (active delivery)
    // - 15 seconds for READY_FOR_PICKUP (waiting pickup)
    // - Stop for other statuses
    const pollInterval =
      order.orderStatus === "OUT_FOR_DELIVERY"
        ? 5000 // 5 seconds
        : order.orderStatus === "READY_FOR_PICKUP"
        ? 15000 // 15 seconds
        : null;

    if (pollInterval) {
      intervalRef.current = setInterval(() => {
        fetchCourierLocation();
      }, pollInterval);

      console.log(
        `🔄 Polling started: ${pollInterval / 1000}s interval for ${
          order.orderStatus
        }`
      );
    } else {
      console.log("⏸️ Polling stopped: Order status not trackable");
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [courierId]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        className="w-full h-full rounded-md"
        style={{ minHeight: "400px" }}
      />

      {/* ✅ Stale Location Warning */}
      {isStale && courierLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2 z-10 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            ⚠️ Lokasi kurir terakhir diperbarui{" "}
            {Math.floor((new Date() - courierLocation.timestamp) / 60000)} menit
            lalu
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">Kurir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">Alamat Anda</span>
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <div className="text-sm">
          {isLoading ? (
            <span className="text-gray-500">Memuat peta...</span>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : courierLocation ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 font-medium">Live Tracking</span>
            </div>
          ) : (
            <span className="text-gray-500">Menunggu lokasi kurir...</span>
          )}
        </div>
        {courierLocation && (
          <div className="text-xs text-gray-500 mt-1">
            Update: {courierLocation.timestamp.toLocaleTimeString("id-ID")}
          </div>
        )}
      </div>

      {/* Courier Info Card */}
      {order.courier && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">
                {order.courier.name}
              </h4>
              <p className="text-sm text-gray-600">{order.courier.phone}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Status Pesanan</div>
              <div className="font-medium text-blue-600">
                {order.orderStatus}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierTrackingMap;
