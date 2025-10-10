import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate, authorize } from "../Middlewares/accessControl.js";
import { getIO } from "../../utils/socket.js";
import multer from "multer";
import path from "path";
import fs from "fs";

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
router.put(
  "/:orderId/status",
  authenticate,
  async (req, res) => {
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
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
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
  }
);

/**
 * Get courier's assigned orders
 * GET /orders/courier/my-deliveries
 */
router.get(
  "/courier/my-deliveries",
  authenticate,
  async (req, res) => {
    try {
      const courierId = req.user.id;
      const { status } = req.query;

      const whereClause = {
        courierId,
      };

      // Filter by status if provided
      if (status && status !== "all") {
        const validStatuses = [
          "IN_PREPARATION",
          "READY_FOR_PICKUP",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "COMPLETED",
        ];

        if (validStatuses.includes(status.toUpperCase())) {
          whereClause.orderStatus = status.toUpperCase();
        }
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          deliveryAddress: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Parse orderItems from JSON
      const ordersWithParsedItems = orders.map((order) => ({
        ...order,
        orderItems: order.orderItems || [],
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        cashAmount: Number(order.cashAmount),
        changeAmount: Number(order.changeAmount),
      }));

      return res.status(200).json({
        message: "Courier deliveries retrieved successfully",
        orders: ordersWithParsedItems,
        totalOrders: ordersWithParsedItems.length,
      });
    } catch (error) {
      console.error("❌ Error fetching courier deliveries:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

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
      if (order.orderStatus !== "DELIVERED") {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          message: `Cannot upload delivery proof. Order status must be DELIVERED (current: ${order.orderStatus})`,
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

export default router;
