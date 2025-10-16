import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate, authorize } from "../Middlewares/accessControl.js";
import { logUpdate } from "../../utils/auditlog.js";

// ==================== HELPER FUNCTIONS ====================

const calculateDateRange = (range, customStart, customEnd) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let start,
    end = today;

  if (range === "week") {
    start = new Date(today);
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (range === "month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
  } else if (range === "custom" && customStart && customEnd) {
    start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(today);
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  }

  return { start, end };
};

// ==================== DASHBOARD STATISTICS ====================

/**
 * GET /admin/dashboard/stats
 * Get dashboard statistics for store admin
 * Returns: total orders today, pending preparation, active disputes, active couriers, today & weekly revenue
 */
router.get("/admin/dashboard/stats", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get admin's store
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: { managedStores: true },
    });

    if (!admin || !admin.managedStores || admin.managedStores.length === 0) {
      return res.status(404).json({
        error: "Admin store not found. This user is not assigned to any store.",
      });
    }

    const storeId = admin.managedStores[0].id;

    // Define date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6); // last 7 days (today included)

    // Run queries in parallel for performance
    const [
      totalOrdersToday,
      pendingPreparation,
      activeDisputes,
      activeCouriers,
      todayOrders,
      weeklyOrders,
    ] = await Promise.all([
      // 1. Total orders created today
      prisma.order.count({
        where: {
          pickupStoreId: storeId,
          createdAt: { gte: today, lt: tomorrow },
        },
      }),

      // 2. Pending preparation count
      prisma.order.count({
        where: {
          pickupStoreId: storeId,
          orderStatus: "PENDING",
        },
      }),

      // 3. Active disputes
      prisma.order.count({
        where: {
          pickupStoreId: storeId,
          orderStatus: "DISPUTED",
        },
      }),

      // 4. Active couriers
      prisma.order.findMany({
        where: {
          pickupStoreId: storeId,
          orderStatus: { in: ["OUT_FOR_DELIVERY", "READY_FOR_PICKUP"] },
          courierId: { not: null },
        },
        select: { courierId: true },
        distinct: ["courierId"],
      }),

      // 5. Orders today for revenue calculation
      prisma.order.findMany({
        where: {
          pickupStoreId: storeId,
          createdAt: { gte: today, lt: tomorrow },
          paymentStatus: "COMPLETED",
        },
        select: {
          subtotal: true,
          deliveryFee: true,
        },
      }),

      // 6. Orders this week for revenue calculation
      prisma.order.findMany({
        where: {
          pickupStoreId: storeId,
          createdAt: { gte: weekStart, lt: tomorrow },
          paymentStatus: "COMPLETED",
        },
        select: {
          createdAt: true,
          subtotal: true,
          deliveryFee: true,
        },
      }),
    ]);

    // === Revenue calculations ===

    // Today's revenue (subtotal + deliveryFee)
    const todayRevenue = todayOrders.reduce((sum, order) => {
      const subtotal = Number(order.subtotal) || 0;
      const deliveryFee = Number(order.deliveryFee) || 0;
      return sum + subtotal + deliveryFee;
    }, 0);

    // Weekly revenue (subtotal + deliveryFee)
    const dailyRevenueMap = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      dailyRevenueMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
    }

    let weeklyRevenueTotal = 0;
    weeklyOrders.forEach((order) => {
      const dateStr = new Date(order.createdAt).toISOString().split("T")[0];
      const subtotal = Number(order.subtotal) || 0;
      const deliveryFee = Number(order.deliveryFee) || 0;
      const total = subtotal + deliveryFee;

      weeklyRevenueTotal += total;

      if (dailyRevenueMap[dateStr]) {
        dailyRevenueMap[dateStr].revenue += total;
        dailyRevenueMap[dateStr].orders += 1;
      }
    });

    // === Response ===
    return res.json({
      success: true,
      data: {
        totalOrdersToday,
        pendingPreparation,
        activeDisputes,
        activeCouriersCount: activeCouriers.length,
        todayRevenue,
        weeklyRevenue: weeklyRevenueTotal,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      error: "Failed to fetch dashboard statistics",
      details: error.message,
    });
  }
});

// ==================== RECENT ORDERS ====================

/**
 * GET /admin/dashboard/recent-orders
 * Get recent orders for the admin's store
 * Query params: limit (default: 5)
 */
