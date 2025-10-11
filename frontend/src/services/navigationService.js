import axios from "axios";

/**
 * OpenRouteService Navigation Service
 * Provides route calculation and turn-by-turn navigation
 */

const ORS_API_KEY = import.meta.env.VITE_OPENROUTE_KEY;
const ORS_BASE_URL = "https://api.openrouteservice.org/v2";

// ✅ Validate API key on module load
// if (!ORS_API_KEY) {
//   console.error(
//     "❌ VITE_OPENROUTE_API_KEY is not set in environment variables"
//   );
//   console.warn(
//     "⚠️ Navigation features will not work without OpenRouteService API key"
//   );
//   console.info(
//     "ℹ️ Get your free API key at: https://openrouteservice.org/dev/#/signup"
//   );
// }

/**
 * Get route directions from current location to destination
 * @param {number} startLng - Starting longitude
 * @param {number} startLat - Starting latitude
 * @param {number} endLng - Destination longitude
 * @param {number} endLat - Destination latitude
 * @param {string} profile - Transport profile (driving-car, cycling-regular, foot-walking)
 * @returns {Promise} Route data with geometry and instructions
 */
export const getRouteDirections = async (
  startLng,
  startLat,
  endLng,
  endLat,
  profile = "driving-car"
) => {
  // ✅ Check API key before making request
  if (!ORS_API_KEY) {
    throw new Error(
      "OpenRouteService API key tidak ditemukan. Silakan tambahkan VITE_OPENROUTE_API_KEY di file .env"
    );
  }

  try {
    console.log("🗺️ Requesting route from OpenRouteService...");
    console.log("  Start:", [startLng, startLat]);
    console.log("  End:", [endLng, endLat]);

    const response = await axios.post(
      `${ORS_BASE_URL}/directions/${profile}`,
      {
        coordinates: [
          [startLng, startLat], // Start point [lng, lat]
          [endLng, endLat], // End point [lng, lat]
        ],
        instructions: true, // Turn-by-turn instructions
        preference: "fastest", // Optimize for fastest route
        units: "m", // Metric units
      },
      {
        headers: {
          Authorization: ORS_API_KEY, // ✅ API key in Authorization header
          "Content-Type": "application/json",
        },
      }
    );

    const route = response.data.routes[0];

    console.log("✅ Route fetched successfully");
    console.log("  Distance:", route.summary.distance, "meters");
    console.log("  Duration:", route.summary.duration, "seconds");

    return {
      distance: route.summary.distance, // in meters
      duration: route.summary.duration, // in seconds
      geometry: route.geometry, // Encoded polyline or GeoJSON
      instructions: route.segments[0].steps, // Turn-by-turn
      bbox: route.bbox, // Bounding box [minLng, minLat, maxLng, maxLat]
    };
  } catch (error) {
    console.error("❌ Error fetching route from OpenRouteService:", error);

    // ✅ Better error messages
    if (error.response?.status === 401) {
      throw new Error(
        "API key OpenRouteService tidak valid. Periksa VITE_OPENROUTE_API_KEY di file .env"
      );
    } else if (error.response?.status === 403) {
      throw new Error(
        "Akses ditolak oleh OpenRouteService. Periksa API key atau quota"
      );
    } else if (error.response?.status === 429) {
      throw new Error(
        "Terlalu banyak permintaan ke OpenRouteService. Coba lagi nanti"
      );
    } else if (error.response) {
      throw new Error(
        `OpenRouteService error: ${error.response.status} - ${
          error.response.data?.error?.message || "Unknown error"
        }`
      );
    } else if (error.request) {
      throw new Error(
        "Tidak dapat terhubung ke OpenRouteService. Periksa koneksi internet"
      );
    }

    throw error;
  }
};

/**
 * Calculate ETA (Estimated Time of Arrival) in human-readable format
 * @param {number} durationSeconds - Duration in seconds
 * @returns {string} Formatted ETA (e.g., "5 min", "1 jam 30 min")
 */
export const formatETA = (durationSeconds) => {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.ceil((durationSeconds % 3600) / 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours} jam ${minutes} min` : `${hours} jam`;
  }
  return `${minutes} min`;
};

/**
 * Format distance to human-readable format
 * @param {number} distanceMeters - Distance in meters
 * @returns {string} Formatted distance (e.g., "1.5 km", "250 m")
 */
export const formatDistance = (distanceMeters) => {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distanceMeters)} m`;
};

/**
 * Decode polyline geometry to coordinates array
 * OpenRouteService returns encoded polyline, this decodes it
 * @param {string} encoded - Encoded polyline string
 * @param {boolean} is3D - Whether polyline includes elevation
 * @returns {Array} Array of [lng, lat] coordinates
 */
export const decodePolyline = (encoded, is3D = false) => {
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lng / 1e5, lat / 1e5]);

    // Skip elevation if 3D
    if (is3D) {
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
    }
  }

  return points;
};

/**
 * Get optimized route with multiple waypoints (for multi-delivery)
 * @param {Array} waypoints - Array of [lng, lat] coordinates
 * @param {string} profile - Transport profile
 * @returns {Promise} Optimized route data
 */
export const getOptimizedRoute = async (waypoints, profile = "driving-car") => {
  try {
    const response = await axios.post(
      `${ORS_BASE_URL}/directions/${profile}`,
      {
        coordinates: waypoints,
        instructions: true,
        preference: "fastest",
        units: "m",
        optimize_waypoints: true, // Let ORS optimize order
      },
      {
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching optimized route:", error);
    throw error;
  }
};

/**
 * Check if location is within delivery radius
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @param {number} radiusMeters - Radius in meters (default 10m for arrival detection)
 * @returns {boolean} True if within radius
 */
export const isWithinRadius = (lat1, lng1, lat2, lng2, radiusMeters = 10) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance <= radiusMeters;
};
