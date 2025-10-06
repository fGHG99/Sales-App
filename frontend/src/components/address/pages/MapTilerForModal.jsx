import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { MapPinned, Loader2 } from "lucide-react";
import { getCurrentLocation, addMarker } from "./AddressHandler";

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const MapTilerForModal = ({ onLocationSelect, externalSearchResult }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [processedSearchResult, setProcessedSearchResult] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (map.current) return; // Jangan re-init kalau sudah ada

    maptilersdk.config.apiKey = MAPTILER_API_KEY;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: [107.57828605427846, -6.935577536865563], // default Bandung
      zoom: 13,
    });

    // Function to get address from coordinates using Nominatim
    const reverseGeocode = async (lat, lng) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=id,en`
        );

        if (!response.ok) {
          throw new Error("Nominatim API request failed");
        }

        const data = await response.json();

        // Return both display name and full address object
        return {
          displayName:
            data.display_name ||
            `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
          addressData: data.address || null,
        };
      } catch (error) {
        console.error("Error fetching address:", error);
        return {
          displayName: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
          addressData: null,
        };
      }
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

    // Handle map click untuk pilih lokasi
    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;

      // Buat marker baru kalau belum ada
      if (!marker.current) {
        marker.current = new maptilersdk.Marker({ color: "red" })
          .setLngLat([lng, lat])
          .addTo(map.current);
      } else {
        marker.current.setLngLat([lng, lat]);
      }

      // Get address from coordinates
      const geocodeResult = await reverseGeocode(lat, lng);

      // Kirim lokasi ke parent dengan address data lengkap
      onLocationSelect({
        lat,
        lng,
        address: geocodeResult.displayName,
        addressData: geocodeResult.addressData,
      });
    });
  }, [onLocationSelect]);

  // Update marker ketika ada hasil dari search (HANYA visual update, tidak trigger onLocationSelect)
  useEffect(() => {
    if (!map.current || !externalSearchResult) return;

    // Prevent processing the same search result multiple times
    if (processedSearchResult === externalSearchResult) return;

    // Extract coordinates from the correct structure
    const { coordinates } = externalSearchResult.geometry;
    const { display_name } = externalSearchResult.properties;

    // Coordinates are in [lng, lat] format
    const [lng, lat] = coordinates;

    // Validate coordinates to prevent NaN error
    if (
      typeof lng !== "number" ||
      typeof lat !== "number" ||
      isNaN(lng) ||
      isNaN(lat)
    ) {
      console.error("Invalid coordinates:", { lng, lat });
      return;
    }

    // Update marker position
    if (!marker.current) {
      marker.current = new maptilersdk.Marker({ color: "red" })
        .setLngLat([lng, lat])
        .addTo(map.current);
    } else {
      marker.current.setLngLat([lng, lat]);
    }

    // Fly to the search result location
    map.current.flyTo({ center: [lng, lat], zoom: 15 });

    // Mark this search result as processed
    setProcessedSearchResult(externalSearchResult);

    // ❌ REMOVED: onLocationSelect call from here to prevent infinite loop
    // onLocationSelect will only be called when user actually clicks
  }, [externalSearchResult]);

  // Function to get user's current location
  const getCurrentUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser ini.");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("User location:", latitude, longitude);

        try {
          // Get address from coordinates using Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=id,en`
          );

          let address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(
            6
          )}`;
          let addressData = null;

          if (response.ok) {
            const data = await response.json();
            address = data.display_name || address;
            addressData = data.address || null;
          }

          // Fly to user location
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              duration: 2000,
            });

            // Add or update marker
            if (!marker.current) {
              marker.current = new maptilersdk.Marker({ color: "red" })
                .setLngLat([longitude, latitude])
                .addTo(map.current);
            } else {
              marker.current.setLngLat([longitude, latitude]);
            }
          }

          // Send location to parent component with address data
          onLocationSelect({
            lat: latitude,
            lng: longitude,
            address: address,
            addressData: addressData,
          });
        } catch (error) {
          console.error("Error fetching address:", error);
          // Still send coordinates even if address fetch fails
          onLocationSelect({
            lat: latitude,
            lng: longitude,
            address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(
              6
            )}`,
            addressData: null,
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsGettingLocation(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert(
              "Akses lokasi ditolak oleh user. Silakan izinkan akses lokasi pada browser."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Informasi lokasi tidak tersedia.");
            break;
          case error.TIMEOUT:
            alert("Request untuk mendapatkan lokasi timeout.");
            break;
          default:
            alert("Terjadi error yang tidak diketahui saat mengakses lokasi.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        className="w-full h-80 rounded-md border border-gray-300"
      />

      {/* Get Current Location Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={getCurrentUserLocation}
          disabled={isGettingLocation}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md shadow-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
          title="Dapatkan Lokasi Saya"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Mencari...
            </>
          ) : (
            <>
              <MapPinned className="w-4 h-4" />
              Lokasi Saya
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MapTilerForModal;
