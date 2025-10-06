import axios from 'axios';
import * as maptilersdk from '@maptiler/sdk';

// Geocoding search function (using Nominatim)
export const handleSearch = async ({
  searchQuery,
  setIsSearching,
  setSearchResults
}) => {
  if (!searchQuery.trim()) return;

  setIsSearching(true);
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: searchQuery,
          format: "json",
          addressdetails: 1,
          limit: 5,
          countrycodes: "id", // 🔑 hanya cari di Indonesia
        },
        headers: {
          "Accept-Language": "id", // opsional: hasil alamat pakai bahasa Indonesia
        },
      }
    );

    // Normalisasi hasil agar konsisten dengan struktur Feature
    const results = response.data.map((item) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
      },
      properties: {
        display_name: item.display_name,
        address: item.address,
      },
    }));

    setSearchResults(results);
  } catch (error) {
    console.error("Geocoding search failed:", error);
    setSearchResults([]);
  } finally {
    setIsSearching(false);
  }
};

// Autocomplete search function dengan Nominatim
export const performAutocompleteSearch = async ({
  query,
  setIsSearching,
  setSearchResults,
  setShowDropdown
}) => {
  if (!query.trim() || query.length < 3) {
    setSearchResults([]);
    setShowDropdown(false);
    return;
  }

  setIsSearching(true);
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          addressdetails: 1,
          limit: 8, // Lebih banyak hasil untuk autocomplete
          countrycodes: "id", // 🔑 Hanya Indonesia
          dedupe: 1, // Hapus duplikasi
          extratags: 1, // Info tambahan
        },
        headers: {
          "Accept-Language": "id",
          "User-Agent": "YourAppName/1.0", // Nominatim memerlukan User-Agent
        },
      }
    );

    // Normalisasi dan filter hasil
    const results = response.data
      .map((item) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
        },
        properties: {
          display_name: item.display_name,
          address: item.address,
          place_id: item.place_id,
          osm_type: item.osm_type,
          class: item.class,
          type: item.type,
        },
      }))
      .filter((item) => {
        // Filter untuk mendapatkan hasil yang relevan
        const props = item.properties;
        return (
          props.display_name &&
          props.address &&
          (props.address.country_code === "id" ||
            props.display_name.toLowerCase().includes("indonesia"))
        );
      });

    setSearchResults(results);
    setShowDropdown(results.length > 0);
  } catch (error) {
    console.error("Autocomplete search failed:", error);
    setSearchResults([]);
    setShowDropdown(false);
  } finally {
    setIsSearching(false);
  }
};

// Reverse geocoding function
export const reverseGeocode = async (lat, lng, MAPTILER_API_KEY) => {
  try {
    const response = await axios.get(
      `https://api.maptiler.com/geocoding/${lng},${lat}.json`,
      {
        params: {
          key: MAPTILER_API_KEY,
        },
      }
    );

    console.log("Reverse geocoding result: ", response.data);
    return response.data.features?.[0]?.place_name || "Address not found";
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return "Address not found";
  }
};

// Fungsi tambah marker (hanya 1 marker aktif)
export const addMarker = async ({
  lng,
  lat,
  title,
  map,
  currentMarkerRef
}) => {
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

// Handle search result click (adapted for Nominatim)
export const handleSearchResultClick = async ({
  result,
  map,
  addMarker,
  reverseGeocode,
  setSelectedAddress,
  setSearchResults,
  setSearchQuery,
  currentMarkerRef,
  MAPTILER_API_KEY
}) => {
  const [lng, lat] = result.geometry.coordinates;

  // Fly to location
  if (map.current) {
    map.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 1500,
    });
  }

  const markerAdded = await addMarker({
    lng,
    lat,
    title: result.properties.display_name, // use display_name from Nominatim
    map,
    currentMarkerRef
  });

  if (markerAdded) {
    // Get address for the new marker location
    try {
      const address = await reverseGeocode(lat, lng, MAPTILER_API_KEY);
      setSelectedAddress(address);
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  }

  setSearchResults([]);
  setSearchQuery("");
};

// Clear marker
export const clearMarker = ({
  currentMarkerRef,
  setSelectedAddress
}) => {
  if (currentMarkerRef.current && currentMarkerRef.current.element) {
    currentMarkerRef.current.element.remove();
  }
  currentMarkerRef.current.remove();
  currentMarkerRef.current = null;
  setSelectedAddress("");
};

export const flyToWgs = async ({
  map,
  reverseGeocode,
  setSelectedAddress,
  addMarker,
  currentMarkerRef,
  MAPTILER_API_KEY
}) => {
  if (map.current) {
    const targetLng = 107.57828605427846;
    const targetLat = -6.935577536865563;

    map.current.flyTo({
      center: [targetLng, targetLat],
      zoom: 12,
      duration: 2000,
    });

    // Gunakan koordinat yang sama untuk reverse geocoding
    const address = await reverseGeocode(targetLat, targetLng, MAPTILER_API_KEY);
    setSelectedAddress(address);
    addMarker({
      lng: targetLng,
      lat: targetLat,
      title: "WGS",
      map,
      currentMarkerRef
    });
  }
};

// Function untuk mendapatkan lokasi user saat ini
export const getCurrentLocation = ({
  map,
  addMarker,
  reverseGeocode,
  setSelectedAddress,
  currentMarkerRef,
  MAPTILER_API_KEY
}) => {
  if (!navigator.geolocation) {
    alert("Geolocation tidak didukung oleh browser ini.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      console.log("User location:", latitude, longitude);

      if (map.current) {
        // Fly ke lokasi user
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: 2000,
        });

        // Tambah marker di lokasi user
        const markerAdded = await addMarker({
          lng: longitude,
          lat: latitude,
          title: "Your Location",
          map,
          currentMarkerRef
        });

        if (markerAdded) {
          try {
            // Dapatkan alamat dari koordinat user
            const address = await reverseGeocode(latitude, longitude, MAPTILER_API_KEY);
            setSelectedAddress(address);
          } catch (error) {
            console.error("Reverse geocoding failed:", error);
          }
        }
      }
    },
    (error) => {
      console.error("Error getting location:", error);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          alert("Akses lokasi ditolak oleh user.");
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