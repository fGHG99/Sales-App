import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { MapPin, Navigation } from 'lucide-react';

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const CourierMap = ({ userLocation, courierRoute = [], onCourierLocationUpdate }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const courierMarker = useRef(null);
  const lastNotifiedPosRef = useRef(null);

  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map once (same principle as MapTilerForModal)
  useEffect(() => {
    if (map.current) return; // Don't re-initialize if already exists

    maptilersdk.config.apiKey = MAPTILER_API_KEY;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: [userLocation?.lng ?? 107.57828605427846, userLocation?.lat ?? -6.935577536865563],
      zoom: 13,
    });

    map.current.on('load', () => {
      setMapLoaded(true);

      // Create user marker
      if (userLocation) {
        userMarker.current = new maptilersdk.Marker({
          element: createUserMarkerElement(),
        })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map.current);
      }

      // Create courier marker (if route available)
      const firstPos = courierRoute[0];
      if (firstPos) {
        courierMarker.current = new maptilersdk.Marker({
          element: createCourierMarkerElement(),
        })
          .setLngLat([firstPos.lng, firstPos.lat])
          .addTo(map.current);
      }
    });

    map.current.on('error', (e) => {
      console.error('Map error:', e);
      setMapLoaded(false);
    });
  }, [userLocation, courierRoute.length]); // Only reinitialize if user location changes

  // Helper function to create user marker element
  const createUserMarkerElement = () => {
    const userEl = document.createElement('div');
    userEl.style.cssText = `
      width: 40px; height: 40px; border-radius: 50%;
      background-color: #10B981; display: flex; align-items: center;
      justify-content: center; border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15); cursor: pointer;
    `;
    userEl.innerHTML = `
      <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    `;
    return userEl;
  };

  // Helper function to create courier marker element
  const createCourierMarkerElement = () => {
    const courierEl = document.createElement('div');
    courierEl.style.cssText = `
      width: 40px; height: 40px; border-radius: 50%;
      background-color: #3B82F6; display: flex; align-items: center;
      justify-content: center; border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15); cursor: pointer;
    `;
    courierEl.innerHTML = `
      <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
        <path d="M5 18H3c-.6 0-1-.4-1-1V4c0-.6.4-1 1-1h8c.6 0 1 .4 1 1v2h5l4 4v7c0 .6-.4 1-1 1h-2"></path>
        <circle cx="7" cy="18" r="2"></circle>
        <path d="m21 8-2-2h-5v4h7z"></path>
        <circle cx="17" cy="18" r="2"></circle>
      </svg>
    `;
    return courierEl;
  };

  // Interval: advance route index (keeping original functionality)
  useEffect(() => {
    const len = courierRoute?.length ?? 0;
    if (!mapLoaded || len === 0) return;

    const interval = setInterval(() => {
      setCurrentRouteIndex(prev => (prev + 1) % len);
    }, 3000);

    return () => clearInterval(interval);
  }, [mapLoaded, courierRoute.length]);

  // Update courier marker position when route index changes
  useEffect(() => {
    if (!mapLoaded || !courierMarker.current) return;
    const len = courierRoute?.length ?? 0;
    if (len === 0) return;

    const pos = courierRoute[currentRouteIndex];
    if (!pos) return;

    try {
      // Update courier marker position
      courierMarker.current.setLngLat([pos.lng, pos.lat]);

      // Notify parent only if position changed (avoid ping-pong)
      const last = lastNotifiedPosRef.current;
      const changed = !last || last.lat !== pos.lat || last.lng !== pos.lng;

      if (changed) {
        lastNotifiedPosRef.current = { lat: pos.lat, lng: pos.lng };
        if (typeof onCourierLocationUpdate === 'function') {
          try {
            onCourierLocationUpdate(pos);
          } catch (e) {
            console.error('onCourierLocationUpdate error:', e);
          }
        }
      }
    } catch (e) {
      console.error('Error updating courier marker:', e);
    }
  }, [currentRouteIndex, mapLoaded, courierRoute, onCourierLocationUpdate]);

  // Follow user location (camera) - keeping original functionality
  useEffect(() => {
    if (!map.current || !userLocation || !mapLoaded) return;
    
    try {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 13,
        essential: true,
      });

      // Update user marker if it exists
      if (userMarker.current) {
        userMarker.current.setLngLat([userLocation.lng, userLocation.lat]);
      }
    } catch (e) {
      console.error('Error flying to user location:', e);
    }
  }, [userLocation, mapLoaded]);

  // Reset index if route changes - keeping original functionality
  useEffect(() => {
    if ((courierRoute?.length ?? 0) === 0) {
      setCurrentRouteIndex(0);
      lastNotifiedPosRef.current = null;
    } else if (currentRouteIndex >= courierRoute.length) {
      setCurrentRouteIndex(0);
    }
  }, [courierRoute.length, currentRouteIndex]);

  // Add courier marker when route becomes available
  useEffect(() => {
    if (!map.current || !mapLoaded || courierMarker.current) return;
    
    const firstPos = courierRoute[0];
    if (firstPos) {
      courierMarker.current = new maptilersdk.Marker({
        element: createCourierMarkerElement(),
      })
        .setLngLat([firstPos.lng, firstPos.lat])
        .addTo(map.current);
    }
  }, [courierRoute, mapLoaded]);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden">
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: '400px', backgroundColor: '#f8f9fa' }}
      />

      {/* Loading overlay - same as MapTilerForModal */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-600 text-sm">Loading MapTiler map...</p>
        </div>
      )}

      {/* Fallback preview - keeping original design but simplified */}
      {!mapLoaded && (
        <div className="absolute inset-4 bg-blue-50 border-2 border-blue-200 rounded-lg flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-8">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-600 mt-1">You</span>
              </div>
              <div className="w-16 h-px bg-blue-300 relative">
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Navigation className="w-5 h-5" />
                </div>
                <span className="text-xs text-gray-600 mt-1">Courier</span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Live tracking: {courierRoute.length} waypoints</p>
              <p className="text-xs text-gray-500">ETA: 15 minutes</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierMap;