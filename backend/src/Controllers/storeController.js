import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate } from "../Middlewares/accessControl.js";
import { logCreate, logUpdate, logDelete } from "../../utils/auditlog.js";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
}

function generatePickupTimeSlots(openHour, closeHour) {
  const slots = [];
  const open = new Date(openHour);
  const close = new Date(closeHour);

  // Extract time components (hours and minutes only)
  const openTime = open.getHours() * 60 + open.getMinutes();
  const closeTime = close.getHours() * 60 + close.getMinutes();

  let current = new Date(open);

  // Handle next day scenario (close time is before open time)
  if (closeTime < openTime) {
    // Generate slots from open time to midnight (23:59)
    while (current.getHours() < 24) {
      const hours = current.getHours().toString().padStart(2, "0");
      const minutes = current.getMinutes().toString().padStart(2, "0");
      slots.push(`${hours}:${minutes}`);

      // Add 1 hour
      current.setHours(current.getHours() + 1);
    }

    // Reset to start of day and generate slots from 00:00 to close time
    current = new Date();
    current.setHours(0, 0, 0, 0);

    while (current.getHours() * 60 + current.getMinutes() < closeTime) {
      const hours = current.getHours().toString().padStart(2, "0");
      const minutes = current.getMinutes().toString().padStart(2, "0");
      slots.push(`${hours}:${minutes}`);

      // Add 1 hour
      current.setHours(current.getHours() + 1);
    }
  } else {
    // Normal scenario (close time is after open time)
    while (current < close) {
      const hours = current.getHours().toString().padStart(2, "0");
      const minutes = current.getMinutes().toString().padStart(2, "0");
      slots.push(`${hours}:${minutes}`);

      // Add 1 hour
      current.setHours(current.getHours() + 1);
    }
  }

  return slots;
}

/**
 * Validate store operating hours
 * Allows closing hour to be before open hour (for stores open until next day)
 * @param {Date} openHour - Store opening hour
 * @param {Date} closeHour - Store closing hour
 * @returns {Object} - Validation result with isValid and error message
 */
function validateOperatingHours(openHour, closeHour) {
  // Check if dates are valid
  if (isNaN(openHour.getTime()) || isNaN(closeHour.getTime())) {
    return {
      isValid: false,
      error:
        "Invalid date format for openHour or closeHour. Use ISO 8601 (e.g., 2025-10-07T09:00:00Z)",
    };
  }

  // Extract time components (hours and minutes only)
  const openTime = openHour.getHours() * 60 + openHour.getMinutes();
  const closeTime = closeHour.getHours() * 60 + closeHour.getMinutes();

  // Check if times are the same (not allowed)
  if (openTime === closeTime) {
    return {
      isValid: false,
      error: "Opening hour and closing hour cannot be the same",
    };
  }

  // Allow closing hour to be before open hour (next day scenario)
  // This handles cases like: open 16:00, close 03:00 (next day)
  // The validation passes as long as they are not exactly the same time
  return {
    isValid: true,
    error: null,
  };
}

/**
 * POST /store/create
 * Create a new store with address
 * Required: name, openHour, closeHour, address data
 * Optional: phoneNumber, adminId
 */
