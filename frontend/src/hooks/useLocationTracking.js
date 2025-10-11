import { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";

/**
 * Custom hook for web-based courier location tracking
 *
 * Features:
 * - Browser Geolocation API dengan watchPosition
 * - Geofencing: Only update if moved > 50 meters
 * - Active order check: Auto start/stop based on deliveries
 * - Rate limiting aware: Respects 30-second backend limit
 * - Memory efficient: No unnecessary API calls
 *
 * Usage:
 * const { isTracking, lastLocation, error, startTracking, stopTracking } = useLocationTracking();
 */
const useLocationTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState(null);
  const [error, setError] = useState(null);
  const [hasActiveOrders, setHasActiveOrders] = useState(false);

  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(null);
  const pendingUpdateRef = useRef(null);

  // Check if courier has active orders
  const checkActiveOrders = useCallback(async () => {
    try {
      const res = await api.get("/orders/courier/active");
      const activeCount = res.data.activeCount || 0;
      setHasActiveOrders(activeCount > 0);
      return activeCount > 0;
    } catch (err) {
      console.error("Failed to check active orders:", err);
      return false;
    }
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Send location to backend with optimizations
  const updateLocation = useCallback(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const now = Date.now();

      // ✅ Rate limiting: Don't send more than once per 30 seconds
      if (lastUpdateRef.current && now - lastUpdateRef.current < 30000) {
        console.log("📍 Rate limit: Skipping update (< 30s since last)");
        return;
      }

      // ✅ Geofencing: Check if moved > 50 meters from last location
      if (lastLocation) {
        const distance = calculateDistance(
          lastLocation.lat,
          lastLocation.lng,
          latitude,
          longitude
        );

        if (distance < 50) {
          console.log(
            `📍 Geofencing: Location unchanged (${Math.floor(
              distance
            )}m), skip update`
          );
          return;
        }
      }

      // ✅ Active order check: Only send if has deliveries
      const hasActive = await checkActiveOrders();
      if (!hasActive) {
        console.log("📍 No active orders, skip location update");
        setIsTracking(false);
        return;
      }

      try {
        // Clear any pending update
        if (pendingUpdateRef.current) {
          clearTimeout(pendingUpdateRef.current);
        }

        const res = await api.post("/courier/location", {
          latitude,
          longitude,
        });

        if (res.data.success) {
          setLastLocation({ lat: latitude, lng: longitude });
          lastUpdateRef.current = now;
          setError(null);

          console.log("✅ Location updated:", {
            latitude,
            longitude,
            stored: res.data.stored,
            activeOrders: res.data.location?.activeOrders || 0,
          });
        }
      } catch (err) {
        console.error("❌ Failed to update location:", err);

        // Handle rate limit error gracefully
        if (err.response?.status === 429) {
          setError("Update terlalu cepat. Tunggu 30 detik.");
        } else {
          setError("Gagal update lokasi. Coba lagi nanti.");
        }
      }
    },
    [lastLocation, calculateDistance, checkActiveOrders]
  );

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung browser Anda");
      return;
    }

    if (watchIdRef.current !== null) {
      console.log("⚠️ Tracking already started");
      return;
    }

    setIsTracking(true);
    setError(null);

    console.log("🚀 Starting location tracking...");

    // ✅ Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("📍 Initial position obtained");
        updateLocation(position);
      },
      (err) => {
        console.error("Geolocation error:", err);

        let errorMessage = "Gagal mendapatkan lokasi.";

        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage =
              "Izin lokasi ditolak. Aktifkan di pengaturan browser.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Lokasi tidak tersedia. Pastikan GPS aktif.";
            break;
          case err.TIMEOUT:
            errorMessage = "Timeout mendapatkan lokasi. Coba lagi.";
            break;
          default:
            errorMessage = "Error mendapatkan lokasi: " + err.message;
        }

        setError(errorMessage);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // ✅ Watch position changes (browser automatically handles update frequency)
    const id = navigator.geolocation.watchPosition(
      (position) => {
        updateLocation(position);
      },
      (err) => {
        console.error("Watch position error:", err);
        setError("Gagal melacak lokasi secara real-time");
      },
      {
        enableHighAccuracy: true, // Use GPS (not WiFi/cell tower)
        timeout: 10000, // 10 seconds timeout per update
        maximumAge: 0, // Don't use cached position
      }
    );

    watchIdRef.current = id;
    console.log("✅ Location tracking started (watchPosition ID:", id, ")");
  }, [updateLocation]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log("🛑 Location tracking stopped");
    }

    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
      pendingUpdateRef.current = null;
    }

    setIsTracking(false);
  }, []);

  // ✅ Auto-start tracking when courier has active orders
  useEffect(() => {
    const checkAndManageTracking = async () => {
      const hasActive = await checkActiveOrders();

      if (hasActive && !isTracking && watchIdRef.current === null) {
        console.log("✅ Active orders detected, auto-starting tracking");
        startTracking();
      } else if (!hasActive && isTracking) {
        console.log("⚠️ No active orders, stopping tracking");
        stopTracking();
      }
    };

    // Check every 60 seconds
    const interval = setInterval(checkAndManageTracking, 60000);
    checkAndManageTracking(); // Initial check

    return () => clearInterval(interval);
  }, [isTracking, startTracking, stopTracking, checkActiveOrders]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
    };
  }, []);

  // ✅ Page Visibility API - Stop tracking when tab hidden (save battery)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("📱 Tab hidden, pausing tracking");
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      } else {
        console.log("📱 Tab visible, resuming tracking");
        if (isTracking && watchIdRef.current === null && hasActiveOrders) {
          startTracking();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isTracking, hasActiveOrders, startTracking]);

  return {
    isTracking,
    lastLocation,
    error,
    hasActiveOrders,
    startTracking,
    stopTracking,
  };
};

export default useLocationTracking;
