import { getRedisClient } from "./redis.js";
import prisma from "./prisma.js";

let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => {
  return ioInstance;
};

/**
 * Initialize Socket.IO event handlers
 * Handles real-time courier location tracking
 */
export const initializeSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    console.log(`   Transport: ${socket.conn.transport.name}`); // Log transport type (websocket/polling)

    // User joins their personal room for notifications
    socket.on("join", ({ userId }) => {
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined room: user:${userId}`);
    });

    // Courier shares real-time location
    socket.on("courier-share-location", async (data) => {
      try {
        const { courierId, orderId, latitude, longitude } = data;

        // Validate data
        if (!courierId || !orderId || !latitude || !longitude) {
          socket.emit("error", { message: "Invalid location data" });
          return;
        }

        // Store in Redis (fast, in-memory cache)
        const redis = getRedisClient();

        if (redis) {
          const locationKey = `courier:${courierId}:location`;
          const locationData = JSON.stringify({
            latitude,
            longitude,
            orderId,
            timestamp: new Date().toISOString(),
          });

          // Upstash Redis API: set with expiration (EX in seconds)
          await redis.set(locationKey, locationData, { ex: 300 }); // TTL: 5 minutes

          console.log(
            `📍 Courier ${courierId} location cached: ${latitude}, ${longitude}`
          );
        } else {
          console.warn("⚠️ Redis not available, skipping location cache");
        }

        // Get order to find customer - using valid OrderStatus enum values
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            courierId,
            orderStatus: {
              in: [
                "IN_PREPARATION",
                "READY_FOR_PICKUP",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
              ],
            },
          },
          select: { userId: true },
        });

        if (order) {
          // Broadcast to customer tracking this order
          io.to(`user:${order.userId}`).emit("courier-location-update", {
            orderId,
            courierLocation: {
              latitude,
              longitude,
            },
            timestamp: new Date(),
          });

          console.log(`📡 Location broadcasted to user ${order.userId}`);
        }
      } catch (error) {
        console.error("❌ Error handling courier location:", error);
        // ✅ Just log the error, courier will retry on next GPS update
        // No need to emit error event that triggers fallback
      }
    });

    // Customer requests current courier location
    socket.on("request-courier-location", async (data) => {
      const { orderId, userId } = data; // ✅ Move to outer scope for catch block

      try {
        // Verify order belongs to this user
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            userId,
          },
          select: { courierId: true },
        });

        if (!order || !order.courierId) {
          // ✅ Don't emit "error" for business logic issues - use specific event
          socket.emit("courier-location-unavailable", {
            orderId,
            message: "Order not found or no courier assigned",
          });
          console.log(
            `⚠️ User ${userId} requested location for order ${orderId} - no courier assigned`
          );
          return;
        }

        // Get courier location from Redis
        const redis = getRedisClient();

        if (!redis) {
          socket.emit("courier-location-unavailable", {
            orderId,
            message: "Real-time tracking not available (Redis not connected)",
          });
          return;
        }

        const locationKey = `courier:${order.courierId}:location`;
        const locationData = await redis.get(locationKey);

        if (locationData) {
          // ✅ Upstash Redis returns object directly, not string
          // Check if already parsed or needs parsing
          const location =
            typeof locationData === "string"
              ? JSON.parse(locationData)
              : locationData;

          socket.emit("courier-location-update", {
            orderId,
            courierLocation: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            timestamp: location.timestamp,
          });
          console.log(`📍 Sent cached location to user ${userId}`);
        } else {
          socket.emit("courier-location-unavailable", {
            orderId,
            message: "Courier location not available",
          });
        }
      } catch (error) {
        console.error("❌ Error fetching courier location:", error);
        // ✅ Don't emit "error" - use specific unavailable event
        socket.emit("courier-location-unavailable", {
          orderId, // ✅ Now in scope!
          message: "Failed to get location - server error",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

export default { setIO, getIO, initializeSocketHandlers };