router.post("/store/create", authenticate, async (req, res) => {
  try {
    const { name, phoneNumber, openHour, closeHour, adminId, address } =
      req.body;

    console.log("Received body:", req.body);
    console.log("Admin ID:", adminId);

    // Validation
    if (!name || !openHour || !closeHour || !address) {
      return res.status(400).json({
        error: "Missing required fields: name, openHour, closeHour, address",
      });
    }

    // Validate address fields
    if (
      !address.fullAddress ||
      !address.province ||
      !address.country ||
      !address.postalCode ||
      address.latitude === undefined ||
      address.longitude === undefined
    ) {
      return res.status(400).json({
        error: "Missing required address fields",
      });
    }

    // Check authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate admin existence
    if (adminId) {
      const admin = await prisma.user.findUnique({ where: { id: adminId } });
      if (!admin) {
        return res.status(404).json({ error: "Admin user not found" });
      }
    }

    // Convert and validate hours
    const openDateTime = new Date(openHour);
    const closeDateTime = new Date(closeHour);

    // Validate operating hours using new validation function
    const timeValidation = validateOperatingHours(openDateTime, closeDateTime);
    if (!timeValidation.isValid) {
      return res.status(400).json({
        error: timeValidation.error,
      });
    }

    // Create store
    const store = await prisma.store.create({
      data: {
        name,
        phoneNumber: phoneNumber || null,
        openHour: openDateTime,
        closeHour: closeDateTime,
        createdAt: new Date(), // ✅ Added explicitly
        admin: adminId ? { connect: { id: adminId } } : undefined,
        address: {
          create: {
            fullAddress: address.fullAddress,
            subDistrict: address.subDistrict || null,
            district: address.district || null,
            city: address.city || null,
            province: address.province,
            country: address.country,
            postalCode: address.postalCode,
            latitude: address.latitude,
            longitude: address.longitude,
            userId: req.user.id,
          },
        },
      },
      include: {
        address: true,
        admin: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    // Audit log untuk create store
    logCreate(
      "Store",
      store.id,
      {
        name: store.name,
        phoneNumber: store.phoneNumber,
        openHour: store.openHour.toISOString(),
        closeHour: store.closeHour.toISOString(),
        adminId: store.adminId,
        address: {
          fullAddress: address.fullAddress,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
        },
      },
      req.user.id
    );

    res.status(201).json({
      message: "Store created successfully",
      store: store,
    });
  } catch (error) {
    console.error("Error creating store:", error);
    res.status(500).json({
      error: "Failed to create store",
      details: error.message,
    });
  }
});

/**
 * GET /store/all
 * Get all stores (active and non-deleted by default)
 * Query params: includeDeleted, includeInactive
 */
router.get("/get-all", authenticate, async (req, res) => {
  try {
    const { includeDeleted, includeInactive } = req.query;

    const whereClause = {};

    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const stores = await prisma.store.findMany({
      where: whereClause,
      include: {
        address: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      stores: stores,
      count: stores.length,
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({
      error: "Failed to fetch stores",
      details: error.message,
    });
  }
});

/**
 * GET /:id
 * Get a single store by ID
 */
router.get("/get-store/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        address: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    res.json({ store: store });
  } catch (error) {
    console.error("Error fetching store:", error);
    res.status(500).json({
      error: "Failed to fetch store",
      details: error.message,
    });
  }
});

/**
 * GET /:id/pickup-hours
 * Get available pickup time slots for a store
 */
router.get("/get-hours/:id/pickup-hours", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        openHour: true,
        closeHour: true,
        isActive: true,
        isDeleted: true,
      },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    if (store.isDeleted || !store.isActive) {
      return res.status(400).json({
        error: "Store is not available for pickup",
      });
    }

    const timeSlots = generatePickupTimeSlots(store.openHour, store.closeHour);

    res.json({
      storeId: store.id,
      storeName: store.name,
      openHour: store.openHour,
      closeHour: store.closeHour,
      pickupSlots: timeSlots,
      totalSlots: timeSlots.length,
    });
  } catch (error) {
    console.error("Error fetching pickup hours:", error);
    res.status(500).json({
      error: "Failed to fetch pickup hours",
      details: error.message,
    });
  }
});

/**
 * PUT /:id/update
 * Update store data (name, phone, hours, admin assignment)
 */
router.put("/update-store/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, openHour, closeHour, adminId } = req.body;

    // Check if store exists
    const existingStore = await prisma.store.findUnique({
      where: { id },
    });

    if (!existingStore) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    // Handle time updates
    if (openHour !== undefined) {
      updateData.openHour = new Date(openHour);
    }
    if (closeHour !== undefined) {
      updateData.closeHour = new Date(closeHour);
    }

    // Validate times if both are being updated or if one is new
    const finalOpenHour = updateData.openHour || existingStore.openHour;
    const finalCloseHour = updateData.closeHour || existingStore.closeHour;

    // Validate operating hours using new validation function
    const timeValidation = validateOperatingHours(
      finalOpenHour,
      finalCloseHour
    );
    if (!timeValidation.isValid) {
      return res.status(400).json({
        error: timeValidation.error,
      });
    }

    // Handle admin assignment
    if (adminId !== undefined) {
      if (adminId === null) {
        // Unassign admin
        updateData.adminId = null;
      } else {
        // Validate admin exists
        const admin = await prisma.user.findUnique({
          where: { id: adminId },
        });
        if (!admin) {
          return res.status(404).json({ error: "Admin user not found" });
        }
        updateData.adminId = adminId;
      }
    }

    // Update store
    const updatedStore = await prisma.store.update({
      where: { id },
      data: updateData,
      include: {
        address: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Audit log untuk update store
    const oldValues = {};
    const newValues = {};

    if (name !== undefined) {
      oldValues.name = existingStore.name;
      newValues.name = name;
    }
    if (phoneNumber !== undefined) {
      oldValues.phoneNumber = existingStore.phoneNumber;
      newValues.phoneNumber = phoneNumber;
    }
    if (updateData.openHour) {
      oldValues.openHour = existingStore.openHour.toISOString();
      newValues.openHour = updateData.openHour.toISOString();
    }
    if (updateData.closeHour) {
      oldValues.closeHour = existingStore.closeHour.toISOString();
      newValues.closeHour = updateData.closeHour.toISOString();
    }
    if (adminId !== undefined) {
      oldValues.adminId = existingStore.adminId;
      newValues.adminId = adminId;
    }

    logUpdate("Store", id, oldValues, newValues, req.user.id);

    res.json({
      message: "Store updated successfully",
      store: updatedStore,
    });
  } catch (error) {
    console.error("Error updating store:", error);
    res.status(500).json({
      error: "Failed to update store",
      details: error.message,
    });
  }
});

/**
 * PATCH /:id/assign-admin
 * Assign or reassign admin to a store
 */
router.patch("/assign-admin/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ error: "adminId is required" });
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Validate admin exists
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      include: { role: true },
    });

    if (!admin) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    // Update store admin
    const updatedStore = await prisma.store.update({
      where: { id },
      data: { adminId },
      include: {
        address: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    // Audit log untuk assign admin
    logUpdate(
      "Store",
      id,
      { adminId: store.adminId },
      { adminId: adminId, adminName: admin.name },
      req.user.id
    );

    res.json({
      message: "Admin assigned successfully",
      store: updatedStore,
    });
  } catch (error) {
    console.error("Error assigning admin:", error);
    res.status(500).json({
      error: "Failed to assign admin",
      details: error.message,
    });
  }
});

/**
 * PATCH /:id/unassign-admin
 * Remove admin from a store
 */
router.patch("/unassign-admin/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: { adminId: null },
      include: {
        address: true,
      },
    });

    // Audit log untuk unassign admin
    logUpdate(
      "Store",
      id,
      { adminId: store.adminId },
      { adminId: null },
      req.user.id
    );

    res.json({
      message: "Admin unassigned successfully",
      store: updatedStore,
    });
  } catch (error) {
    console.error("Error unassigning admin:", error);
    res.status(500).json({
      error: "Failed to unassign admin",
      details: error.message,
    });
  }
});

