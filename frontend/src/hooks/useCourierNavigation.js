import { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import api from "../utils/api";
import {
  getRouteDirections,
  formatETA,
  formatDistance,
  decodePolyline,
  isWithinRadius,
} from "../services/navigationService";

/**
 * Hook untuk navigasi kurir dengan OpenRouteService
 * - GPS tracking: Update setiap 3 detik (smooth map movement)
 * - Backend updates: Update setiap 35 detik (rate limit safe)
 * - Fetch route directions from OpenRouteService
 * - Real-time ETA calculation
 * - Auto-stop when arrived at destination
 *
 * @param {Object} destination - { latitude, longitude, address }
 * @returns {Object} Navigation state and controls
 */
const useCourierNavigation = (destination) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [error, setError] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);

  const watchIdRef = useRef(null);
  const backendUpdateIntervalRef = useRef(null); // ✅ For 5-second backend updates
  const lastLocationRef = useRef(null);
  const socketRef = useRef(null);
  const [orderId, setOrderId] = useState(null);
  const [courierId, setCourierId] = useState(null);

  // ✅ Refs for preventing excessive logs and API calls
  const lastLogTimeRef = useRef(0);
  const isProcessingRef = useRef(false); // Prevent concurrent API calls

  /**
   * Initialize Socket.IO connection for real-time location sharing
   * ✅ WebSocket-first with polling fallback
   */
  useEffect(() => {
    // Connect to Socket.IO server
    const socket = io(
      import.meta.env.VITE_BE_API_URL || "http://localhost:3000",
      {
        transports: ["websocket", "polling"], // Try WebSocket first
        upgrade: true, // Allow upgrade from polling to WebSocket
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000,
        autoConnect: true,
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected for courier navigation");
      console.log(`   Transport: ${socket.io.engine.transport.name}`);
    });

    // ✅ Handle connection errors gracefully
    socket.on("connect_error", (error) => {
      console.warn("⚠️ Socket connection error, will retry or use polling");
    });

    // ✅ Log transport upgrades
    socket.io.engine.on("upgrade", (transport) => {
      console.log(`🚀 Courier socket upgraded to: ${transport.name}`);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    socket.on("error", (err) => {
      console.error("❌ Socket error:", err);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  /**
   * Get user/courier info from localStorage
   */
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.id) {
        setCourierId(user.id);
      }
    } catch (err) {
      console.error("Failed to get user info:", err);
    }
  }, []);

  /**
   * Throttled console log - only log every 3 seconds to prevent spam
   */
  const throttledLog = useCallback((message, data) => {
    const now = Date.now();
    if (now - lastLogTimeRef.current > 3000) {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
      lastLogTimeRef.current = now;
    }
  }, []);

  /**
   * Send location to backend (Redis) AND emit socket - called every 5 seconds
   * Always sends location regardless of movement (no distance check)
   */
  const sendLocationToBackend = useCallback(
    async (latitude, longitude) => {
      // ✅ Prevent concurrent API calls
      if (isProcessingRef.current) {
        throttledLog(
          "⏳ [COURIER] Already processing location update - skipping"
        );
        return;
      }

      isProcessingRef.current = true;
      const startTime = Date.now();

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📤 [COURIER] Sending location update...");
      console.log(`   Courier ID: ${courierId}`);
      console.log(`   Order ID: ${orderId || "none"}`);
      console.log(`   Coordinates: ${latitude}, ${longitude}`);
      console.log(`   Timestamp: ${new Date().toISOString()}`);

      try {
        // 1. Send to REST API (for Redis cache)
        console.log("   🌐 Sending to REST API...");
        await api.post("/courier/location", {
          latitude,
          longitude,
        });
        console.log("   ✅ Successfully stored in Redis");

        // 2. Emit socket event for real-time updates to customers
        if (
          socketRef.current &&
          socketRef.current.connected &&
          courierId &&
          orderId
        ) {
          console.log("   📡 Broadcasting via Socket.IO...");
          socketRef.current.emit("courier-share-location", {
            courierId,
            orderId,
            latitude,
            longitude,
          });
          console.log(`   ✅ Broadcasted to order:${orderId}`);
        } else {
          const reasons = [];
          if (!socketRef.current?.connected)
            reasons.push("socket not connected");
          if (!courierId) reasons.push("no courierId");
          if (!orderId) reasons.push("no orderId");
          console.warn(`   ⚠️ Socket broadcast skipped: ${reasons.join(", ")}`);
        }

        const processingTime = Date.now() - startTime;
        console.log(`   ⏱️ Processing time: ${processingTime}ms`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("");
      } catch (err) {
        const processingTime = Date.now() - startTime;
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [COURIER] Location update FAILED");
        console.error(`   Error: ${err.message}`);
        console.error(`   Status: ${err.response?.status || "unknown"}`);
        console.error(`   Processing time: ${processingTime}ms`);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("");
      } finally {
        isProcessingRef.current = false;
      }
    },
    [courierId, orderId, throttledLog]
  );

  /**
   * Fetch route from current location to destination
   */
  const fetchRoute = useCallback(
    async (startLng, startLat) => {
      if (!destination?.longitude || !destination?.latitude) {
        console.warn("⚠️ No destination coordinates provided");
        return;
      }

      setIsLoadingRoute(true);
      try {
        const routeData = await getRouteDirections(
          startLng,
          startLat,
          destination.longitude,
          destination.latitude,
          "driving-car"
        );

        // Decode polyline geometry for map rendering
        const coordinates = decodePolyline(routeData.geometry);

        setRoute({
          ...routeData,
          coordinates, // Decoded polyline
          eta: formatETA(routeData.duration),
          distanceText: formatDistance(routeData.distance),
        });

        console.log("🗺️ Route fetched:", {
          distance: routeData.distance,
          duration: routeData.duration,
          instructions: routeData.instructions?.length || 0,
        });
      } catch (err) {
        console.error("❌ Failed to fetch route:", err);
        setError("Gagal mengambil rute navigasi");
      } finally {
        setIsLoadingRoute(false);
      }
    },
    [destination]
  );

  /**
   * Stop navigation and location tracking
   * ✅ Declared before handlePositionUpdate to avoid hoisting error
   */
  const stopNavigation = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (backendUpdateIntervalRef.current) {
      clearInterval(backendUpdateIntervalRef.current);
      backendUpdateIntervalRef.current = null;
    }

    setIsNavigating(false);
    console.log("🛑 Navigation stopped");
  }, []);

  /**
   * Handle position update from Geolocation API
   * ✅ GPS watchPosition updates every ~3 seconds (smooth tracking)
   * ✅ Backend updates sent separately via interval (every 5 seconds)
   */
  const handlePositionUpdate = useCallback(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // ✅ Throttled GPS log to prevent console spam
      throttledLog("📍 GPS Position updated:", {
        lat: latitude,
        lng: longitude,
        accuracy: `${Math.round(accuracy)}m`,
      });

      const newLocation = {
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: new Date().toISOString(),
      };

      setCurrentLocation(newLocation);
      lastLocationRef.current = newLocation;

      // Check if arrived at destination (within 10 meters)
      if (destination?.latitude && destination?.longitude) {
        const arrived = isWithinRadius(
          latitude,
          longitude,
          destination.latitude,
          destination.longitude,
          10 // 10 meter radius for arrival detection
        );

        if (arrived && !hasArrived) {
          console.log("🎯 Arrived at destination (within 10m)!");
          setHasArrived(true);

          // Auto-stop navigation after 3 seconds
          setTimeout(() => {
            console.log("🛑 Auto-stopping navigation (arrived at destination)");
            stopNavigation();
          }, 3000);
        }
      }

      // Fetch initial route on first position
      if (!route && !isLoadingRoute) {
        await fetchRoute(longitude, latitude);
      }
    },
    [
      destination,
      route,
      isLoadingRoute,
      hasArrived,
      fetchRoute,
      stopNavigation,
      throttledLog,
    ]
  );

  /**
   * Handle geolocation errors
   */
  const handlePositionError = useCallback((err) => {
    console.error("❌ Geolocation error:", err);

    switch (err.code) {
      case err.PERMISSION_DENIED:
        setError("Izin lokasi ditolak. Aktifkan GPS untuk navigasi.");
        break;
      case err.POSITION_UNAVAILABLE:
        setError("Lokasi tidak tersedia. Periksa koneksi GPS.");
        break;
      case err.TIMEOUT:
        setError("Waktu habis mencari lokasi. Coba lagi.");
        break;
      default:
        setError("Gagal mendapatkan lokasi.");
    }
  }, []);

  /**
   * Start navigation and location tracking
   * ✅ Dual Interval Pattern:
   *    - GPS watchPosition: Updates every ~3 seconds (smooth map)
   *    - Backend POST: Updates every 35 seconds (rate limit safe)
   */
  const startNavigation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung geolocation");
      return;
    }

    if (!destination?.latitude || !destination?.longitude) {
      setError("Koordinat tujuan tidak valid");
      return;
    }

    setIsNavigating(true);
    setError(null);
    setHasArrived(false);

    // ✅ Get initial position and send immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("📍 Initial position obtained:", { latitude, longitude });

        // Send initial location immediately
        sendLocationToBackend(latitude, longitude);

        // Store for interval updates
        lastLocationRef.current = {
          lat: latitude,
          lng: longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };
      },
      (err) => {
        console.warn("⚠️ Failed to get initial position:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    // ✅ Start GPS tracking with high accuracy (updates every ~3 seconds)
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true, // Use GPS for better accuracy
        maximumAge: 0, // Don't use cached position
        timeout: 10000, // 10 second timeout
      }
    );

    // ✅ Send location to backend every 5 seconds
    // No rate limiting, no distance check - always sends
    backendUpdateIntervalRef.current = setInterval(() => {
      if (lastLocationRef.current) {
        sendLocationToBackend(
          lastLocationRef.current.lat,
          lastLocationRef.current.lng
        );
      }
    }, 5000); // 5 seconds interval

    console.log("🚀 Navigation started");
    console.log("  → Initial location: sent immediately");
    console.log("  → GPS tracking: ~3 second updates (smooth map)");
    console.log(
      "  → Backend updates: every 5 seconds (regardless of movement)"
    );
  }, [
    destination,
    handlePositionUpdate,
    handlePositionError,
    sendLocationToBackend,
  ]);

  /**
   * Refresh route (e.g., after rerouting)
   */
  const refreshRoute = useCallback(() => {
    if (currentLocation) {
      fetchRoute(currentLocation.lng, currentLocation.lat);
    }
  }, [currentLocation, fetchRoute]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopNavigation();
    };
  }, [stopNavigation]);

  /**
   * Auto-stop tracking when page is hidden (battery saving)
   * ✅ Only pause backend updates, GPS tracking continues for map
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isNavigating) {
        console.log("📱 Page hidden - pausing backend updates (GPS continues)");
        if (backendUpdateIntervalRef.current) {
          clearInterval(backendUpdateIntervalRef.current);
          backendUpdateIntervalRef.current = null;
        }
      } else if (!document.hidden && isNavigating) {
        console.log("📱 Page visible - resuming backend updates");
        // Restart backend update interval
        backendUpdateIntervalRef.current = setInterval(() => {
          if (lastLocationRef.current) {
            sendLocationToBackend(
              lastLocationRef.current.lat,
              lastLocationRef.current.lng
            );
          }
        }, 5000); // 5 seconds
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isNavigating, sendLocationToBackend]);

  return {
    // State
    isNavigating,
    currentLocation,
    route,
    error,
    isLoadingRoute,
    hasArrived,

    // Actions
    startNavigation,
    stopNavigation,
    refreshRoute,
    setOrderId, // Expose setOrderId for parent component to set active order
  };
};

export default useCourierNavigation;
