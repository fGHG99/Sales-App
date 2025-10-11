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
 * - Update lokasi setiap 3 detik ke Redis
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
  const updateIntervalRef = useRef(null);
  const lastLocationRef = useRef(null);

  /**
   * Send location to backend (Redis) every 3 seconds
   */
  const sendLocationToBackend = useCallback(async (latitude, longitude) => {
    try {
      await api.post("/courier/location", {
        latitude,
        longitude,
      });
      console.log("📍 Location sent to Redis:", { latitude, longitude });
    } catch (err) {
      // Silently fail if rate limited (expected behavior)
      if (err.response?.status !== 429) {
        console.error("❌ Failed to send location:", err);
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

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    setIsNavigating(false);
    console.log("🛑 Navigation stopped");
  }, []);

  /**
   * Handle position update from Geolocation API
   */
  const handlePositionUpdate = useCallback(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      console.log("📍 Position updated:", {
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

      // Check if arrived at destination (within 10 meters) ✅ Changed from 50m to 10m
      if (destination?.latitude && destination?.longitude) {
        const arrived = isWithinRadius(
          latitude,
          longitude,
          destination.latitude,
          destination.longitude,
          10 // ✅ 10 meter radius for arrival detection
        );

        if (arrived && !hasArrived) {
          console.log("🎯 Arrived at destination (within 10m)!");
          setHasArrived(true);

          // ✅ Auto-stop navigation after 3 seconds (give time for callback)
          setTimeout(() => {
            console.log("🛑 Auto-stopping navigation (arrived at destination)");
            stopNavigation();
          }, 3000); // 3 second delay
        }
      }

      // Fetch initial route on first position
      if (!route && !isLoadingRoute) {
        await fetchRoute(longitude, latitude);
      }
    },
    [destination, route, isLoadingRoute, hasArrived, fetchRoute, stopNavigation] // ✅ stopNavigation now defined above
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

    // Start watching position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true, // Use GPS for better accuracy
        maximumAge: 0, // Don't use cached position
        timeout: 10000, // 10 second timeout
      }
    );

    // Send location to backend every 3 seconds
    updateIntervalRef.current = setInterval(() => {
      if (lastLocationRef.current) {
        sendLocationToBackend(
          lastLocationRef.current.lat,
          lastLocationRef.current.lng
        );
      }
    }, 3000); // ✅ 3 seconds interval

    console.log("🚀 Navigation started");
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
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isNavigating) {
        console.log("📱 Page hidden - pausing location updates");
        if (updateIntervalRef.current) {
          clearInterval(updateIntervalRef.current);
        }
      } else if (!document.hidden && isNavigating) {
        console.log("📱 Page visible - resuming location updates");
        updateIntervalRef.current = setInterval(() => {
          if (lastLocationRef.current) {
            sendLocationToBackend(
              lastLocationRef.current.lat,
              lastLocationRef.current.lng
            );
          }
        }, 3000);
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