/**
 * PATCH /:id/toggle-active
 * Toggle store active status
 */
router.patch("/toggle-active/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        error: "isActive must be a boolean value",
      });
    }

    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: { isActive },
      include: {
        address: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Audit log untuk toggle active status
    logUpdate(
      "Store",
      id,
      { isActive: store.isActive },
      { isActive: isActive },
      req.user.id
    );

    res.json({
      message: `Store ${isActive ? "activated" : "deactivated"} successfully`,
      store: updatedStore,
    });
  } catch (error) {
    console.error("Error toggling store active status:", error);
    res.status(500).json({
      error: "Failed to toggle store active status",
      details: error.message,
    });
  }
});

/**
 * PATCH /:id/soft-delete
 * Soft delete a store (set isDeleted to true)
 */
router.patch("/soft-delete/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    if (store.isDeleted) {
      return res.status(400).json({ error: "Store is already deleted" });
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: { isDeleted: true },
      include: {
        address: true,
      },
    });

    // Audit log untuk soft delete store
    logDelete(
      "Store",
      id,
      {
        name: store.name,
        phoneNumber: store.phoneNumber,
        adminId: store.adminId,
        isDeleted: false,
      },
      req.user.id
    );

    res.json({
      message: "Store deleted successfully",
      store: updatedStore,
    });
  } catch (error) {
    console.error("Error deleting store:", error);
    res.status(500).json({
      error: "Failed to delete store",
      details: error.message,
    });
  }
});

/**
 * PATCH /:id/restore
 * Restore a soft-deleted store
 */
router.patch("/restore/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    if (!store.isDeleted) {
      return res.status(400).json({ error: "Store is not deleted" });
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: { isDeleted: false },
      include: {
        address: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Audit log untuk restore store
    logUpdate(
      "Store",
      id,
      { isDeleted: true },
      { isDeleted: false },
      req.user.id
    );

    res.json({
      message: "Store restored successfully",
      store: updatedStore,
    });
  } catch (error) {
    console.error("Error restoring store:", error);
    res.status(500).json({
      error: "Failed to restore store",
      details: error.message,
    });
  }
});

/**
 * DELETE /:id/permanent
 * Permanently delete a store and its address
 */
router.delete("/permanent/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        address: true,
      },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Audit log untuk permanent delete store (log sebelum delete)
    logDelete(
      "Store",
      id,
      {
        name: store.name,
        phoneNumber: store.phoneNumber,
        adminId: store.adminId,
        isDeleted: store.isDeleted,
        address: store.address
          ? {
              fullAddress: store.address.fullAddress,
              city: store.address.city,
              province: store.address.province,
            }
          : null,
        permanentDelete: true,
      },
      req.user.id
    );

    // Delete store (cascade will delete address)
    await prisma.store.delete({
      where: { id },
    });

    res.json({
      message: "Store permanently deleted",
      deletedStoreId: id,
    });
  } catch (error) {
    console.error("Error permanently deleting store:", error);
    res.status(500).json({
      error: "Failed to permanently delete store",
      details: error.message,
    });
  }
});

