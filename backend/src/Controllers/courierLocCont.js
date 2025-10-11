import express from "express";
import rateLimit from "express-rate-limit";
import { getRedisClient } from "../../utils/redis.js";
import { authenticate } from "../Middlewares/accessControl.js";
import { getIO } from "../../utils/socket.js";
import prisma from "../../utils/prisma.js";

const router = express.Router();

// ✅ Rate limiter - Max 1 update per 30 seconds per courier (prevent spam, save memory)
const locationUpdateLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // Max 1 request per window
  keyGenerator: (req) => req.user.id, // Per courier ID
  message: {
    success: false,
    message: "Terlalu banyak update lokasi. Coba lagi dalam 30 detik.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Kurir update lokasi (real-time) - Web-based tracking
 * POST /courier/location
 *
 * Optimizations:
 * - Rate limiting: Max 1 update per 30s per courier
 * - Active order check: Only store if has deliveries
 * - TTL: 30 minutes (not 1 hour) to save memory
 * - Socket.IO: Broadcast to customers tracking this courier
 */
router.post(
  "/location",
  authenticate,
  locationUpdateLimiter,
  async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const courierId = req.user.id;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: "Latitude dan longitude wajib diisi",
        });
      }

      // ✅ Validate coordinate ranges
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: "Koordinat tidak valid",
        });
      }

      const redis = getRedisClient();

      if (!redis) {
        return res.status(503).json({
          success: false,
          message: "Redis tidak tersedia",
        });
      }

      // ✅ Check if courier has active deliveries (memory optimization)
      const activeOrders = await prisma.order.count({
        where: {
          courierId,
          orderStatus: {
            in: ["OUT_FOR_DELIVERY", "READY_FOR_PICKUP"],
          },
          // isDeleted: false,
        },
      });

      if (activeOrders === 0) {
        return res.json({
          success: true,
          message: "Tidak ada pengantaran aktif. Lokasi tidak disimpan.",
          stored: false,
          activeOrders: 0,
        });
      }

      const locationData = {
        courierId,
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString(),
        activeOrders,
      };

      // ✅ Store in Redis with 30 min TTL (not 1 hour - save memory)
      await redis.set(
        `courier:location:${courierId}`,
        locationData,
        { ex: 1800 } // 30 minutes expiry
      );

      console.log(`📍 Courier ${courierId} location updated:`, {
        lat,
        lng,
        activeOrders,
      });

      // ✅ Broadcast to customers tracking this courier via Socket.IO
      try {
        const io = getIO();
        const orders = await prisma.order.findMany({
          where: {
            courierId,
            orderStatus: "OUT_FOR_DELIVERY",
          },
          select: { id: true },
        });

        orders.forEach((order) => {
          io.to(`order:${order.id}`).emit("courier-location-updated", {
            courierId,
            latitude: lat,
            longitude: lng,
            timestamp: locationData.timestamp,
          });
        });
      } catch (socketErr) {
        console.error("Socket.IO broadcast error:", socketErr);
        // Continue even if broadcast fails
      }

      res.json({
        success: true,
        message: "Lokasi kurir berhasil diupdate",
        stored: true,
        location: locationData,
      });
    } catch (error) {
      console.error("Error updating courier location:", error);
      res.status(500).json({
        success: false,
        message: "Gagal update lokasi kurir",
        error: error.message,
      });
    }
  }
);

/**
 * Get lokasi kurir (untuk user tracking)
 * GET /courier/location/:courierId
 */
router.get("/location/:courierId", async (req, res) => {
  try {
    const { courierId } = req.params;

    const redis = getRedisClient();

    if (!redis) {
      return res.status(503).json({
        success: false,
        message: "Redis tidak tersedia",
      });
    }

    // Upstash auto-deserializes, get returns object directly
    const location = await redis.get(`courier:location:${courierId}`);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Lokasi kurir tidak ditemukan atau belum diupdate",
      });
    }

    // location is already an object, no need to JSON.parse
    res.json({
      success: true,
      location: {
        courierId,
        ...location,
      },
    });
  } catch (error) {
    console.error("Error fetching courier location:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil lokasi kurir",
      error: error.message,
    });
  }
});

