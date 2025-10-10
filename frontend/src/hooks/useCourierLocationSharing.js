import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

/**
 * Custom hook for courier to share real-time location via WebSocket
 * Implements smart throttling to reduce unnecessary updates
 *
 * @param {string} orderId - Current order being delivered
 * @param {boolean} isActive - Whether to actively share location
 * @returns {object} - { isConnected, lastUpdate, error }
 */
const useCourierLocationSharing = (orderId, isActive = false) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const lastLocationRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!isActive || !orderId) return;

    // Connect to Socket.IO server
    const socket = io(
      import.meta.env.VITE_BE_API_URL || "http://localhost:3000",
      {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected for location sharing");
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setIsConnected(false);
    });

    socket.on("error", (err) => {
      console.error("❌ Socket error:", err);
      setError(err.message || "Connection error");
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isActive, orderId]);

  useEffect(() => {
    if (!isActive || !orderId || !isConnected) return;

    // Get user ID from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      setError("User not found in localStorage");
      return;
    }

    const user = JSON.parse(userStr);
    const courierId = user.id;

    /**
     * Smart location sharing with throttling
     * Only sends update if moved >50 meters from last position
     */
    const shareLocation = (position) => {
      const { latitude, longitude } = position.coords;

      // Calculate distance from last location
      if (lastLocationRef.current) {
        const distance = calculateDistance(
          lastLocationRef.current.lat,
          lastLocationRef.current.lng,
          latitude,
          longitude
        );

        // Skip if moved less than 50 meters (0.05 km)
        if (distance < 0.05) {
          console.log("⏭️ Not moved significantly, skipping update");
          return;
        }

        console.log(
          `📍 Moved ${(distance * 1000).toFixed(0)}m, sending update`
        );
      }

      // Send location via WebSocket
      if (socketRef.current?.connected) {
        socketRef.current.emit("courier-share-location", {
          courierId,
          orderId,
          latitude,
          longitude,
        });

        // Update state
        lastLocationRef.current = { lat: latitude, lng: longitude };
        setLastUpdate(new Date());
        setError(null);

        console.log(`📡 Location sent: ${latitude}, ${longitude}`);
      } else {
        setError("Socket not connected");
      }
    };

    const handleLocationError = (err) => {
      console.error("❌ Geolocation error:", err);
      setError(`Location error: ${err.message}`);
    };

    // Watch position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      shareLocation,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Cleanup
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isActive, orderId, isConnected]);

  return {
    isConnected,
    lastUpdate,
    error,
  };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value) => (value * Math.PI) / 180;

export default useCourierLocationSharing;
