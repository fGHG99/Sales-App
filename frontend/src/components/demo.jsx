import { useRef, useEffect, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

const MapTilerDemo = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(107.57828605427846); // Jakarta longitude
  const [lat, setLat] = useState(-6.935577536865563); // Jakarta latitude
  const [zoom, setZoom] = useState(12);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentMarkerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Your MapTiler API Key
  const MAPTILER_API_KEY = import.meta.env?.VITE_MAPTILER_API_KEY;

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize map only once

    if (!MAPTILER_API_KEY || MAPTILER_API_KEY === "your_api_key_here") {
      console.error(
        "MapTiler API key is missing. Please set VITE_MAPTILER_API_KEY in your .env file"
      );
      return;
    }

    // Set the API key
    maptilersdk.config.apiKey = MAPTILER_API_KEY;

    // Initialize the map
    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS, // You can also use SATELLITE, OUTDOOR, etc.
      center: [lng, lat],
      zoom: zoom,
    });

    // Map event listeners
    map.current.on("load", () => {
      setIsLoaded(true);
      console.log("Map loaded successfully");
    });

    map.current.on("move", () => {
      if (map.current) {
        const center = map.current.getCenter();
        setLng(Number(center.lng.toFixed(4)));
        setLat(Number(center.lat.toFixed(4)));
        setZoom(Number(map.current.getZoom().toFixed(2)));
      }
    });

    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;

      const markerAdded = await addMarker(lng, lat, "Custom Location");

      if (markerAdded) {
        try {
          const address = await reverseGeocode(lat, lng);
          setSelectedAddress(address);
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
        }
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Geocoding search function
  const handleSearch = async () => {
    if (!searchQuery.trim() || !MAPTILER_API_KEY) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(
          searchQuery
        )}.json?key=${MAPTILER_API_KEY}&limit=5`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Geocoding search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Reverse geocoding function
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.features?.[0]?.place_name || "Address not found";
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return "Address not found";
    }
  };

  // Add marker function (always keep only 1 marker)
  // Fungsi tambah marker (hanya 1 marker aktif)
  const addMarker = async (lng, lat, title) => {
    if (!map.current) return false;

    // Hapus marker lama kalau ada
    if (currentMarkerRef.current) {
      currentMarkerRef.current.remove();
      currentMarkerRef.current = null;
    }

    // Buat marker baru
    const marker = new maptilersdk.Marker({ color: "#FF0000" })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Tambah popup
    const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(`
      <div class="p-2">
        <h4 class="font-semibold">${title}</h4>
        <p class="text-sm text-gray-600">Custom marker</p>
        <p class="text-xs text-gray-500">${lng.toFixed(4)}, ${lat.toFixed(
      4
    )}</p>
      </div>
    `);

    marker.setPopup(popup);

    // Simpan ke ref biar marker lama bisa dihapus
    currentMarkerRef.current = marker;

    return true;
  };

  // Handle search result click
  const handleSearchResultClick = async (result) => {
    const [lng, lat] = result.center;

    // Fly to location
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1500,
      });
    }

    const markerAdded = await addMarker(
      lng,
      lat,
      result.text || result.place_name
    );

    if (markerAdded) {
      // Get address for the new marker location
      try {
        const address = await reverseGeocode(lat, lng);
        setSelectedAddress(address);
      } catch (error) {
        console.error("Reverse geocoding failed:", error);
      }
    }

    setSearchResults([]);
    setSearchQuery("");
  };

  // Clear marker
  const clearMarker = () => {
    if (currentMarkerRef.current && currentMarkerRef.current.element) {
      currentMarkerRef.current.element.remove();
    }
    currentMarkerRef.current.remove();
    currentMarkerRef.current = null;
    setSelectedAddress("");
  };

  // Fly to Jakarta
const flyToJakarta = () => {
    if (map.current) {
        map.current.flyTo({
            center: [107.57828605427846, -6.935577536865563],
            zoom: 12,
            duration: 2000,
        });
        
        addMarker(107.57828605427846, -6.935577536865563, "WGS");
    }
};

  if (!MAPTILER_API_KEY) {
    return (
      <div className="w-full h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-800 mb-4">
            MapTiler API Key Required
          </h2>
          <p className="text-red-600 mb-4">
            Please add your MapTiler API key to your .env file:
          </p>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono text-left">
            VITE_MAPTILER_API_KEY=your_actual_api_key_here
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Get your free API key at{" "}
            <a
              href="https://cloud.maptiler.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              cloud.maptiler.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-100 relative">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          MapTiler React Demo
        </h1>

        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Search Results:</h3>
            <div className="max-h-32 overflow-y-auto border rounded-md">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSearchResultClick(result)}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="font-medium">{result.text}</div>
                  <div className="text-sm text-gray-600">
                    {result.place_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Address */}
        {selectedAddress && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-1">
              Selected Location:
            </h4>
            <p className="text-sm text-blue-700">{selectedAddress}</p>
          </div>
        )}

        {/* Map Info */}
        <div className="text-sm text-gray-600 flex gap-4 flex-wrap">
          <span>Lng: {lng}</span>
          <span>Lat: {lat}</span>
          <span>Zoom: {zoom}</span>
          <span
            className={`px-2 py-1 rounded text-xs ${
              isLoaded
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isLoaded ? "Map Loaded" : "Loading..."}
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2">
        <div className="flex flex-col gap-2">
          <button
            onClick={clearMarker}
            className={`px-3 py-2 text-white text-sm rounded transition-colors ${
              currentMarkerRef.current
                ? "bg-red-500 hover:bg-red-600 cursor-pointer"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!currentMarkerRef.current}
          >
            Clear Marker
          </button>
          <button
            onClick={flyToJakarta}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            Fly to Jakarta
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Instructions:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click on map to add ONE marker only</li>
          <li>• Clear marker to add a new one</li>
          <li>• Search for places using the search bar</li>
          <li>• Click marker to see popup</li>
          <li>• Drag to pan, scroll to zoom</li>
          <li>• Use control buttons</li>
        </ul>
      </div>
    </div>
  );
};

export default MapTilerDemo;
