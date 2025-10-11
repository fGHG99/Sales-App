import cron from "node-cron";
import { getRedisClient } from "./redis.js";

/**
 * Cleanup stale courier locations from Redis
 * Runs every 30 minutes
 * Deletes locations older than 60 minutes (double TTL as safety net)
 *
 * Memory optimization strategy:
 * - TTL already handles most cleanup (30 min expiry)
 * - This cron is extra safety to catch edge cases
 * - Prevents memory buildup from failed TTL expiry
 */
export const startLocationCleanup = () => {
  // Run every 30 minutes (at :00 and :30)
  cron.schedule("*/30 * * * *", async () => {
    console.log("🧹 Running courier location cleanup...");

    try {
      const redis = getRedisClient();

      if (!redis) {
        console.warn("⚠️ Redis not available, skipping cleanup");
        return;
      }

      // Get all courier location keys
      const keys = await redis.keys("courier:location:*");

      if (keys.length === 0) {
        console.log("✅ No courier locations to clean");
        return;
      }

      let deletedCount = 0;
      let keptCount = 0;
      let errorCount = 0;

      for (const key of keys) {
        try {
          const data = await redis.get(key);

          // Delete if no data or malformed
          if (!data || !data.timestamp) {
            await redis.del(key);
            deletedCount++;
            continue;
          }

          // Check age
          const timestamp = new Date(data.timestamp);
          const now = new Date();
          const minutesSinceUpdate = (now - timestamp) / (1000 * 60);

          // Delete if older than 60 minutes (double the TTL)
          if (minutesSinceUpdate > 60) {
            await redis.del(key);
            deletedCount++;
            console.log(
              `🗑️ Deleted stale location: ${key} (${Math.floor(
                minutesSinceUpdate
              )} minutes old)`
            );
          } else {
            keptCount++;
          }
        } catch (err) {
          console.error(`❌ Error processing key ${key}:`, err);
          errorCount++;
        }
      }

      console.log(
        `✅ Cleanup complete: ${deletedCount} deleted, ${keptCount} kept, ${errorCount} errors (Total keys: ${keys.length})`
      );

      // Log memory usage (if Upstash supports it)
      try {
        const dbsize = await redis.dbsize();
        console.log(`📊 Redis DB size: ${dbsize} keys`);
      } catch (err) {
        // Ignore if not supported
      }
    } catch (error) {
      console.error("❌ Cleanup error:", error);
    }
  });

  console.log("✅ Location cleanup cron job started (runs every 30 minutes)");
};

/**
 * Optional: Manual cleanup trigger (can be exposed as admin endpoint)
 */
export const manualCleanup = async () => {
  console.log("🧹 Running manual cleanup...");

  const redis = getRedisClient();

  if (!redis) {
    throw new Error("Redis not available");
  }

  const keys = await redis.keys("courier:location:*");
  let deletedCount = 0;

  for (const key of keys) {
    const data = await redis.get(key);

    if (!data || !data.timestamp) {
      await redis.del(key);
      deletedCount++;
      continue;
    }

    const minutesSinceUpdate =
      (new Date() - new Date(data.timestamp)) / (1000 * 60);

    if (minutesSinceUpdate > 60) {
      await redis.del(key);
      deletedCount++;
    }
  }

  return {
    totalKeys: keys.length,
    deletedCount,
    keptCount: keys.length - deletedCount,
  };
};
