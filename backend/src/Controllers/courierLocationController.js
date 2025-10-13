import express from "express";
import prisma from "../../utils/prisma.js";
import { getRedisClient } from "../../utils/redis.js";
import { getIO } from "../../utils/socket.js";
import { authenticate, authorize } from "../Middlewares/accessControl.js";

const router = express.Router();

/**
 * Get courier's current location from Redis cache
 * Fast read from in-memory cache
 */
router.get("/location/:courierId", authenticate, async (req, res) => {
  try {
    const { courierId } = req.params;

    const redis = getRedisClient();

    if (!redis) {
      return res.status(503).json({
        success: false,
        message: "Real-time tracking not available (Redis not connected)",
      });
    }

    const locationKey = `courier:${courierId}:location`;
    const locationData = await redis.get(locationKey);

    if (!locationData) {
      return res.status(404).json({
        success: false,
        message: "Courier location not available",
      });
    }

    const location = JSON.parse(locationData);

    res.status(200).json({
      success: true,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        orderId: location.orderId,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching courier location:", error);
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

/**
 * Courier updates location via HTTP (fallback for WebSocket)
 * Normally should use WebSocket, but this is backup endpoint
 */
router.post(
  "/location",
  authenticate,
  authorize("courier.access"),
  async (req, res) => {
    try {
      const courierId = req.user.id;
      const { latitude, longitude, orderId } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: "Latitude and longitude required",
        });
      }

      // Store in Redis with 5-minute TTL
      const redis = getRedisClient();

      if (!redis) {
        return res.status(503).json({
          success: false,
          error: "Real-time tracking not available (Redis not connected)",
        });
      }

      const locationKey = `courier:${courierId}:location`;
      const locationData = JSON.stringify({
        latitude,
        longitude,
        orderId: orderId || null,
        timestamp: new Date().toISOString(),
      });

      // Upstash Redis API: set with expiration
      await redis.set(locationKey, locationData, { ex: 300 }); // 5 minutes

      console.log(`📍 Courier ${courierId} location updated via HTTP`);

      // If orderId provided, broadcast to customer
      if (orderId) {
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            courierId,
            status: { in: ["ASSIGNED_TO_COURIER", "OUT_FOR_DELIVERY"] },
          },
          select: { userId: true },
        });

        if (order) {
          const io = getIO();
          io.to(`user:${order.userId}`).emit("courier-location-update", {
            orderId,
            courierLocation: { latitude, longitude },
            timestamp: new Date(),
          });
        }
      }

      res.status(200).json({
        success: true,
        message: "Location updated successfully",
        location: { latitude, longitude },
      });
    } catch (error) {
      console.error("❌ Error updating courier location:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  }
);

/**
 * Get courier's active deliveries
 * Shows all orders currently assigned to courier
 */
router.get(
  "/active-deliveries",
  authenticate,
  authorize("courier.access"),
  async (req, res) => {
    try {
      const courierId = req.user.id;

      const activeOrders = await prisma.order.findMany({
        where: {
          courierId,
          status: { in: ["ASSIGNED_TO_COURIER", "OUT_FOR_DELIVERY"] },
          isDeleted: false,
        },
        include: {
          deliveryAddress: {
            select: {
              recipientName: true,
              phoneNumber: true,
              street: true,
              city: true,
              province: true,
              postalCode: true,
              latitude: true,
              longitude: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          orderItems: {
            select: {
              quantity: true,
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: {
          assignedAt: "asc",
        },
      });

      res.status(200).json({
        success: true,
        count: activeOrders.length,
        orders: activeOrders,
      });
    } catch (error) {
      console.error("❌ Error fetching active deliveries:", error);
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  }
);

/**
 * Periodic sync: Update PostgreSQL with current location
 * Called by cron job or manually for persistent storage
 */
router.post(
  "/sync-location-to-db",
  authenticate,
  authorize("courier.access"),
  async (req, res) => {
    try {
      const courierId = req.user.id;

      // Get location from Redis
      const redis = getRedisClient();
      const locationKey = `courier:${courierId}:location`;
      const locationData = await redis.get(locationKey);

      if (!locationData) {
        return res.status(404).json({
          error: "No location data found in cache",
        });
      }

      const location = JSON.parse(locationData);

      // Check if courier workspace exists
      let workspace = await prisma.courierWorkspace.findUnique({
        where: { courierId },
      });

      if (!workspace) {
        // Create workspace if doesn't exist
        workspace = await prisma.courierWorkspace.create({
          data: {
            courierId,
            currentLat: location.latitude,
            currentLng: location.longitude,
            lastLocationUpdate: new Date(),
            postalCodes: [], // Will be set by admin
          },
        });
      } else {
        // Calculate distance to see if update needed
        const distance = calculateDistance(
          workspace.currentLat,
          workspace.currentLng,
          location.latitude,
          location.longitude
        );

        // Only update if moved >100 meters
        if (distance > 0.1) {
          workspace = await prisma.courierWorkspace.update({
            where: { courierId },
            data: {
              currentLat: location.latitude,
              currentLng: location.longitude,
              lastLocationUpdate: new Date(),
            },
          });
          console.log(
            `💾 Courier ${courierId} location synced to DB (moved ${distance.toFixed(
              2
            )} km)`
          );
        } else {
          console.log(
            `⏭️ Courier ${courierId} hasn't moved significantly, skip DB update`
          );
        }
      }

      res.status(200).json({
        success: true,
        message: "Location synced to database",
        workspace,
      });
    } catch (error) {
      console.error("❌ Error syncing location to DB:", error);
      res.status(500).json({ error: "Failed to sync location" });
    }
  }
);

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value) => (value * Math.PI) / 180;

export default router;
