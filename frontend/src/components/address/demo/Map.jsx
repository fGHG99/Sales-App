import { useRef, useEffect, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import NotFoundMaptiler from "../NotFoundMaptiler";
import useDebounce from "../../hook/useDebounce";
import Instruction from "./Instruction";
import {
  handleSearch,
  performAutocompleteSearch,
  reverseGeocode,
  addMarker,
  handleSearchResultClick,
  clearMarker,
  flyToWgs,
  getCurrentLocation,
} from "./AddressHandler";

const MapTiler = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(107.57828605427846);
  const [lat, setLat] = useState(-6.935577536865563);
  const [zoom, setZoom] = useState(12);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentMarkerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false); //autocomplete state

  const MAPTILER_API_KEY = import.meta.env?.VITE_MAPTILER_API_KEY;
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay

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

      const markerAdded = await addMarker({
        lng,
        lat,
        title: "Custom Location",
        map,
        currentMarkerRef,
      });

      if (markerAdded) {
        try {
          const address = await reverseGeocode(lat, lng, MAPTILER_API_KEY);
          setSelectedAddress(address);
          console.log("lat and lng: ", lat, lng);
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

  useEffect(() => {
    if (debouncedSearchQuery) {
      performAutocompleteSearch({
        query: debouncedSearchQuery,
        setIsSearching,
        setSearchResults,
        setShowDropdown,
      });
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [debouncedSearchQuery]);

  const onSearch = () => {
    handleSearch({
      searchQuery,
      setIsSearching,
      setSearchResults,
    });
  };

  const onSearchResultClick = (result) => {
    handleSearchResultClick({
      result,
      map,
      addMarker,
      reverseGeocode,
      setSelectedAddress,
      setSearchResults,
      setSearchQuery,
      currentMarkerRef,
      MAPTILER_API_KEY,
    });
  };

  const onClearMarker = () => {
    clearMarker({
      currentMarkerRef,
      setSelectedAddress,
    });
  };

  const onFlyToWgs = () => {
    flyToWgs({
      map,
      reverseGeocode,
      setSelectedAddress,
      addMarker,
      currentMarkerRef,
      MAPTILER_API_KEY,
    });
  };

  const onGetCurrentLocation = () => {
    getCurrentLocation({
      map,
      addMarker,
      reverseGeocode,
      setSelectedAddress,
      currentMarkerRef,
      MAPTILER_API_KEY,
    });
  };

  if (!MAPTILER_API_KEY) {
    return <NotFoundMaptiler />;
  }

  return (
    <div className="w-full h-screen bg-gray-100 relative">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          MapTiler React 
        </h1>

        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSearch()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={onSearch}
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
                  onClick={() => onSearchResultClick(result)}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="font-medium">
                    {result.properties.display_name}
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
            onClick={onClearMarker}
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
            onClick={onGetCurrentLocation}
            className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            📍 My Location
          </button>
          <button
            onClick={onFlyToWgs}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            Fly to WGS
          </button>
        </div>
      </div>

      <Instruction />
    </div>
  );
};

export default MapTiler;
