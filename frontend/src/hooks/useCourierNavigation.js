import { useState, useEffect, useCallback, useRef } from "react";
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
  const backendUpdateIntervalRef = useRef(null); // ✅ For 35-second backend updates
  const lastLocationRef = useRef(null);

  /**
   * Send location to backend (Redis) - called every 35 seconds
   * Rate limit safe: Backend allows 1 update per 30 seconds
   */
  const sendLocationToBackend = useCallback(async (latitude, longitude) => {
    try {
      await api.post("/courier/location", {
        latitude,
        longitude,
      });
      console.log("📍 Location sent to Redis:", { latitude, longitude });
    } catch (err) {
      // Silently fail if rate limited (shouldn't happen with 35s interval)
      if (err.response?.status !== 429) {
        console.error("❌ Failed to send location:", err);
      } else {
        console.warn("⚠️ Rate limit hit (unexpected with 35s interval)");
      }
    }
  }, []);

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
   * ✅ Backend updates sent separately via interval (every 35 seconds)
   */
  const handlePositionUpdate = useCallback(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      console.log("📍 GPS Position updated:", {
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
    [destination, route, isLoadingRoute, hasArrived, fetchRoute, stopNavigation]
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

    // ✅ Send location to backend every 35 seconds (rate limit safe)
    // Backend rate limit: 1 update per 30 seconds
    // 35 seconds = safe margin to avoid 429 errors
    backendUpdateIntervalRef.current = setInterval(() => {
      if (lastLocationRef.current) {
        sendLocationToBackend(
          lastLocationRef.current.lat,
          lastLocationRef.current.lng
        );
      }
    }, 35000); // 35 seconds interval

    console.log("🚀 Navigation started");
    console.log("  → GPS tracking: ~3 second updates (smooth map)");
    console.log("  → Backend updates: 35 second interval (rate limit safe)");
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
        }, 35000); // 35 seconds
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
  };
};

export default useCourierNavigation;
