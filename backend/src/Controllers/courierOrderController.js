import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate, authorize } from "../Middlewares/accessControl.js";
import { getIO } from "../../utils/socket.js";
import { logCreate, logUpdate } from "../../utils/auditlog.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Configure multer for delivery proof photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/delivery-proofs";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "delivery-proof-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * Update order status by courier
 * PUT /orders/:orderId/status
 *
 * Courier can update status through these transitions:
 * IN_PREPARATION -> READY_FOR_PICKUP
 * READY_FOR_PICKUP -> OUT_FOR_DELIVERY
 * OUT_FOR_DELIVERY -> DELIVERED
 * DELIVERED -> COMPLETED (after delivery proof uploaded)
 */
router.put("/:orderId/status", authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newStatus, notes } = req.body;
    const courierId = req.user.id;

    // Validasi input
    if (!newStatus) {
      return res.status(400).json({
        message: "New status is required",
      });
    }

    // Valid status transitions for courier
    const validStatuses = [
      "IN_PREPARATION",
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
    ];

    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        courier: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        deliveryAddress: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Check if courier is assigned to this order
    if (order.courierId !== courierId) {
      return res.status(403).json({
        message: "You are not authorized to update this order",
      });
    }

    // Validate status transition
    const currentStatus = order.orderStatus;
    const validTransitions = {
      IN_PREPARATION: ["READY_FOR_PICKUP"],
      READY_FOR_PICKUP: ["OUT_FOR_DELIVERY"],
      OUT_FOR_DELIVERY: ["DELIVERED"],
      DELIVERED: ["COMPLETED"],
    };

    if (
      !validTransitions[currentStatus] ||
      !validTransitions[currentStatus].includes(newStatus)
    ) {
      return res.status(400).json({
        message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        allowedTransitions: validTransitions[currentStatus] || [],
      });
    }

    // For COMPLETED status, require delivery proof
    if (newStatus === "COMPLETED" && !order.deliveryProof) {
      return res.status(400).json({
        message:
          "Cannot mark as completed without delivery proof. Please upload delivery proof first.",
      });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: newStatus,
      },
      include: {
        courier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        deliveryAddress: true,
      },
    });

    // Audit log untuk perubahan status order
    logUpdate(
      "Order",
      orderId,
      { orderStatus: currentStatus },
      { orderStatus: newStatus },
      courierId
    );

    // Create notification for customer
    const statusMessages = {
      IN_PREPARATION: "Pesanan Anda sedang disiapkan",
      READY_FOR_PICKUP: "Pesanan siap untuk diambil kurir",
      OUT_FOR_DELIVERY: "Pesanan dalam perjalanan",
      DELIVERED: "Pesanan telah sampai",
      COMPLETED: "Pesanan selesai",
    };

    const notification = await prisma.notification.create({
      data: {
        userId: order.userId,
        type: "ORDER",
        title: "Status Pesanan Diperbarui",
        message: statusMessages[newStatus] || "Status pesanan diperbarui",
        metadata: {
          orderId: order.id,
          oldStatus: currentStatus,
          newStatus: newStatus,
          courierName: order.courier?.name,
          notes: notes || null,
        },
      },
    });

    // Send real-time notification to customer
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${order.userId}`).emit("order-status-updated", {
          notification,
          order: {
            id: updatedOrder.id,
            orderStatus: updatedOrder.orderStatus,
            courier: updatedOrder.courier,
          },
        });
        console.log(
          `📱 Status update notification sent to user ${order.userId}`
        );
      }
    } catch (emitErr) {
      console.warn("Socket emit failed:", emitErr?.message);
    }

    return res.status(200).json({
      message: "Order status updated successfully",
      order: {
        id: updatedOrder.id,
        orderStatus: updatedOrder.orderStatus,
        previousStatus: currentStatus,
        courier: updatedOrder.courier,
        deliveryAddress: updatedOrder.deliveryAddress,
        updatedAt: updatedOrder.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Get courier's orders with flexible filtering
 * GET /orders/courier
 *
 * Query params:
 *  - filter (optional):
 *    - "active" = orders NOT in [COMPLETED, CANCELED, DISPUTED, GRACE_PERIOD]
 *    - specific status (e.g., "PENDING", "IN_PREPARATION", etc.)
 *    - omit for all orders
 *  - page (optional): Page number for pagination (default: 1)
 *  - limit (optional): Items per page (default: 10)
 *  - enablePagination (optional): "true" or "false" (default: "true")
 *
 * Returns:
 *  - If pagination enabled: { success, orders, pagination: { page, limit, totalPages, totalOrders }, statusCounts }
 *  - If pagination disabled: { success, orders, totalOrders, statusCounts }
 */
router.get("/courier", authenticate, async (req, res) => {
  try {
    const courierId = req.user.id;
    const { filter, page, limit, enablePagination } = req.query;

    // Pagination settings
    const isPaginationEnabled = enablePagination !== "false";
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const skip = (currentPage - 1) * itemsPerPage;

    // Build where condition based on filter
    const whereCondition = { courierId };

    if (filter) {
      if (filter === "active") {
        // Active = NOT completed, canceled, disputed, or grace period
        whereCondition.orderStatus = {
          //  ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"]: true,
          notIn: [
            "PENDING",
            "IN_PREPARATION",
            "COMPLETED",
            "CANCELED",
            "DISPUTED",
            "GRACE_PERIOD",
          ],
        };
      } else {
        // Specific status filter
        whereCondition.orderStatus = filter.toUpperCase();
      }
    }

    // Count total orders matching filter
    const totalOrders = await prisma.order.count({
      where: whereCondition,
    });

    // Get status counts for all statuses (for tabs)
    const allStatusCounts = await prisma.order.groupBy({
      by: ["orderStatus"],
      where: { courierId },
      _count: { orderStatus: true },
    });

    // Calculate active count (untuk tab "active")
    const activeCount = await prisma.order.count({
      where: {
        courierId,
        orderStatus: {
          notIn: ["COMPLETED", "CANCELED", "DISPUTED", "GRACE_PERIOD"],
        },
      },
    });

    // Format status counts untuk kemudahan frontend
    const statusCounts = {
      active: activeCount,
      PENDING: 0,
      IN_PREPARATION: 0,
      READY_FOR_PICKUP: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      COMPLETED: 0,
      CANCELED: 0,
      DISPUTED: 0,
      GRACE_PERIOD: 0,
    };

    allStatusCounts.forEach((item) => {
      statusCounts[item.orderStatus] = item._count.orderStatus;
    });

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: whereCondition,
      select: {
        id: true,
        orderStatus: true,
        subtotal: true,
        deliveryFee: true,
        changeAmount: true,
        cashAmount: true,
        orderItems: true,
        createdAt: true,
        updatedAt: true,
        deliveryAddress: {
          select: {
            id: true,
            fullAddress: true,
            recipientName: true,
            recipientPhone: true,
            latitude: true,
            longitude: true,
          },
        },
        pickupStore: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            address: {
              select: {
                fullAddress: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(isPaginationEnabled && {
        skip,
        take: itemsPerPage,
      }),
    });

    // Response dengan atau tanpa pagination
    if (isPaginationEnabled) {
      const totalPages = Math.ceil(totalOrders / itemsPerPage);

      return res.json({
        success: true,
        orders,
        pagination: {
          page: currentPage,
          limit: itemsPerPage,
          totalPages,
          totalOrders,
        },
        statusCounts,
      });
    } else {
      return res.json({
        success: true,
        orders,
        totalOrders,
        statusCounts,
      });
    }
  } catch (error) {
    console.error("❌ Error fetching courier orders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Upload delivery proof photo
 * POST /orders/:orderId/delivery-proof
 *
 * Courier uploads photo of delivered package at customer's address
 * This is required before marking order as COMPLETED
 */
router.post(
  "/:orderId/delivery-proof",
  authenticate,
  upload.single("deliveryProof"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const courierId = req.user.id;

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          message: "Delivery proof photo is required",
        });
      }

      // Find order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          courier: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!order) {
        // Delete uploaded file if order not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          message: "Order not found",
        });
      }

      // Check if courier is assigned to this order
      if (order.courierId !== courierId) {
        // Delete uploaded file if unauthorized
        fs.unlinkSync(req.file.path);
        return res.status(403).json({
          message: "You are not authorized to upload proof for this order",
        });
      }

      // Only allow upload when status is DELIVERED
      if (order.orderStatus !== "OUT_FOR_DELIVERY") {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          message: `Cannot upload delivery proof. Order status must be OUT_FOR_DELIVERY (current: ${order.orderStatus})`,
        });
      }

      // Delete old proof if exists
      if (order.deliveryProof) {
        const oldProofPath = path.join(process.cwd(), order.deliveryProof);
        if (fs.existsSync(oldProofPath)) {
          fs.unlinkSync(oldProofPath);
        }
      }

      // Save file path to database (relative path)
      const filePath = `/uploads/delivery-proofs/${req.file.filename}`;

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryProof: filePath,
          orderStatus: "DELIVERED",
        },
        include: {
          courier: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          deliveryAddress: true,
        },
      });

      // Audit log untuk upload delivery proof
      logUpdate(
        "Order",
        orderId,
        { orderStatus: "OUT_FOR_DELIVERY" },
        {
          deliveryProof: filePath,
          orderStatus: "DELIVERED",
        },
        courierId
      );

      // Create notification for customer
      const notification = await prisma.notification.create({
        data: {
          userId: order.userId,
          type: "ORDER",
          title: "Bukti Pengiriman Diunggah",
          message: `Kurir telah mengunggah foto bukti pengiriman untuk pesanan Anda`,
          metadata: {
            orderId: order.id,
            deliveryProof: filePath,
            courierName: order.courier?.name,
          },
        },
      });

      // Send real-time notification to customer
      try {
        const io = getIO();
        if (io) {
          io.to(`user:${order.userId}`).emit("delivery-proof-uploaded", {
            notification,
            order: {
              id: updatedOrder.id,
              deliveryProof: updatedOrder.deliveryProof,
            },
          });
          console.log(
            `📸 Delivery proof notification sent to user ${order.userId}`
          );
        }
      } catch (emitErr) {
        console.warn("Socket emit failed:", emitErr?.message);
      }

      return res.status(200).json({
        message: "Delivery proof uploaded successfully",
        order: {
          id: updatedOrder.id,
          deliveryProof: updatedOrder.deliveryProof,
          orderStatus: updatedOrder.orderStatus,
          updatedAt: updatedOrder.updatedAt,
        },
      });
    } catch (error) {
      console.error("❌ Error uploading delivery proof:", error);

      // Delete uploaded file if database update fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

/**
 * Get courier's orders with flexible filtering
 * GET /orders/courier
 *
 * Query params:
 *  - filter (optional):
 *    - "active" = orders NOT in [COMPLETED, CANCELED, DISPUTED, GRACE_PERIOD]
 *    - specific status (e.g., "PENDING", "IN_PREPARATION", etc.)
 *    - omit for all orders
 *  - page (optional): Page number for pagination (default: 1)
 *  - limit (optional): Items per page (default: 10)
 *  - enablePagination (optional): "true" or "false" (default: "true")
 *
 * Returns:
 *  - If pagination enabled: { success, orders, pagination: { page, limit, totalPages, totalOrders }, statusCounts }
 *  - If pagination disabled: { success, orders, totalOrders, statusCounts }
 */
router.get("/courier", authenticate, async (req, res) => {
  try {
    const courierId = req.user.id;
    const { filter, page, limit, enablePagination } = req.query;

    // Pagination settings
    const isPaginationEnabled = enablePagination !== "false";
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const skip = (currentPage - 1) * itemsPerPage;

    // Build where condition based on filter
    const whereCondition = { courierId };

    if (filter) {
      if (filter === "active") {
        // Active = NOT completed, canceled, disputed, or grace period
        whereCondition.orderStatus = {
          notIn: ["COMPLETED", "CANCELED", "DISPUTED", "GRACE_PERIOD"],
        };
      } else {
        // Specific status filter
        whereCondition.orderStatus = filter.toUpperCase();
      }
    }

    // Count total orders matching filter
    const totalOrders = await prisma.order.count({
      where: whereCondition,
    });

    // Get status counts for all statuses (for tabs)
    const allStatusCounts = await prisma.order.groupBy({
      by: ["orderStatus"],
      where: { courierId },
      _count: { orderStatus: true },
    });

    // Calculate active count (untuk tab "active")
    const activeCount = await prisma.order.count({
      where: {
        courierId,
        orderStatus: {
          notIn: ["COMPLETED", "CANCELED", "DISPUTED", "GRACE_PERIOD"],
        },
      },
    });

    // Format status counts untuk kemudahan frontend
    const statusCounts = {
      active: activeCount,
      PENDING: 0,
      IN_PREPARATION: 0,
      READY_FOR_PICKUP: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      COMPLETED: 0,
      CANCELED: 0,
      DISPUTED: 0,
      GRACE_PERIOD: 0,
    };

    allStatusCounts.forEach((item) => {
      statusCounts[item.orderStatus] = item._count.orderStatus;
    });

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: whereCondition,
      select: {
        id: true,
        orderStatus: true,
        subtotal: true,
        deliveryFee: true,
        changeAmount: true,
        cashAmount: true,
        orderItems: true,
        createdAt: true,
        updatedAt: true,
        deliveryAddress: {
          select: {
            id: true,
            fullAddress: true,
            recipientName: true,
            recipientPhone: true,
            latitude: true,
            longitude: true,
          },
        },
        pickupStore: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            address: {
              select: {
                fullAddress: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(isPaginationEnabled && {
        skip,
        take: itemsPerPage,
      }),
    });

    // Response dengan atau tanpa pagination
    if (isPaginationEnabled) {
      const totalPages = Math.ceil(totalOrders / itemsPerPage);

      return res.json({
        success: true,
        orders,
        pagination: {
          page: currentPage,
          limit: itemsPerPage,
          totalPages,
          totalOrders,
        },
        statusCounts,
      });
    } else {
      return res.json({
        success: true,
        orders,
        totalOrders,
        statusCounts,
      });
    }
  } catch (error) {
    console.error("❌ Error fetching courier orders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Generate QR Code for order pickup
 * POST /orders/:orderId/generate-qr
 *
 * Generates minimal QR code containing only orderId and signature for security
 * Can only be generated when order status is READY_FOR_PICKUP
 * Order details will be fetched from database during verification
 */
router.post("/generate-qr/:orderId", authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const courierId = req.user.id;

    // Find order to validate
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderStatus: true,
        courierId: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order is in correct status for QR generation
    if (order.orderStatus !== "READY_FOR_PICKUP") {
      return res.status(400).json({
        success: false,
        message: `QR code can only be generated for orders with status READY_FOR_PICKUP. Current status: ${order.orderStatus}`,
      });
    }

    // Check if courier is assigned
    if (!order.courierId) {
      return res.status(400).json({
        success: false,
        message: "No courier assigned to this order",
      });
    }

    // Create minimal QR code data (only orderId, signature, and expiration)
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + 10 * 60 * 1000); // 10 minutes from now

    const qrCodeData = {
      orderId: order.id,
      generatedAt: generatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      // Add signature to prevent tampering
      signature: crypto
        .createHash("sha256")
        .update(`${order.id}|${order.courierId}|${process.env.JWT_SECRET}`)
        .digest("hex"),
    };

    // Convert to JSON string
    const qrCodeString = JSON.stringify(qrCodeData);

    // Update order with QR code
    await prisma.order.update({
      where: { id: orderId },
      data: {
        qrCode: qrCodeString,
      },
    });

    // Audit log untuk generate QR code
    logCreate(
      "OrderQRCode",
      orderId,
      {
        qrCodeGenerated: true,
        generatedAt: generatedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      courierId
    );

    return res.status(200).json({
      success: true,
      message: "QR code generated successfully",
      qrCode: qrCodeString,
      qrCodeData: qrCodeData,
    });
  } catch (error) {
    console.error("❌ Error generating QR code:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * Verify QR Code and update order status to OUT_FOR_DELIVERY
 * POST /orders/verify-qr
 *
 * Verifies QR code and updates order status if:
 * - QR code is valid
 * - Courier scanning is the assigned courier
 * - Order is in READY_FOR_PICKUP status
 */
router.post("/verify-qr", authenticate, async (req, res) => {
  try {
    const { qrCode } = req.body;
    const courierId = req.user.id;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: "QR code is required",
      });
    }

    // Parse QR code data
    let qrCodeData;
    try {
      qrCodeData = JSON.parse(qrCode);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "QR code tidak valid - Invalid QR code format",
      });
    }

    // Validate required fields in QR code
    if (!qrCodeData.orderId || !qrCodeData.signature) {
      return res.status(400).json({
        success: false,
        message: "QR code tidak valid - Missing required fields",
      });
    }

    // Check if QR code has expired
    if (qrCodeData.expiresAt) {
      const expirationDate = new Date(qrCodeData.expiresAt);
      const now = new Date();

      if (now > expirationDate) {
        return res.status(400).json({
          success: false,
          message: "QR code sudah expired. Silakan generate QR code baru.",
          expiredAt: qrCodeData.expiresAt,
        });
      }
    }

    // Find order from database to get courierId and other details
    const order = await prisma.order.findUnique({
      where: { id: qrCodeData.orderId },
      include: {
        courier: {
          select: {
            id: true,
            name: true,
          },
        },
        deliveryAddress: {
          select: {
            recipientName: true,
            recipientPhone: true,
            fullAddress: true,
            latitude: true,
            longitude: true,
          },
        },
        pickupStore: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify signature using courierId from database
    const expectedSignature = crypto
      .createHash("sha256")
      .update(
        `${qrCodeData.orderId}|${order.courierId}|${process.env.JWT_SECRET}`
      )
      .digest("hex");

    if (qrCodeData.signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "QR code tidak valid - Signature mismatch",
      });
    }

    // Check if courier scanning is the assigned courier
    if (order.courierId !== courierId) {
      return res.status(403).json({
        success: false,
        message:
          "QR code tidak valid - You are not the assigned courier for this order",
      });
    }

    // Verify order is in correct status
    if (order.orderStatus !== "READY_FOR_PICKUP") {
      return res.status(400).json({
        success: false,
        message: `Cannot pickup order. Current status: ${order.orderStatus}. Expected: READY_FOR_PICKUP`,
      });
    }

    // Verify stored QR code matches
    if (order.qrCode !== qrCode) {
      return res.status(400).json({
        success: false,
        message: "QR code tidak valid - QR code does not match order record",
      });
    }

    // Update order status to OUT_FOR_DELIVERY
    const updatedOrder = await prisma.order.update({
      where: { id: qrCodeData.orderId },
      data: {
        orderStatus: "OUT_FOR_DELIVERY",
      },
      include: {
        courier: {
          select: {
            id: true,
            name: true,
          },
        },
        deliveryAddress: true,
      },
    });

    // Audit log untuk verify QR code dan pickup order
    logUpdate(
      "Order",
      qrCodeData.orderId,
      { orderStatus: "READY_FOR_PICKUP" },
      {
        orderStatus: "OUT_FOR_DELIVERY",
        qrVerified: true,
        pickedUpAt: new Date().toISOString(),
      },
      courierId
    );

    // Create notification for customer
    const notification = await prisma.notification.create({
      data: {
        userId: order.userId,
        type: "ORDER",
        title: "Order Picked Up",
        message: `Your order is now out for delivery by ${order.courier?.name}`,
        metadata: {
          orderId: order.id,
          oldStatus: "READY_FOR_PICKUP",
          newStatus: "OUT_FOR_DELIVERY",
          courierName: order.courier?.name,
          pickedUpAt: new Date().toISOString(),
        },
      },
    });

    // Send real-time notification to customer
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${order.userId}`).emit("order-status-updated", {
          notification,
          order: {
            id: updatedOrder.id,
            orderStatus: updatedOrder.orderStatus,
            courier: updatedOrder.courier,
          },
        });
        console.log(
          `📱 Order pickup notification sent to user ${order.userId}`
        );
      }
    } catch (emitErr) {
      console.warn("Socket emit failed:", emitErr?.message);
    }

    return res.status(200).json({
      success: true,
      message:
        "QR code verified successfully. Order status updated to OUT_FOR_DELIVERY",
      order: {
        id: updatedOrder.id,
        orderStatus: updatedOrder.orderStatus,
        courier: updatedOrder.courier,
        deliveryAddress: updatedOrder.deliveryAddress,
        deliveryInfo: {
          recipientName: order.deliveryAddress.recipientName,
          recipientPhone: order.deliveryAddress.recipientPhone,
          fullAddress: order.deliveryAddress.fullAddress,
          latitude: order.deliveryAddress.latitude,
          longitude: order.deliveryAddress.longitude,
        },
        orderItems: order.orderItems,
        paymentInfo: {
          subtotal: order.subtotal.toString(),
          deliveryFee: order.deliveryFee.toString(),
          cashAmount: order.cashAmount.toString(),
          changeAmount: order.changeAmount.toString(),
        },
        pickupStoreId: order.pickupStoreId,
      },
    });
  } catch (error) {
    console.error("❌ Error verifying QR code:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get today's performance stats for courier
router.get("/performance/today", authenticate, async (req, res) => {
  try {
    const courierId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Completed deliveries today
    const completedDeliveries = await prisma.order.count({
      where: {
        courierId,
        orderStatus: "COMPLETED",
        updatedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Active orders today (not completed/canceled/disputed)
    const activeOrders = await prisma.order.count({
      where: {
        courierId,
        orderStatus: {
          notIn: ["COMPLETED", "CANCELED", "DISPUTED", "GRACE_PERIOD"],
        },
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return res.json({
      completedDeliveries,
      activeOrders,
    });
  } catch (error) {
    console.error("Get today's performance error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
