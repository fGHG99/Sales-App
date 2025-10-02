import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

const CourierMap = ({ userLocation, courierRoute = [], onCourierLocationUpdate }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const courierMarkerRef = useRef(null);
  const lastNotifiedPosRef = useRef(null);

  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);

  // --- initialize map (only once) ---
  useEffect(() => {
    let mounted = true;
    let removeMap = null;

    (async () => {
      try {
        const maptilerSDK = await import('@maptiler/sdk');
        await import('@maptiler/sdk/dist/maptiler-sdk.css');
        maptilerSDK.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

        if (!mapContainer.current) return;

        mapRef.current = new maptilerSDK.Map({
          container: mapContainer.current,
          style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerSDK.config.apiKey}`,
          center: [userLocation?.lng ?? 0, userLocation?.lat ?? 0],
          zoom: 13,
        });

        const onLoad = () => {
          if (!mounted) return;
          setMapLoaded(true);

          // user marker
          const userEl = document.createElement('div');
          userEl.style.cssText = `
            width: 40px; height: 40px; border-radius: 50%;
            background-color: #3B82F6; display: flex; align-items: center;
            justify-content: center; border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.15); cursor: pointer;
          `;
          userEl.innerHTML =
            '<svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';

          new maptilerSDK.Marker({ element: userEl })
            .setLngLat([userLocation?.lng ?? 0, userLocation?.lat ?? 0])
            .addTo(mapRef.current);

          // courier marker (only if coordinate available)
          const firstPos = courierRoute[0];
          if (firstPos) {
            const courierEl = document.createElement('div');
            courierEl.style.cssText = `
              width: 40px; height: 40px; border-radius: 50%;
              background-color: #3B82F6; display: flex; align-items: center;
              justify-content: center; border: 3px solid white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.15); cursor: pointer;
            `;
            courierEl.innerHTML =
              '<svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M5 18H3c-.6 0-1-.4-1-1V4c0-.6.4-1 1-1h8c.6 0 1 .4 1 1v2h5l4 4v7c0 .6-.4 1-1 1h-2"></path><circle cx="7" cy="18" r="2"></circle><path d="m21 8-2-2h-5v4h7z"></path><circle cx="17" cy="18" r="2"></circle></svg>';

            courierMarkerRef.current = new maptilerSDK.Marker({ element: courierEl })
              .setLngLat([firstPos.lng, firstPos.lat])
              .addTo(mapRef.current);
          }
        };

        const onError = (e) => {
          if (!mounted) return;
          console.error('❌ Map error:', e);
          setMapLoaded(false);
        };

        mapRef.current.on('load', onLoad);
        mapRef.current.on('error', onError);

        removeMap = () => {
          try {
            mapRef.current?.off('load', onLoad);
            mapRef.current?.off('error', onError);
            mapRef.current?.remove?.();
          } catch (_) {}
          mapRef.current = null;
        };
      } catch (error) {
        if (mounted) {
          console.error('❌ Failed to initialize map:', error);
          setMapLoaded(false);
        }
      }
    })();

    return () => {
      mounted = false;
      removeMap?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once

  // --- interval: advance index (depend only on stable values) ---
  useEffect(() => {
    const len = courierRoute?.length ?? 0;
    if (!mapLoaded || len === 0) return;

    const interval = setInterval(() => {
      setCurrentRouteIndex(prev => (prev + 1) % len);
    }, 3000);

    return () => clearInterval(interval);
  }, [mapLoaded, courierRoute.length]); // use length to avoid re-run when parent recreates array ref

  // --- when route index changes: update marker + notify parent (guarded) ---
  useEffect(() => {
    if (!mapLoaded) return;
    const len = courierRoute?.length ?? 0;
    if (len === 0) return;

    const pos = courierRoute[currentRouteIndex];
    if (!pos) return;

    // update marker position
    if (courierMarkerRef.current?.setLngLat) {
      try {
        courierMarkerRef.current.setLngLat([pos.lng, pos.lat]);
      } catch (e) {
        // ignore marker update errors
      }
    }

    // notify parent only if position changed (avoid ping-pong)
    const last = lastNotifiedPosRef.current;
    const changed =
      !last ||
      last.lat !== pos.lat ||
      last.lng !== pos.lng;

    if (changed) {
      lastNotifiedPosRef.current = { lat: pos.lat, lng: pos.lng };
      if (typeof onCourierLocationUpdate === 'function') {
        try {
          onCourierLocationUpdate(pos);
        } catch (e) {
          // prevent parent errors from breaking map component
          console.error('onCourierLocationUpdate error:', e);
        }
      }
    }
  }, [currentRouteIndex, mapLoaded, courierRoute.length, onCourierLocationUpdate]);

  // --- follow user location (camera) ---
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    try {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        essential: true,
        zoom: 13,
      });
    } catch (e) {
      // ignore flyTo errors
    }
  }, [userLocation]);

  // --- reset index if route shrinks / changes length ---
  useEffect(() => {
    if ((courierRoute?.length ?? 0) === 0) {
      setCurrentRouteIndex(0);
      lastNotifiedPosRef.current = null;
    } else if (currentRouteIndex >= courierRoute.length) {
      setCurrentRouteIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courierRoute.length]);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden">
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: '400px', backgroundColor: '#f8f9fa' }}
      />

      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-600 text-sm">Loading MapTiler map...</p>
        </div>
      )}

      {!mapLoaded && (
        <div className="absolute inset-4 bg-blue-50 border-2 border-blue-200 rounded-lg flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-8">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
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
