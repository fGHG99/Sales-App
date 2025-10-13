import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import api from "../utils/api";

/**
 * Custom hook for customer to track courier's real-time location
 * Connects via WebSocket and receives location updates
 * Falls back to HTTP polling if socket fails
 *
 * @param {string} orderId - Order ID to track
 * @param {string} userId - Customer user ID
 * @param {string} courierId - Courier ID for fallback HTTP request
 * @returns {object} - { courierLocation, isConnected, lastUpdate, error }
 */
const useTrackCourierLocation = (orderId, userId, courierId) => {
  // ✅ All hooks MUST be called unconditionally at the top level
  const [courierLocation, setCourierLocation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [useHttpFallback, setUseHttpFallback] = useState(false);

  const socketRef = useRef(null);
  const httpFallbackIntervalRef = useRef(null);
  const socketErrorCountRef = useRef(0);
  const socketRequestIntervalRef = useRef(null);

  /**
   * HTTP Fallback: Fetch location from REST API
   */
  const fetchLocationViaHttp = useCallback(async () => {
    if (!courierId) {
      console.warn(
        "⚠️ [USER TRACKING] No courierId provided for HTTP fallback"
      );
      return;
    }

    try {
      const response = await api.get(`/courier/location/${courierId}`);

      if (response.data.success && response.data.location) {
        const { latitude, longitude, timestamp } = response.data.location;

        setCourierLocation({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        });
        setLastUpdate(new Date(timestamp));
        setError(null);
      } else {
        // Set soft error for first fetch
        setError("Menunggu lokasi kurir...");
      }
    } catch (err) {
      // Set soft error on failure
      setError("Menunggu lokasi kurir...");
    }
  }, [courierId]); // ✅ Only courierId - remove state dependencies!

  /**
   * Activate HTTP fallback polling with rate limiting
   * ✅ Changed to 5s to match courier update interval
   * ✅ Memory-safe with proper cleanup
   */
  const activateHttpFallback = useCallback(() => {
    if (httpFallbackIntervalRef.current) return; // Already active

    console.log(
      "🔄 Activating HTTP fallback (polling every 5 seconds - rate limited)"
    );
    setUseHttpFallback(true);
    setError(null); // Clear any socket errors

    // Initial fetch
    fetchLocationViaHttp();

    // Poll every 5 seconds (aligned with courier update rate)
    httpFallbackIntervalRef.current = setInterval(() => {
      fetchLocationViaHttp();
    }, 5000);
  }, [fetchLocationViaHttp]);

  useEffect(() => {
    // ✅ Early guard: Don't connect if missing required params
    if (!orderId || !userId) {
      console.warn(
        "⚠️ [USER TRACKING] Missing orderId or userId, skipping WebSocket connection"
      );
      return;
    }

    // ✅ DON'T do initial HTTP fetch!
    // Let WebSocket connect first, only use HTTP as last resort fallback

    // Connect to Socket.IO server
    // ✅ WebSocket-first strategy with polling fallback
    const socket = io(
      import.meta.env.VITE_BE_API_URL || "http://localhost:3000",
      {
        transports: ["websocket", "polling"], // Try WebSocket first
        upgrade: true, // Allow upgrade from polling to WebSocket
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000, // Connection timeout
        forceNew: false,
        autoConnect: true,
      }
    );

    socketRef.current = socket;

    // ✅ Inline HTTP fallback activation (avoid callback dependency)
    const activateHttpFallbackInline = () => {
      if (httpFallbackIntervalRef.current) return; // Already active

      console.log(
        "🔄 Activating HTTP fallback (polling every 5 seconds - rate limited)"
      );
      setUseHttpFallback(true);
      setError(null);

      // Initial fetch
      fetchLocationViaHttp();

      // Poll every 5 seconds
      httpFallbackIntervalRef.current = setInterval(() => {
        fetchLocationViaHttp();
      }, 5000);
    };

    // ✅ Handle connection errors gracefully (fallback to HTTP polling)
    socket.on("connect_error", (error) => {
      console.warn("⚠️ Socket.IO connection error:", error.message);
      console.warn(`   Attempt ${socketErrorCountRef.current + 1}/5`);

      // ✅ Only activate HTTP fallback after ALL reconnection attempts exhausted
      socketErrorCountRef.current += 1;

      // Wait for 5 attempts before giving up on WebSocket
      if (socketErrorCountRef.current >= 5 && courierId) {
        console.log(
          "🔄 All reconnection attempts failed, switching to HTTP polling fallback"
        );
        activateHttpFallbackInline();
      }
    });

    socket.on("connect", () => {
      console.log("✅ Socket.IO connected successfully");
      console.log(`   Transport: ${socket.io.engine.transport.name}`);

      setIsConnected(true);
      setError(null);
      socketErrorCountRef.current = 0;

      // ✅ If HTTP fallback was active, DISABLE it now that WebSocket is working!
      if (httpFallbackIntervalRef.current) {
        console.log(
          "🎯 WebSocket reconnected! Disabling HTTP polling fallback"
        );
        clearInterval(httpFallbackIntervalRef.current);
        httpFallbackIntervalRef.current = null;
        setUseHttpFallback(false);
      }

      // Join user room to receive notifications
      socket.emit("join", { userId });

      // ✅ Initial request for courier location
      socket.emit("request-courier-location", { orderId, userId });

      // ✅ Setup periodic WebSocket requests (every 5 seconds)
      // This ensures we get updates even if courier hasn't started navigation yet
      if (socketRequestIntervalRef.current) {
        clearInterval(socketRequestIntervalRef.current);
      }

      socketRequestIntervalRef.current = setInterval(() => {
        if (socketRef.current?.connected) {
          console.log("📡 Requesting courier location via WebSocket...");
          socket.emit("request-courier-location", { orderId, userId });
        }
      }, 5000); // Request every 5 seconds via WebSocket

      console.log("🔄 WebSocket periodic request activated (every 5s)");
    });

    // ✅ Log when transport upgrades (polling → websocket)
    socket.io.engine.on("upgrade", (transport) => {
      console.log(`🚀 Transport upgraded to: ${transport.name}`);
    });

    socket.on("disconnect", () => {
      console.log("🔌 WebSocket disconnected");
      setIsConnected(false);

      // ✅ Clear WebSocket periodic request interval on disconnect
      if (socketRequestIntervalRef.current) {
        clearInterval(socketRequestIntervalRef.current);
        socketRequestIntervalRef.current = null;
        console.log("⏹️ WebSocket periodic request stopped");
      }
    });

    // Listen for courier location updates
    socket.on("courier-location-update", (data) => {
      if (data.orderId === orderId) {
        console.log(
          "📍 [USER TRACKING] Location update received via WebSocket"
        );
        console.log(`   Latitude: ${data.courierLocation.latitude}`);
        console.log(`   Longitude: ${data.courierLocation.longitude}`);

        // ✅ NO THROTTLING! Requests already throttled (periodic 5s)
        // Let all updates through - React batches state updates automatically
        setCourierLocation(data.courierLocation);
        setLastUpdate(new Date(data.timestamp));
        setError(null);
      }
    });

    // Handle case when location not available
    socket.on("courier-location-unavailable", (data) => {
      if (data.orderId === orderId) {
        // ✅ DON'T activate HTTP fallback immediately!
        // Location not available ≠ WebSocket failed
        // Just wait for next socket update
        console.log(
          "⚠️ Courier location not available in this update, waiting for next..."
        );

        // Only set soft error if no location data at all
        if (!courierLocation) {
          setError("Menunggu lokasi kurir...");
        }
      }
    });

    socket.on("error", (err) => {
      // ✅ Backend emits "error" for business logic issues (no courier, data issues)
      // These are NOT connection errors, so don't increment error count or trigger fallback
      console.warn(
        "⚠️ Socket event error (business logic):",
        err.message || err
      );

      // Just log the error, don't activate HTTP fallback
      // Connection errors are handled by "connect_error" event
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (httpFallbackIntervalRef.current) {
        clearInterval(httpFallbackIntervalRef.current);
        httpFallbackIntervalRef.current = null;
      }
      // ✅ Clear WebSocket periodic request interval
      if (socketRequestIntervalRef.current) {
        clearInterval(socketRequestIntervalRef.current);
        socketRequestIntervalRef.current = null;
      }
    };
  }, [orderId, userId, courierId]); // ✅ Only primitive values - callbacks are stable now

  // Manually request location update
  const refreshLocation = () => {
    if (useHttpFallback) {
      fetchLocationViaHttp();
    } else if (socketRef.current?.connected) {
      socketRef.current.emit("request-courier-location", { orderId, userId });
    }
  };

  return {
    courierLocation,
    isConnected: useHttpFallback ? true : isConnected, // Show as connected if using HTTP fallback
    lastUpdate,
    error,
    refreshLocation,
    useHttpFallback, // Expose fallback status
  };
};

export default useTrackCourierLocation;
