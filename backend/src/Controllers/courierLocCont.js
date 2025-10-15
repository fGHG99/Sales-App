import express from "express";
import { getRedisClient } from "../../utils/redis.js";
import { authenticate } from "../Middlewares/accessControl.js";
import { getIO } from "../../utils/socket.js";
import prisma from "../../utils/prisma.js";

const router = express.Router();

// ✅ NO RATE LIMITER!
// Frontend sends location every 5 seconds (regardless of movement)
// Backend stores all location updates in Redis with 5-minute TTL
// Frontend controls:
// 1. 5-second interval (setInterval)
// 2. Concurrent request prevention (isProcessingRef)

/**
 * Kurir update lokasi (real-time) - Web-based tracking
 * POST /courier/location
 *
 * Features:
 * - No rate limiting (frontend sends every 5s regardless of movement)
 * - Store in Redis with 5-minute TTL
 * - Broadcast to customers via Socket.IO
 * - Broadcasts for active orders (IN_PREPARATION, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED)
 */
router.post("/location", authenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const { latitude, longitude } = req.body;
    const courierId = req.user.id;

    if (!latitude || !longitude) {
      console.error(`❌ [COURIER LOCATION] Invalid data - missing coordinates`);
      return res.status(400).json({
        success: false,
        message: "Latitude dan longitude wajib diisi",
      });
    }

    // ✅ Validate coordinate ranges
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error(
        `❌ [COURIER LOCATION] Invalid coordinate ranges: lat=${lat}, lng=${lng}`
      );
      return res.status(400).json({
        success: false,
        message: "Koordinat tidak valid",
      });
    }

    console.log(
      `✅ [COURIER LOCATION] Coordinates validated: lat=${lat}, lng=${lng}`
    );

    const redis = getRedisClient();

    if (!redis) {
      return res.status(503).json({
        success: false,
        message: "Redis tidak tersedia",
      });
    }

    // ✅ Check if courier has active deliveries (memory optimization)
    console.log(
      `🔍 [COURIER LOCATION] Checking active orders for courier ${courierId}...`
    );

    // Valid OrderStatus enum values for active tracking
    const activeStatuses = [
      "IN_PREPARATION", // Order being prepared
      "READY_FOR_PICKUP", // Ready for courier to pick up
      "OUT_FOR_DELIVERY", // Courier is delivering
      "DELIVERED", // Keep for a while after delivery
    ];

    const activeOrders = await prisma.order.findMany({
      where: {
        courierId,
        orderStatus: {
          in: activeStatuses,
        },
        // isDeleted: false,
      },
      select: {
        id: true,
        orderStatus: true,
      },
    });

    console.log(
      `📊 [COURIER LOCATION] Active orders found: ${activeOrders.length}`
    );

    if (activeOrders.length > 0) {
      console.log(`📋 [COURIER LOCATION] Order details:`);
      activeOrders.forEach((order) => {
        console.log(`   - Order ${order.id}: ${order.orderStatus}`);
      });
    }

    if (activeOrders.length === 0) {
      console.warn(
        `⚠️ [COURIER LOCATION] No active orders - location not stored`
      );
      console.warn(`   Looking for statuses: ${activeStatuses.join(", ")}`);
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
      activeOrders: activeOrders.length,
    };

    // ✅ Store in Redis with 30 min TTL (not 1 hour - save memory)
    const redisKey = `courier:location:${courierId}`;
    console.log(`💾 [COURIER LOCATION] Storing to Redis: ${redisKey}`);
    await redis.set(
      redisKey,
      locationData,
      { ex: 1800 } // 30 minutes expiry
    );

    console.log(
      `✅ [COURIER LOCATION] Stored successfully in Redis (TTL: 30 min)`
    );
    console.log(`📍 [COURIER LOCATION] Data:`, {
      courierId,
      lat,
      lng,
      activeOrders: activeOrders.length,
      timestamp: locationData.timestamp,
    });

    // ✅ Broadcast to customers tracking this courier via Socket.IO
    console.log(`📡 [COURIER LOCATION] Broadcasting to customers...`);
    try {
      const io = getIO();
      // Use valid OrderStatus values for broadcasting
      const broadcastOrders = await prisma.order.findMany({
        where: {
          courierId,
          orderStatus: {
            in: [
              "IN_PREPARATION",
              "READY_FOR_PICKUP",
              "OUT_FOR_DELIVERY",
              "DELIVERED", // ✅ Include DELIVERED for post-delivery tracking
            ],
          },
        },
        select: { id: true, userId: true, orderStatus: true },
      });

      console.log(
        `📦 [COURIER LOCATION] Found ${broadcastOrders.length} orders to notify`
      );

      broadcastOrders.forEach((order) => {
        // ✅ Broadcast to user room (not order room!) with correct event name
        io.to(`user:${order.userId}`).emit("courier-location-update", {
          orderId: order.id,
          courierLocation: {
            latitude: lat,
            longitude: lng,
          },
          timestamp: locationData.timestamp,
        });
        console.log(
          `   ✉️ Broadcasted to user:${order.userId} for order:${order.id} (status: ${order.orderStatus})`
        );
      });

      console.log(
        `✅ [COURIER LOCATION] Broadcast completed to ${broadcastOrders.length} orders`
      );
    } catch (socketErr) {
      console.error(
        "❌ [COURIER LOCATION] Socket.IO broadcast error:",
        socketErr
      );
      // Continue even if broadcast fails
    }

    const processingTime = Date.now() - startTime;
    console.log(`⏱️ [COURIER LOCATION] Processing time: ${processingTime}ms`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    res.json({
      success: true,
      message: "Lokasi kurir berhasil diupdate",
      stored: true,
      location: locationData,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ [COURIER LOCATION UPLOAD] FAILED");
    console.error(`   Error: ${error.message}`);
    console.error(`   Processing time: ${processingTime}ms`);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("");
    res.status(500).json({
      success: false,
      message: "Gagal update lokasi kurir",
      error: error.message,
    });
  }
});

