import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate } from "../Middlewares/accessControl.js";
import { logCreate, logUpdate } from "../../utils/auditlog.js";

// ==================== DISPUTE MANAGEMENT ====================

/**
 * POST /disputes/submit-dispute
 * Create a new dispute for an order (Customer endpoint)
 * Actions performed:
 *   1. Create dispute record with PENDING status
 *   2. Update order status to DISPUTED
 * Body: {
 *   orderId: string (required)
 *   reason: DisputeReason (required) - WRONG_ITEM, DAMAGED_ITEM, MISSING_ITEM, LATE_DELIVERY, POOR_QUALITY, OTHER
 *   description: string (required)
 *   imageUrl: string[] (optional)
 * }
 */
router.post("/submit-dispute", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, reason, description, imageUrl } = req.body;

    // Validate required fields
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: "Dispute reason is required",
      });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Description is required",
      });
    }

    // Validate reason enum
    const validReasons = [
      "WRONG_ITEM",
      "DAMAGED_ITEM",
      "MISSING_ITEM",
      "LATE_DELIVERY",
      "POOR_QUALITY",
      "OTHER",
    ];

    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        error: `Invalid dispute reason. Allowed values: ${validReasons.join(
          ", "
        )}`,
      });
    }

    // Validate evidence for OTHER reason
    // If reason is OTHER, imageUrl must be provided and not empty
    const hasValidEvidence =
      imageUrl && Array.isArray(imageUrl) && imageUrl.length > 0;

    if (reason === "OTHER" && !hasValidEvidence) {
      return res.status(400).json({
        success: false,
        error:
          "Bukti (foto/gambar) wajib disertakan untuk dispute dengan alasan OTHER. Silakan upload minimal 1 foto sebagai bukti.",
      });
    }

    // Check if order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
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

    // Verify order belongs to user
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to dispute this order",
      });
    }

    // Check order status - can only dispute delivered or completed orders
    const allowedOrderStatuses = ["DELIVERED", "COMPLETED"];
    if (!allowedOrderStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        error: `Cannot dispute order with status ${order.orderStatus}. Orders can only be disputed after delivery (DELIVERED or COMPLETED status).`,
      });
    }

    // Check if dispute already exists for this order
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        orderId: orderId,
      },
    });

    if (existingDispute) {
      return res.status(400).json({
        success: false,
        error: "A dispute already exists for this order",
        disputeId: existingDispute.id,
      });
    }

    // Use transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Create dispute
      const newDispute = await tx.dispute.create({
        data: {
          orderId: orderId,
          userId: userId,
          reason: reason,
          description: description.trim(),
          imageUrl: imageUrl || [],
          status: "PENDING",
        },
        select: {
          id: true,
          reason: true,
          status: true,
          description: true,
          imageUrl: true,
          createdAt: true,
          order: {
            select: {
              id: true,
              orderStatus: true,
              subtotal: true,
              deliveryFee: true,
              orderItems: true,
            },
          },
        },
      });

      // Update order status to DISPUTED
      await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: "DISPUTED",
          updatedAt: new Date(),
        },
      });

      return newDispute;
    });

    // Audit log untuk create dispute
    logCreate(
      "Dispute",
      result.id,
      {
        reason: result.reason,
        status: result.status,
        description: result.description,
        orderId: orderId,
      },
      userId
    );

    // Audit log untuk update order status ke DISPUTED
    logUpdate(
      "Order",
      orderId,
      { orderStatus: order.orderStatus },
      { orderStatus: "DISPUTED" },
      userId
    );

    // Parse orderItems
    const parsedDispute = {
      ...result,
      order: {
        ...result.order,
        orderItems:
          typeof result.order.orderItems === "string"
            ? JSON.parse(result.order.orderItems)
            : result.order.orderItems || [],
      },
    };

    res.status(201).json({
      success: true,
      message: "Dispute created successfully",
      data: parsedDispute,
    });
  } catch (error) {
    console.error("Error creating dispute:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create dispute",
      details: error.message,
    });
  }
});

// ==================== ADMIN DISPUTE MANAGEMENT ====================

/**
 * GET /admin/get-all/disputes
 * Get all disputes for admin's store with pagination and filtering
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 *   - status: Filter by dispute status (optional: PENDING, IN_PROGRESS, RESOLVED, REJECTED)
 */
