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

        // Get order to find customer
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            courierId,
            status: { in: ["ASSIGNED_TO_COURIER", "OUT_FOR_DELIVERY"] },
            isDeleted: false,
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
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    // Customer requests current courier location
    socket.on("request-courier-location", async (data) => {
      try {
        const { orderId, userId } = data;

        // Verify order belongs to this user
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            userId,
            isDeleted: false,
          },
          select: { courierId: true },
        });

        if (!order || !order.courierId) {
          socket.emit("error", {
            message: "Order not found or no courier assigned",
          });
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
          const location = JSON.parse(locationData);
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
        socket.emit("error", { message: "Failed to get location" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

export default { setIO, getIO, initializeSocketHandlers };