/**
 * Get lokasi kurir (untuk user tracking)
 * GET /courier/location/:courierId
 */
router.get("/location/:courierId", async (req, res) => {
  const startTime = Date.now();
  try {
    const { courierId } = req.params;

    const redis = getRedisClient();

    if (!redis) { 
      return res.status(503).json({
        success: false,
        message: "Redis tidak tersedia",
      });
    }

    const redisKey = `courier:location:${courierId}`;

    // Upstash auto-deserializes, get returns object directly
    const location = await redis.get(redisKey);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Lokasi kurir tidak ditemukan atau belum diupdate",
      });
    }

    res.json({
      success: true,
      location: {
        courierId,
        ...location,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil lokasi kurir",
      error: error.message,
    });
  }
});

// router.post("/location/simulate/:courierId", async (req, res) => {
//   try {
//     const { courierId } = req.params;
//     const { startLat, startLng, endLat, endLng, steps = 10 } = req.body;

//     if (!startLat || !startLng || !endLat || !endLng) {
//       return res.status(400).json({
//         success: false,
//         message: "startLat, startLng, endLat, endLng wajib diisi",
//       });
//     }

//     const redis = getRedisClient();

//     if (!redis) {
//       return res.status(503).json({
//         success: false,
//         message: "Redis tidak tersedia",
//       });
//     }

//     // Set initial position
//     const initialLocation = {
//       latitude: parseFloat(startLat),
//       longitude: parseFloat(startLng),
//       timestamp: new Date().toISOString(),
//     };

//     // Upstash auto-serializes, pass object directly
//     await redis.set(`courier:location:${courierId}`, initialLocation, {
//       ex: 3600,
//     });

//     // Calculate step increments
//     const latStep = (parseFloat(endLat) - parseFloat(startLat)) / steps;
//     const lngStep = (parseFloat(endLng) - parseFloat(startLng)) / steps;

//     // Simulate movement asynchronously
//     let currentStep = 0;
//     const interval = setInterval(async () => {
//       currentStep++;

//       if (currentStep > steps) {
//         clearInterval(interval);
//         console.log(`✅ Simulation completed for courier ${courierId}`);
//         return;
//       }

//       const newLocation = {
//         latitude: parseFloat(startLat) + latStep * currentStep,
//         longitude: parseFloat(startLng) + lngStep * currentStep,
//         timestamp: new Date().toISOString(),
//       };

//       try {
//         // Upstash auto-serializes, pass object directly
//         await redis.set(`courier:location:${courierId}`, newLocation, {
//           ex: 3600,
//         });
//         console.log(
//           `🚚 Step ${currentStep}/${steps}: Courier ${courierId} moved to`,
//           newLocation
//         );
//       } catch (err) {
//         console.error("Error in simulation step:", err);
//         clearInterval(interval);
//       }
//     }, 3000); // Update every 3 seconds

//     res.json({
//       success: true,
//       message: `Simulation started for courier ${courierId}`,
//       details: {
//         from: { lat: startLat, lng: startLng },
//         to: { lat: endLat, lng: endLng },
//         steps,
//         updateInterval: "3 seconds",
//       },
//     });
//   } catch (error) {
//     console.error("Error simulating courier movement:", error);
//     res.status(500).json({
//       success: false,
//       message: "Gagal simulate movement",
//       error: error.message,
//     });
//   }
// });

export default router;