router.get("/admin/dashboard/recent-orders", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    // Get admin's store
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        managedStores: true,
      },
    });

    if (!admin || !admin.managedStores || admin.managedStores.length === 0) {
      return res.status(404).json({
        error: "Admin store not found",
      });
    }

    const storeId = admin.managedStores[0].storeId;

    // Get recent orders
    const orders = await prisma.order.findMany({
      where: {
        pickupStoreId: storeId,
      },
      select: {
        id: true,
        orderStatus: true,
        subtotal: true,
        orderItems: true,
        changeAmount: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const parsedOrders = orders.map((order) => ({
      ...order,
      orderItems:
        typeof order.orderItems === "string"
          ? JSON.parse(order.orderItems)
          : order.orderItems || [],
    }));

    res.json({
      success: true,
      data: parsedOrders,
    });
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({
      error: "Failed to fetch recent orders",
      details: error.message,
    });
  }
});

// ==================== URGENT ISSUES ====================

/**
 * GET /admin/dashboard/urgent-issues
 * Get urgent issues (pending orders + high priority disputes)
 */
router.get("/admin/dashboard/urgent-issues", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    // Get admin's managed store
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        managedStores: true,
      },
    });

    if (!admin || !admin.managedStores || admin.managedStores.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Admin store not found",
      });
    }

    const storeId = admin.managedStores[0].id;

    // Get pending preparation orders (tanpa include orderItems)
    const pendingOrders = await prisma.order.findMany({
      where: {
        pickupStoreId: storeId,
        orderStatus: "PENDING",
      },
      select: {
        id: true,
        orderStatus: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
        orderItems: true, // JSON field, bukan relasi
      },
      orderBy: {
        createdAt: "asc",
      },
      take: limit,
    });

    // Parse JSON field "orderItems"
    const parsedOrders = pendingOrders.map((order) => ({
      ...order,
      orderItems:
        typeof order.orderItems === "string"
          ? JSON.parse(order.orderItems)
          : order.orderItems || [],
    }));

    // Get high priority disputes
    const disputes = await prisma.dispute.findMany({
      where: {
        order: {
          pickupStoreId: storeId,
        },
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderStatus: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    // ✅ Final response
    res.status(200).json({
      success: true,
      data: {
        pendingOrders: parsedOrders,
        disputes,
        pendingOrdersCount: parsedOrders.length,
        disputesCount: disputes.length,
      },
    });
  } catch (error) {
    console.error("Error fetching urgent issues:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch urgent issues",
      details: error.message,
    });
  }
});

// ==================== ORDER MANAGEMENT ====================

/**
 * GET /admin/orders
 * Get all orders for admin's store with pagination and filtering
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 *   - status: Filter by order status (optional)
 */