/**
 * GET /admin/:adminId
 * Get all stores managed by a specific admin
 */
router.get("/admin/:adminId", authenticate, async (req, res) => {
  try {
    const { adminId } = req.params;

    const stores = await prisma.store.findMany({
      where: {
        adminId,
        isDeleted: false,
      },
      include: {
        address: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      adminId,
      stores: stores,
      count: stores.length,
    });
  } catch (error) {
    console.error("Error fetching admin stores:", error);
    res.status(500).json({
      error: "Failed to fetch admin stores",
      details: error.message,
    });
  }
});

/**
 * GET /nearest
 * Get nearest stores to user's address
 * Query params: addressId (optional), latitude, longitude (optional if addressId provided)
 * Returns stores sorted by distance from user's location
 */
router.get("/nearest", authenticate, async (req, res) => {
  try {
    const { addressId, latitude, longitude, limit } = req.query;

    let userLat, userLng;

    // If addressId is provided, fetch the address
    if (addressId) {
      const address = await prisma.address.findUnique({
        where: { id: addressId },
      });

      if (!address) {
        return res.status(404).json({ error: "Address not found" });
      }

      userLat = address.latitude;
      userLng = address.longitude;
    } else if (latitude && longitude) {
      // Use provided coordinates
      userLat = parseFloat(latitude);
      userLng = parseFloat(longitude);

      if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({
          error: "Invalid latitude or longitude values",
        });
      }
    } else {
      return res.status(400).json({
        error: "Either addressId or both latitude and longitude are required",
      });
    }

    // Fetch all active, non-deleted stores with their addresses
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      include: {
        address: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Calculate distance for each store
    const storesWithDistance = stores.map((store) => {
      const distance = calculateDistance(
        userLat,
        userLng,
        store.address.latitude,
        store.address.longitude
      );

      return {
        ...store,
        distance: parseFloat(distance.toFixed(2)), // Distance in km with 2 decimal places
        distanceDisplay: `${distance.toFixed(2)} km`,
      };
    });

    // Sort by distance (nearest first)
    storesWithDistance.sort((a, b) => a.distance - b.distance);

    // Apply limit if provided
    const limitNumber = limit ? parseInt(limit) : storesWithDistance.length;
    const limitedStores = storesWithDistance.slice(0, limitNumber);

    res.json({
      userLocation: {
        latitude: userLat,
        longitude: userLng,
      },
      stores: limitedStores,
      count: limitedStores.length,
      totalStores: storesWithDistance.length,
    });
  } catch (error) {
    console.error("Error fetching nearest stores:", error);
    res.status(500).json({
      error: "Failed to fetch nearest stores",
      details: error.message,
    });
  }
});

/**
 * GET /by-location
 * Get all stores sorted by distance from user's current location (nearest to farthest)
 * Query params: latitude, longitude
 * Returns all active, non-deleted stores with distance information, sorted from nearest to farthest
 */
router.get("/by-location", authenticate, async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Both latitude and longitude are required",
      });
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        error: "Invalid latitude or longitude values",
      });
    }

    console.log("📍 Fetching stores by location:", {
      userLat,
      userLng,
    });

    // Fetch only active, non-deleted stores
    const stores = await prisma.store.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      include: {
        address: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    console.log(`✅ Found ${stores.length} stores`);

    // Calculate distance for each store
    const storesWithDistance = stores.map((store) => {
      const distance = calculateDistance(
        userLat,
        userLng,
        store.address.latitude,
        store.address.longitude
      );

      return {
        ...store,
        distance: parseFloat(distance.toFixed(2)), // Distance in km
        distanceDisplay: `${distance.toFixed(2)} km`,
      };
    });

    // Sort by distance (nearest to farthest)
    storesWithDistance.sort((a, b) => a.distance - b.distance);

    console.log(
      "📊 Stores sorted by distance:",
      storesWithDistance.map((s) => ({
        name: s.name,
        distance: s.distanceDisplay,
      }))
    );

    // Get current time from database
    const currentTimeResult =
      await prisma.$queryRaw`SELECT NOW() as current_time`;
    const currentTime = currentTimeResult[0].current_time;
    const currentHour = currentTime.getHours();

    console.log("🕐 Current database time:", {
      currentTime: currentTime.toISOString(),
      currentHour: currentHour,
    });

    res.json({
      userLocation: {
        latitude: userLat,
        longitude: userLng,
      },
      currentTime: currentTime,
      currentHour: currentHour,
      stores: storesWithDistance,
      count: storesWithDistance.length,
    });
  } catch (error) {
    console.error("❌ Error fetching stores by location:", error);
    res.status(500).json({
      error: "Failed to fetch stores by location",
      details: error.message,
    });
  }
});

export default router;
