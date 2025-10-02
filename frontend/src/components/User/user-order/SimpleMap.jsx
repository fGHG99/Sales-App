import React, { useEffect, useRef } from 'react';
import { Map, config, Marker } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

const SimpleMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // Prevent re-initialization

    // Configure MapTiler API key
    config.apiKey = 'sYpKfEBLoyx6z9knczl3';

    // Initialize map
    map.current = new Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=sYpKfEBLoyx6z9knczl3`,
      center: [-74.006, 40.7128], // New York
      zoom: 13
    });

    // Add load event listener
    map.current.on('load', () => {
      console.log('✅ MapTiler map loaded successfully!');
      
      // Add a simple marker
      new Marker()
        .setLngLat([-74.006, 40.7128])
        .addTo(map.current);
    });

    map.current.on('error', (e) => {
      console.error('❌ MapTiler error:', e);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        width: '100%', 
        height: '400px',
        border: '2px solid #ccc',
        borderRadius: '8px'
      }}
    />
  );
};

export default SimpleMap;