router.get("/get-all/orders", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const statusFilter = req.query.status;

    // Validate page and limit
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.",
      });
    }

    // Get admin's managed store
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        managedStores: true,
      },
    });

    if (!admin || !admin.managedStores || admin.managedStores.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Admin store not found. This user is not assigned to any store.",
      });
    }

    const storeId = admin.managedStores[0].id;

    // Define allowed statuses for filtering
    const allowedStatuses = [
      "PENDING",
      "IN_PREPARATION",
      "PREPARED",
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
      "ARRIVED_AT_DESTINATION",
      "DELIVERED",
      "GRACE_PERIOD",
      "COMPLETED",
      "CANCELED",
      "DISPUTED",
    ];

    // Build where clause
    const whereClause = {
      pickupStoreId: storeId,
      orderStatus: {
        in: allowedStatuses,
      },
    };

    // Apply status filter if provided
    if (statusFilter) {
      if (!allowedStatuses.includes(statusFilter)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status filter. Allowed statuses: ${allowedStatuses.join(
            ", "
          )}`,
        });
      }

      // Special handling for "COMPLETED" - include both COMPLETED and GRACE_PERIOD
      if (statusFilter === "COMPLETED") {
        whereClause.orderStatus = {
          in: ["COMPLETED", "GRACE_PERIOD"],
        };
      } else {
        whereClause.orderStatus = statusFilter;
      }
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch orders and total count in parallel
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        select: {
          id: true,
          orderStatus: true,
          paymentStatus: true,
          subtotal: true,
          deliveryFee: true,
          cashAmount: true,
          changeAmount: true,
          deliveryType: true,
          orderItems: true,
          createdAt: true,
          updatedAt: true,
          courier: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          deliveryAddress: {
            select: {
              id: true,
              recipientName: true,
              recipientPhone: true,
              fullAddress: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: skip,
        take: limit,
      }),
      prisma.order.count({
        where: whereClause,
      }),
    ]);

    // Parse orderItems JSON field
    const parsedOrders = orders.map((order) => ({
      ...order,
      orderItems:
        typeof order.orderItems === "string"
          ? JSON.parse(order.orderItems)
          : order.orderItems || [],
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.status(200).json({
      success: true,
      data: parsedOrders,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalCount,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
      details: error.message,
    });
  }
});

/**
 * PATCH /admin/orders/:orderId/status
 * Update order status (admin workflow transitions)
 * Allowed transitions:
 *   - PENDING -> IN_PREPARATION
 *   - IN_PREPARATION -> PREPARED
 *   - PREPARED -> READY_FOR_PICKUP
 * Body: { newStatus: string }
 */
router.patch(
  "/update-status/orders/:orderId",
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;
      const { newStatus } = req.body;

      // Validate input
      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: "Order ID is required",
        });
      }

      if (!newStatus) {
        return res.status(400).json({
          success: false,
          error: "New status is required in request body",
        });
      }

      // Get admin's managed store
      const admin = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          managedStores: true,
        },
      });

      if (!admin || !admin.managedStores || admin.managedStores.length === 0) {
        return res.status(404).json({
          success: false,
          error:
            "Admin store not found. This user is not assigned to any store.",
        });
      }

      const storeId = admin.managedStores[0].id;

      // Fetch the order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderStatus: true,
          pickupStoreId: true,
        },
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
        });
      }

      // Verify order belongs to admin's store
      if (order.pickupStoreId !== storeId) {
        return res.status(403).json({
          success: false,
          error: "You do not have permission to update this order",
        });
      }

      // Define allowed status transitions
      const allowedTransitions = {
        PENDING: ["IN_PREPARATION"],
        IN_PREPARATION: ["PREPARED"],
        PREPARED: ["READY_FOR_PICKUP"],
      };

      const currentStatus = order.orderStatus;

      // Check if transition is allowed
      if (!allowedTransitions[currentStatus]) {
        return res.status(400).json({
          success: false,
          error: `Cannot update order from status ${currentStatus}. This status cannot be changed by admin.`,
        });
      }

      if (!allowedTransitions[currentStatus].includes(newStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status transition. From ${currentStatus}, you can only change to: ${allowedTransitions[
            currentStatus
          ].join(", ")}`,
        });
      }

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: newStatus,
          updatedAt: new Date(),
        },
      });

      // Log order status update
      logUpdate(
        "Order",
        orderId,
        { orderStatus: currentStatus },
        { orderStatus: newStatus },
        userId
      );

      res.status(200).json({
        success: true,
        message: `Order status successfully updated from ${currentStatus} to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update order status",
        details: error.message,
      });
    }
  }
);

// ==================== COURIER MANAGEMENT ====================

/**
 * GET /admin/couriers/workspace
 * Get all couriers whose workspace includes store's postal code
 * Returns: List of couriers with their work area postal codes
 */
router.get("/couriers/workspace", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get admin's managed store
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        managedStores: {
          include: {
            address: true, // Get store address with postal code
          },
        },
      },
    });

    if (!admin || !admin.managedStores || admin.managedStores.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Admin store not found. This user is not assigned to any store.",
      });
    }

    const store = admin.managedStores[0];
    const storePostalCode = store.address.postalCode;

    // Find all couriers with role "courier" whose workAreaPostalCodes contains store postal code
    const courierRole = await prisma.role.findUnique({
      where: { roleType: "courier" },
    });

    if (!courierRole) {
      return res.status(404).json({
        success: false,
        error: "Courier role not found in system",
      });
    }

    // Get couriers whose workspace includes store postal code
    const couriers = await prisma.user.findMany({
      where: {
        roleId: courierRole.id,
        isDeleted: false,
        workAreaPostalCodes: {
          has: storePostalCode, // Array contains operator
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        workAreaPostalCodes: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        couriers,
        storePostalCode,
        totalCouriers: couriers.length,
      },
    });
  } catch (error) {
    console.error("Error fetching couriers by workspace:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch couriers by workspace",
      details: error.message,
    });
  }
});

// ==================== COURIER TRACKING ====================

/**
 * GET /admin/couriers/active-deliveries
 * Get couriers with their active deliveries (with pagination and filtering)
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 *   - status: Filter by courier status (optional: "active", "available")
 *     - "active" = couriers with assigned orders
 *     - "available" = couriers without assigned orders
 * Returns: List of couriers with their active delivery count and details
 */
router.get("/couriers/active-deliveries", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const statusFilter = req.query.status; // "active", "available", or undefined

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.",
      });
    }

    // Validate status filter
    if (statusFilter && !["active", "available"].includes(statusFilter)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status filter. Allowed values: "active", "available"',
      });
    }

    // Get admin's managed store
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        managedStores: {
          include: {
            address: true,
          },
        },
      },
    });

    if (!admin || !admin.managedStores || admin.managedStores.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Admin store not found. This user is not assigned to any store.",
      });
    }

    const storeId = admin.managedStores[0].id;
    const storePostalCode = admin.managedStores[0].address.postalCode;

    // Get courier role
    const courierRole = await prisma.role.findUnique({
      where: { roleType: "courier" },
    });

    if (!courierRole) {
      return res.status(404).json({
        success: false,
        error: "Courier role not found in system",
      });
    }

    // Define active order statuses (courier-relevant)
    const activeOrderStatuses = [
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
      "ARRIVED_AT_DESTINATION",
    ];

    // Get all couriers in workspace
    const allCouriersInWorkspace = await prisma.user.findMany({
      where: {
        roleId: courierRole.id,
        isDeleted: false,
        workAreaPostalCodes: {
          has: storePostalCode,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        workAreaPostalCodes: true,
      },
    });

    // Get all active orders with couriers
    const activeOrders = await prisma.order.findMany({
      where: {
        pickupStoreId: storeId,
        orderStatus: {
          in: activeOrderStatuses,
        },
        courierId: {
          not: null,
        },
      },
      select: {
        id: true,
        orderStatus: true,
        deliveryType: true,
        subtotal: true,
        deliveryFee: true,
        orderItems: true,
        createdAt: true,
        courier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            workAreaPostalCodes: true,
          },
        },
        deliveryAddress: {
          select: {
            recipientName: true,
            fullAddress: true,
            postalCode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse orderItems
    const parsedOrders = activeOrders.map((order) => ({
      ...order,
      orderItems:
        typeof order.orderItems === "string"
          ? JSON.parse(order.orderItems)
          : order.orderItems || [],
    }));

    // Group orders by courier (active couriers)
    const activeCourierMap = new Map();

    parsedOrders.forEach((order) => {
      const courierId = order.courier.id;

      if (!activeCourierMap.has(courierId)) {
        activeCourierMap.set(courierId, {
          id: order.courier.id,
          name: order.courier.name,
          email: order.courier.email,
          phone: order.courier.phone,
          workAreaPostalCodes: order.courier.workAreaPostalCodes,
          status: "active",
          activeDeliveries: [],
          activeDeliveriesCount: 0,
        });
      }

      const courierData = activeCourierMap.get(courierId);
      courierData.activeDeliveries.push({
        orderId: order.id,
        orderStatus: order.orderStatus,
        deliveryType: order.deliveryType,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        orderItems: order.orderItems,
        createdAt: order.createdAt,
        deliveryAddress: order.deliveryAddress,
      });
      courierData.activeDeliveriesCount++;
    });

    // Get available couriers (couriers without active orders)
    const availableCouriers = allCouriersInWorkspace
      .filter((courier) => !activeCourierMap.has(courier.id))
      .map((courier) => ({
        ...courier,
        status: "available",
        activeDeliveries: [],
        activeDeliveriesCount: 0,
      }));

    // Combine based on filter
    let allCouriers = [];

    if (statusFilter === "active") {
      allCouriers = Array.from(activeCourierMap.values());
    } else if (statusFilter === "available") {
      allCouriers = availableCouriers;
    } else {
      // No filter: return all (active + available)
      allCouriers = [
        ...Array.from(activeCourierMap.values()),
        ...availableCouriers,
      ];
    }

    // Sort by name
    allCouriers.sort((a, b) => a.name.localeCompare(b.name));

    // Apply pagination
    const totalItems = allCouriers.length;
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;
    const paginatedCouriers = allCouriers.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: {
        couriers: paginatedCouriers,
        totalActiveCouriers: activeCourierMap.size,
        totalAvailableCouriers: availableCouriers.length,
        totalActiveOrders: parsedOrders.length,
      },
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalItems,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching couriers with active deliveries:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch couriers with active deliveries",
      details: error.message,
    });
  }
});

// ==================== SEARCH ====================

/**
 * GET /admin/search
 * Search orders by orderId, courierId, courier name, or disputeId
 * Returns only order IDs for lightweight response
 *
 * Query params:
 *  - q: Search query (minimum 2 characters)
 *
 * Search criteria:
 *  - If UUID format: searches orderId, courierId, and disputeId (exact match)
 *  - If string: searches courier name (case-insensitive contains)
 */
router.get("/search-things", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const searchQuery = req.query.q?.trim();

    // 🔹 Validasi search query
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: "Search query is required. Use 'q' query parameter.",
      });
    }

    if (searchQuery.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query must be at least 2 characters long.",
      });
    }

    // 🔹 Ambil store admin
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: { managedStores: true },
    });

    if (!admin?.managedStores?.[0]) {
      return res.status(404).json({
        success: false,
        error: "Admin store not found. This user is not assigned to any store.",
      });
    }

    const storeId = admin.managedStores[0].id;

    // 🔹 Cek apakah query adalah UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(searchQuery);

    // ================================
    // 🔍 1️⃣ SEARCH COURIERS
    // ================================
    let courierResults = [];
    if (isUUID) {
      // Search by courier ID
      courierResults = await prisma.user.findMany({
        where: {
          id: searchQuery,
          role: {
            roleType: "courier",
          },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      });
    } else {
      // Search by courier name (partial match)
      courierResults = await prisma.user.findMany({
        where: {
          role: {
            roleType: "courier",
          },
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
        },
      });
    }

    // ================================
    // 🔍 2️⃣ SEARCH DISPUTES
    // ================================
    let disputeResults = [];
    if (isUUID) {
      disputeResults = await prisma.dispute.findMany({
        where: {
          OR: [
            { id: searchQuery },
            { orderId: searchQuery },
            {
              order: {
                courierId: searchQuery,
              },
            },
          ],
          order: {
            pickupStoreId: storeId,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });
    } else {
      // Dispute tidak bisa dicari by string, skip
      disputeResults = [];
    }

    // ================================
    // 🔍 3️⃣ SEARCH ORDERS
    // ================================
    let orderResults = [];
    if (isUUID) {
      orderResults = await prisma.order.findMany({
        where: {
          pickupStoreId: storeId,
          OR: [
            { id: searchQuery },
            { courierId: searchQuery },
            {
              user: {
                id: searchQuery,
              },
            },
          ],
        },
        select: {
          id: true,
          orderStatus: true,
        },
      });
    } else {
      // Search orders by courier name (partial match)
      orderResults = await prisma.order.findMany({
        where: {
          pickupStoreId: storeId,
          courier: {
            name: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
        },
        select: {
          id: true,
          orderStatus: true,
        },
      });
    }

    // ================================
    // 📦 FINAL RESPONSE
    // ================================
    const totalResults =
      courierResults.length + disputeResults.length + orderResults.length;

    res.status(200).json({
      success: true,
      data: {
        couriers: courierResults,
        disputes: disputeResults,
        orders: orderResults,
      },
      meta: {
        totalResults,
        searchQuery,
        searchType: isUUID ? "uuid" : "string",
      },
    });
  } catch (error) {
    console.error("Error searching data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search data",
      details: error.message,
    });
  }
});

// ==================== SALES ANALYTICS ====================

/**
 * GET /admin/analytics/summary
 * Get sales analytics summary with gross revenue metrics
 *
 * Query params:
 *  - dateRange: "week" | "month" | "custom"
 *  - startDate: ISO date (required if custom)
 *  - endDate: ISO date (required if custom)
 */
router.get("/analytics/summary", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateRange, startDate, endDate } = req.query;

    // Get admin's store
    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: { managedStores: true },
    });

    if (!admin?.managedStores?.[0]) {
      return res.status(404).json({
        error: "Admin store not found",
      });
    }

    const storeId = admin.managedStores[0].id;

    // Calculate date range
    const { start, end } = calculateDateRange(dateRange, startDate, endDate);

    // Query orders with paymentStatus COMPLETED
    const orders = await prisma.order.findMany({
      where: {
        pickupStoreId: storeId,
        paymentStatus: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
      select: {
        subtotal: true,
        deliveryFee: true,
      },
    });

    // Calculate metrics
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.subtotal) + Number(o.deliveryFee),
      0
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const averageDailyRevenue = totalRevenue / days;

    return res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        averageDailyRevenue,
        revenueType: "gross",
        dateRange: { start, end },
      },
    });
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /admin/analytics/daily-sales
 * Get daily sales data for revenue and order charts
 */
router.get("/analytics/daily-sales", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateRange, startDate, endDate } = req.query;

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: { managedStores: true },
    });

    if (!admin?.managedStores?.[0]) {
      return res.status(404).json({ error: "Admin store not found" });
    }

    const storeId = admin.managedStores[0].id;
    const { start, end } = calculateDateRange(dateRange, startDate, endDate);

    // Get all orders in range
    const orders = await prisma.order.findMany({
      where: {
        pickupStoreId: storeId,
        paymentStatus: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
      select: {
        subtotal: true,
        deliveryFee: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const dailyMap = new Map();

    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      const revenue = Number(order.subtotal) + Number(order.deliveryFee);

      if (dailyMap.has(date)) {
        const existing = dailyMap.get(date);
        dailyMap.set(date, {
          date,
          revenue: existing.revenue + revenue,
          orders: existing.orders + 1,
        });
      } else {
        dailyMap.set(date, { date, revenue, orders: 1 });
      }
    });

    const dailySales = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return res.json({
      success: true,
      data: dailySales,
    });
  } catch (error) {
    console.error("Error fetching daily sales:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /admin/analytics/export-data
 * Get complete sales data for Excel export
 */
router.get("/analytics/export-data", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dateRange, startDate, endDate } = req.query;

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      include: { managedStores: true },
    });

    if (!admin?.managedStores?.[0]) {
      return res.status(404).json({ error: "Admin store not found" });
    }

    const storeId = admin.managedStores[0].id;
    const { start, end } = calculateDateRange(dateRange, startDate, endDate);

    // Get orders with items
    const orders = await prisma.order.findMany({
      where: {
        pickupStoreId: storeId,
        paymentStatus: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        subtotal: true,
        deliveryFee: true,
        orderItems: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate summary
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.subtotal) + Number(o.deliveryFee),
      0
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const averageDailyRevenue = totalRevenue / days;

    // Daily breakdown
    const dailyMap = new Map();
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      const revenue = Number(order.subtotal) + Number(order.deliveryFee);

      if (dailyMap.has(date)) {
        const existing = dailyMap.get(date);
        dailyMap.set(date, {
          date,
          revenue: existing.revenue + revenue,
          ordersCount: existing.ordersCount + 1,
        });
      } else {
        dailyMap.set(date, { date, revenue, ordersCount: 1 });
      }
    });

    const dailyBreakdown = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        averageOrderValue:
          item.ordersCount > 0 ? item.revenue / item.ordersCount : 0,
      }));

    // Detailed items (condensed per order)
    const detailedItems = orders.map((order) => {
      const items = Array.isArray(order.orderItems) ? order.orderItems : [];
      const itemsText = items
        .map(
          (item) =>
            `${item.productName} (${item.quantity}x @ ${item.pricePerItem})`
        )
        .join(", ");

      return {
        date: order.createdAt.toISOString().split("T")[0],
        orderId: order.id,
        items: itemsText,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        totalPrice: Number(order.subtotal) + Number(order.deliveryFee),
      };
    });

    return res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          averageDailyRevenue,
          revenueType: "gross",
          periodStart: start.toISOString().split("T")[0],
          periodEnd: end.toISOString().split("T")[0],
        },
        dailyBreakdown,
        detailedItems,
      },
    });
  } catch (error) {
    console.error("Error fetching export data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
