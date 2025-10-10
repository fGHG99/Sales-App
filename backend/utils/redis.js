import { Redis } from "@upstash/redis";

/**
 * Upstash Redis client for caching and real-time data
 * Used for courier location tracking to avoid database bottleneck
 *
 * Upstash REST API advantages:
 * - Serverless-friendly (HTTP-based)
 * - Auto-scaling
 * - Global edge network
 * - No connection pooling issues
 */

let redisClient = null;

const connectRedis = async () => {
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!upstashUrl || !upstashToken) {
      throw new Error(
        "Missing Upstash credentials. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env"
      );
    }

    redisClient = new Redis({
      url: upstashUrl,
      token: upstashToken,
    });

    // Test connection
    const pingResult = await redisClient.ping();

    if (pingResult === "PONG") {
      console.log("✅ Upstash Redis Connected Successfully");
      console.log(`📍 Upstash URL: ${upstashUrl}`);
    } else {
      throw new Error("Redis ping failed");
    }

    return redisClient;
  } catch (error) {
    console.error("❌ Failed to connect to Upstash Redis:", error.message);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    console.warn("⚠️ Redis client not initialized. Returning null.");
    return null;
  }
  return redisClient;
};

const disconnectRedis = async () => {
  // Upstash REST API doesn't need explicit disconnection
  // It's stateless HTTP requests
  if (redisClient) {
    redisClient = null;
    console.log("🔌 Upstash Redis Client Disconnected");
  }
};

export { connectRedis, getRedisClient, disconnectRedis };
export default { connectRedis, getRedisClient, disconnectRedis };
