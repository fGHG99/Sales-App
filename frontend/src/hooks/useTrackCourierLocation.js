import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

/**
 * Custom hook for customer to track courier's real-time location
 * Connects via WebSocket and receives location updates
 *
 * @param {string} orderId - Order ID to track
 * @param {string} userId - Customer user ID
 * @returns {object} - { courierLocation, isConnected, lastUpdate, error }
 */
const useTrackCourierLocation = (orderId, userId) => {
  const [courierLocation, setCourierLocation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!orderId || !userId) return;

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
      console.log("✅ Socket connected for tracking");
      setIsConnected(true);
      setError(null);

      // Join user room to receive notifications
      socket.emit("join", { userId });

      // Request current courier location
      socket.emit("request-courier-location", { orderId, userId });
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      setIsConnected(false);
    });

    // Listen for courier location updates
    socket.on("courier-location-update", (data) => {
      if (data.orderId === orderId) {
        console.log("📍 Courier location updated:", data.courierLocation);
        setCourierLocation(data.courierLocation);
        setLastUpdate(new Date(data.timestamp));
        setError(null);
      }
    });

    // Handle case when location not available
    socket.on("courier-location-unavailable", (data) => {
      if (data.orderId === orderId) {
        console.warn("⚠️ Courier location not available");
        setError("Courier location not available");
      }
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
    };
  }, [orderId, userId]);

  // Manually request location update
  const refreshLocation = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("request-courier-location", { orderId, userId });
    }
  };

  return {
    courierLocation,
    isConnected,
    lastUpdate,
    error,
    refreshLocation,
  };
};

export default useTrackCourierLocation;
