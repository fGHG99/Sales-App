import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Navigation,
  MapPin,
  Clock,
  Ruler,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import useCourierNavigation from "../../../hooks/useCourierNavigation";

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

/**
 * Courier Navigation Map Component
 * Real-time navigation dengan OpenRouteService + MapTiler
 *
 * Features:
 * - Turn-by-turn directions
 * - ETA calculation
 * - Route polyline rendering
 * - Auto-update lokasi setiap 3 detik
 * - Arrival detection
 *
 * @param {Object} destination - { latitude, longitude, address, recipientName }
 * @param {Function} onArrived - Callback when courier arrives
 */
const CourierNavigationMap = ({ destination, onArrived }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(false);
  const currentMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);

  const {
    isNavigating,
    currentLocation,
    route,
    error,
    isLoadingRoute,
    hasArrived,
    startNavigation,
    stopNavigation,
    refreshRoute,
  } = useCourierNavigation(destination);

  /**
   * Initialize map
   */
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`,
      center: [
        destination?.longitude || 106.8456,
        destination?.latitude || -6.2088,
      ],
      zoom: 13,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      "top-right"
    );

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [destination]);

  /**
   * Add destination marker
   */
  useEffect(() => {
    if (!mapRef.current || !destination?.latitude || !destination?.longitude)
      return;

    // Remove old marker
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
    }

    // Create custom destination marker (red)
    const el = document.createElement("div");
    el.className = "destination-marker";
    el.style.width = "32px";
    el.style.height = "32px";
    el.style.backgroundImage = "url(/marker-destination.png)";
    el.style.backgroundSize = "cover";
    el.innerHTML = `
      <div style="
        width: 32px;
        height: 32px;
        background: #EF4444;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          margin: 8px;
          transform: rotate(45deg);
        "></div>
      </div>
    `;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([destination.longitude, destination.latitude])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(
          `<strong>${destination.recipientName || "Tujuan"}</strong><br>${
            destination.address || destination.fullAddress || ""
          }`
        )
      )
      .addTo(mapRef.current);

    destinationMarkerRef.current = marker;
  }, [destination]);

  /**
   * Update current location marker
   */
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    // Remove old marker
    if (currentMarkerRef.current) {
      currentMarkerRef.current.remove();
    }

    // Create custom current location marker (blue)
    const el = document.createElement("div");
    el.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background: #3B82F6;
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        animation: pulse 2s infinite;
      "></div>
    `;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([currentLocation.lng, currentLocation.lat])
      .addTo(mapRef.current);

    currentMarkerRef.current = marker;

    // Center map on current location
    mapRef.current.easeTo({
      center: [currentLocation.lng, currentLocation.lat],
      duration: 1000,
    });
  }, [currentLocation]);

  /**
   * Render route polyline on map
   */
  useEffect(() => {
    if (!mapRef.current || !route?.coordinates) return;

    const map = mapRef.current;

    // Wait for map to load
    if (!map.loaded()) {
      map.once("load", () => addRouteLayer());
    } else {
      addRouteLayer();
    }

    function addRouteLayer() {
      // Remove existing route layer
      if (routeLayerRef.current) {
        if (map.getLayer("route")) map.removeLayer("route");
        if (map.getSource("route")) map.removeSource("route");
      }

      // Add route source
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: route.coordinates,
          },
        },
      });

      // Add route layer
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3B82F6",
          "line-width": 5,
          "line-opacity": 0.8,
        },
      });

      routeLayerRef.current = true;

      // Fit map to show entire route
      const coordinates = route.coordinates;
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
      );

      map.fitBounds(bounds, {
        padding: 50,
        duration: 1000,
      });
    }
  }, [route]);

  /**
   * Handle arrival
   */
  useEffect(() => {
    if (hasArrived && onArrived) {
      onArrived();
    }
  }, [hasArrived, onArrived]);

  return (
    <div className="space-y-4">
      {/* Navigation Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Navigation className="w-5 h-5 mr-2 text-blue-600" />
            Navigasi Kurir
            {isNavigating && (
              <Badge className="ml-auto bg-green-100 text-green-800">
                Aktif
              </Badge>
            )}
            {hasArrived && (
              <Badge className="ml-auto bg-blue-100 text-blue-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Tiba di Tujuan
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Destination Info */}
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {destination?.recipientName || "Tujuan Pengiriman"}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {destination?.address || destination?.fullAddress || ""}
              </p>
            </div>
          </div>

          {/* Route Info */}
          {route && !isLoadingRoute && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <Ruler className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Jarak</p>
                  <p className="font-semibold text-sm">{route.distanceText}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                <Clock className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">ETA</p>
                  <p className="font-semibold text-sm">{route.eta}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoadingRoute && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-sm text-blue-700">Memuat rute navigasi...</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isNavigating ? (
              <Button
                onClick={startNavigation}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={
                  !destination?.latitude || !destination?.longitude || error
                }
              >
                <Navigation className="w-4 h-4 mr-2" />
                Mulai Navigasi
              </Button>
            ) : (
              <>
                <Button
                  onClick={refreshRoute}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoadingRoute}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      isLoadingRoute ? "animate-spin" : ""
                    }`}
                  />
                  Perbarui Rute
                </Button>
                <Button
                  onClick={stopNavigation}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Hentikan
                </Button>
              </>
            )}
          </div>

          {/* Current Location Info */}
          {currentLocation && (
            <div className="text-xs text-gray-500 text-center">
              Akurasi GPS: ~{Math.round(currentLocation.accuracy)}m
              <br />
              Lokasi diperbarui setiap 3 detik
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[500px] rounded-lg shadow-lg"
        style={{ minHeight: "400px" }}
      />

      {/* Add pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};

export default CourierNavigationMap;