/**
 * Simulate courier movement for testing
 * POST /courier/location/simulate/:courierId
 *
 * Body: {
 *   startLat, startLng,
 *   endLat, endLng,
 *   steps (optional, default 10)
 * }
 */
router.post("/location/simulate/:courierId", async (req, res) => {
  try {
    const { courierId } = req.params;
    const { startLat, startLng, endLat, endLng, steps = 10 } = req.body;

    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({
        success: false,
        message: "startLat, startLng, endLat, endLng wajib diisi",
      });
    }

    const redis = getRedisClient();

    if (!redis) {
      return res.status(503).json({
        success: false,
        message: "Redis tidak tersedia",
      });
    }

    // Set initial position
    const initialLocation = {
      latitude: parseFloat(startLat),
      longitude: parseFloat(startLng),
      timestamp: new Date().toISOString(),
    };

    // Upstash auto-serializes, pass object directly
    await redis.set(`courier:location:${courierId}`, initialLocation, {
      ex: 3600,
    });

    // Calculate step increments
    const latStep = (parseFloat(endLat) - parseFloat(startLat)) / steps;
    const lngStep = (parseFloat(endLng) - parseFloat(startLng)) / steps;

    // Simulate movement asynchronously
    let currentStep = 0;
    const interval = setInterval(async () => {
      currentStep++;

      if (currentStep > steps) {
        clearInterval(interval);
        console.log(`✅ Simulation completed for courier ${courierId}`);
        return;
      }

      const newLocation = {
        latitude: parseFloat(startLat) + latStep * currentStep,
        longitude: parseFloat(startLng) + lngStep * currentStep,
        timestamp: new Date().toISOString(),
      };

      try {
        // Upstash auto-serializes, pass object directly
        await redis.set(`courier:location:${courierId}`, newLocation, {
          ex: 3600,
        });
        console.log(
          `🚚 Step ${currentStep}/${steps}: Courier ${courierId} moved to`,
          newLocation
        );
      } catch (err) {
        console.error("Error in simulation step:", err);
        clearInterval(interval);
      }
    }, 3000); // Update every 3 seconds

    res.json({
      success: true,
      message: `Simulation started for courier ${courierId}`,
      details: {
        from: { lat: startLat, lng: startLng },
        to: { lat: endLat, lng: endLng },
        steps,
        updateInterval: "3 seconds",
      },
    });
  } catch (error) {
    console.error("Error simulating courier movement:", error);
    res.status(500).json({
      success: false,
      message: "Gagal simulate movement",
      error: error.message,
    });
  }
});

/**
 * Quick set courier location for testing (NO AUTH REQUIRED)
 * POST /courier/location/quick-set/:courierId
 *
 * Body: {
 *   latitude: -6.2088,
 *   longitude: 106.8456
 * }
 */
router.post("/location/quick-set/:courierId", async (req, res) => {
  try {
    const { courierId } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "latitude dan longitude wajib diisi",
      });
    }

    const redis = getRedisClient();

    if (!redis) {
      return res.status(503).json({
        success: false,
        message: "Redis tidak tersedia",
      });
    }

    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date().toISOString(),
    };

    // Upstash auto-serializes, pass object directly
    await redis.set(
      `courier:location:${courierId}`,
      locationData,
      { ex: 3600 } // Expire in 1 hour
    );

    console.log(
      `📍 [QUICK-SET] Courier ${courierId} location set:`,
      locationData
    );

    res.json({
      success: true,
      message: "Lokasi kurir berhasil di-set untuk testing",
      location: locationData,
    });
  } catch (error) {
    console.error("Error quick-setting courier location:", error);
    res.status(500).json({
      success: false,
      message: "Gagal set lokasi kurir",
      error: error.message,
    });
  }
});

export default router;
