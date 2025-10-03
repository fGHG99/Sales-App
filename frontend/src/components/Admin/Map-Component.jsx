import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { X, Navigation, Clock } from 'lucide-react';
import { Button } from '../ui/button';

const MapComponent = ({ courierData, userLocation, onClose }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [eta, setEta] = useState('15-20 min');

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    // MapTiler API key provided by user
    const MAPTILER_KEY = 'sYpKfEBLoyx6z9knczl3';

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      center: courierData.currentLocation ? [courierData.currentLocation.lng, courierData.currentLocation.lat] : [106.8456, -6.2088], // Default to Jakarta
      zoom: 13,
      attributionControl: true
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add courier marker
      if (courierData.currentLocation) {
        const courierMarker = new maplibregl.Marker({
          color: '#3B82F6', // Blue color for courier
          rotation: 0
        })
        .setLngLat([courierData.currentLocation.lng, courierData.currentLocation.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${courierData.name}</h3>
                <p class="text-sm text-gray-600">Courier</p>
                <p class="text-sm">Status: ${courierData.status}</p>
              </div>
            `)
        )
        .addTo(map.current);
      }

      // Add user/destination marker
      if (userLocation) {
        const userMarker = new maplibregl.Marker({
          color: '#EF4444', // Red color for destination
          rotation: 0
        })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">Delivery Location</h3>
                <p class="text-sm text-gray-600">Customer Address</p>
              </div>
            `)
        )
        .addTo(map.current);
      }

      // If both locations exist, create a route line and fit bounds
      if (courierData.currentLocation && userLocation) {
        // Create a simple line between courier and destination
        map.current.addSource('route', {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': [
                [courierData.currentLocation.lng, courierData.currentLocation.lat],
                [userLocation.lng, userLocation.lat]
              ]
            }
          }
        });

        map.current.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#10B981',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });

        // Fit map to show both locations
        const bounds = new maplibregl.LngLatBounds()
          .extend([courierData.currentLocation.lng, courierData.currentLocation.lat])
          .extend([userLocation.lng, userLocation.lat]);
        
        map.current.fitBounds(bounds, { padding: 50 });

        // Calculate simple ETA based on distance (mock calculation)
        const distance = calculateDistance(
          courierData.currentLocation.lat,
          courierData.currentLocation.lng,
          userLocation.lat,
          userLocation.lng
        );
        
        // Assuming average speed of 25 km/h in city traffic
        const estimatedTime = Math.round((distance / 25) * 60);
        setEta(estimatedTime < 60 ? `${estimatedTime} min` : `${Math.round(estimatedTime / 60)}h ${estimatedTime % 60}min`);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [courierData, userLocation]);

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" data-testid="map-modal">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Live Courier Tracking</h2>
            <p className="text-sm text-gray-600">Real-time location and ETA information</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="close-map-button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Map container */}
        <div className="flex-1 relative">
          <div
            ref={mapContainer}
            className="w-full h-full rounded-b-lg"
            data-testid="map-container"
          />
          
          {/* Loading overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}

          {/* Info panel */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm" data-testid="courier-info-panel">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{courierData.name}</h3>
                <p className="text-sm text-gray-600">Courier ID: {courierData.id}</p>
                <p className="text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    courierData.status === 'aktif' ? 'bg-green-100 text-green-800' :
                    courierData.status === 'dalam perjalanan' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {courierData.status}
                  </span>
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-sm font-medium">ETA: {eta}</span>
                </div>
                <div className="flex items-center">
                  <Navigation className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm">En route</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 border-t pt-2">
                <p>⚫ Courier Location (Blue marker)</p>
                <p>🔴 Delivery Location (Red marker)</p>
                <p className="text-green-600">— Route path</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3" data-testid="map-legend">
            <h4 className="font-medium text-sm mb-2">Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>Courier Position</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Delivery Address</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-0.5 bg-green-500 mr-2"></div>
                <span>Route</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;