router.get("/get-all/disputes", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const statusFilter = req.query.status;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.",
      });
    }

    // Validate status filter
    const validStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"];
    if (statusFilter && !validStatuses.includes(statusFilter)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status filter. Allowed values: ${validStatuses.join(
          ", "
        )}`,
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

    // Build where clause
    const whereClause = {
      order: {
        pickupStoreId: storeId,
      },
    };

    // Apply status filter if provided
    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch disputes and total count in parallel
    const [
      disputes,
      totalCount,
      totalDisputesCount,
      resolvedDisputesCount,
      openCasesCount,
    ] = await Promise.all([
      prisma.dispute.findMany({
        where: whereClause,
        select: {
          id: true,
          reason: true,
          status: true,
          description: true,
          response: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true,
          order: {
            select: {
              id: true,
              orderStatus: true,
              subtotal: true,
              deliveryFee: true,
              orderItems: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          user: {
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
        skip: skip,
        take: limit,
      }),
      prisma.dispute.count({
        where: whereClause,
      }),
      // 🧮 total disputes for this store
      prisma.dispute.count({
        where: { order: { pickupStoreId: storeId } },
      }),

      // ✅ resolved disputes count
      prisma.dispute.count({
        where: {
          order: { pickupStoreId: storeId },
          status: "RESOLVED",
        },
      }),

      // 🚨 open cases (PENDING + IN_PROGRESS)
      prisma.dispute.count({
        where: {
          order: { pickupStoreId: storeId },
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),
    ]);

    // Parse orderItems JSON field
    const parsedDisputes = disputes.map((dispute) => ({
      ...dispute,
      order: {
        ...dispute.order,
        orderItems:
          typeof dispute.order.orderItems === "string"
            ? JSON.parse(dispute.order.orderItems)
            : dispute.order.orderItems || [],
      },
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        disputes: parsedDisputes,
        counts: {
          total: totalDisputesCount,
          resolved: resolvedDisputesCount,
          openCases: openCasesCount,
        },
      },
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
    console.error("Error fetching disputes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch disputes",
      details: error.message,
    });
  }
});

/**
 * PATCH /disputes/:disputeId/status
 * Update dispute status (Admin endpoint)
 * Allowed transitions:
 *   - PENDING -> IN_PROGRESS (admin confirms dispute)
 *   - PENDING -> REJECTED (admin rejects without investigation)
 *   - IN_PROGRESS -> REJECTED (admin rejects after investigation)
 * Note: Use /resolve-dispute/:disputeId to change status to RESOLVED
 * Body: { newStatus: string }
 */
router.patch("/update-status/:disputeId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { disputeId } = req.params;
    const { newStatus } = req.body;

    // Validate input
    if (!disputeId) {
      return res.status(400).json({
        success: false,
        error: "Dispute ID is required",
      });
    }

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        error: "New status is required in request body",
      });
    }

    // Validate status value (RESOLVED is not allowed in this endpoint)
    const validStatuses = ["PENDING", "IN_PROGRESS", "REJECTED"];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed values: ${validStatuses.join(", ")}. `,
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

    // Fetch the dispute with order info
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        status: true,
        order: {
          select: {
            id: true,
            pickupStoreId: true,
          },
        },
      },
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        error: "Dispute not found",
      });
    }

    // Verify dispute belongs to admin's store
    if (dispute.order.pickupStoreId !== storeId) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to update this dispute",
      });
    }

    const currentStatus = dispute.status;

    // Define allowed status transitions (RESOLVED is handled by /resolve-dispute endpoint)
    const allowedTransitions = {
      PENDING: ["IN_PROGRESS", "REJECTED"],
      IN_PROGRESS: ["REJECTED"], // Removed RESOLVED - use /resolve-dispute instead
      RESOLVED: [], // Cannot change from RESOLVED
      REJECTED: [], // Cannot change from REJECTED
    };

    // Check if transition is allowed
    if (!allowedTransitions[currentStatus]) {
      return res.status(400).json({
        success: false,
        error: `Cannot update dispute from status ${currentStatus}. This status is final.`,
      });
    }

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status transition. From ${currentStatus}, you can only change to: ${allowedTransitions[
          currentStatus
        ].join(", ")}.`,
      });
    }

    // Prepare update data
    const updateData = {
      status: newStatus,
      updatedAt: new Date(),
    };

    // Update dispute status
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: updateData,
      select: {
        id: true,
        status: true,
        resolvedAt: true,
        updatedAt: true,
      },
    });

    // Audit log untuk update dispute status
    logUpdate(
      "Dispute",
      disputeId,
      { status: currentStatus },
      { status: newStatus },
      userId
    );

    res.status(200).json({
      success: true,
      message: `Dispute status successfully updated from ${currentStatus} to ${newStatus}`,
      data: updatedDispute,
    });
  } catch (error) {
    console.error("Error updating dispute status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update dispute status",
      details: error.message,
    });
  }
});

/**
 * PATCH /disputes/:disputeId/resolve
 * Resolve dispute with admin response (Admin endpoint)
 * Body: { response: string }
 */
router.patch("/resolve-dispute/:disputeId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { disputeId } = req.params;
    const { response } = req.body;

    // Validate input
    if (!disputeId) {
      return res.status(400).json({
        success: false,
        error: "Dispute ID is required",
      });
    }

    if (!response || response.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Admin response is required",
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

    // Fetch the dispute with order info
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        status: true,
        response: true,
        order: {
          select: {
            id: true,
            pickupStoreId: true,
          },
        },
      },
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        error: "Dispute not found",
      });
    }

    // Verify dispute belongs to admin's store
    if (dispute.order.pickupStoreId !== storeId) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to resolve this dispute",
      });
    }

    // Check if dispute can be resolved (must be IN_PROGRESS)
    if (dispute.status !== "IN_PROGRESS") {
      return res.status(400).json({
        success: false,
        error: `Cannot resolve dispute with status ${dispute.status}. Dispute must be IN_PROGRESS to be resolved.`,
      });
    }

    // Update dispute with response and change status to RESOLVED
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        response: response.trim(),
        status: "RESOLVED",
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        response: true,
        resolvedAt: true,
        updatedAt: true,
      },
    });

    // Audit log untuk resolve dispute
    logUpdate(
      "Dispute",
      disputeId,
      { status: dispute.status },
      {
        status: "RESOLVED",
        response: response.trim(),
        resolvedAt: updatedDispute.resolvedAt.toISOString(),
      },
      userId
    );

    res.status(200).json({
      success: true,
      message: "Dispute successfully resolved with admin response",
      data: updatedDispute,
    });
  } catch (error) {
    console.error("Error resolving dispute:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resolve dispute",
      details: error.message,
    });
  }
});

export default router;
