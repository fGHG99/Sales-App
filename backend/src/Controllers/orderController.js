import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate } from "../Middlewares/accessControl.js";
import { getIO } from "../../utils/socket.js";
import {
  findBestCourier,
  assignCourierToOrder,
} from "../utils/courierAssignment.js";

// ==================== GET ORDER ROUTES ====================

// Get all orders for authenticated user with filters (status, date, pagination, search)
router.get("/my-orders", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // Dari authenticate middleware
    const {
      status,
      date,
      startDate,
      endDate,
      page = 1,
      limit = 6,
      search = "",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause = {
      userId: userId,
    };

    // Filter by status if provided
    if (status && status !== "all") {
      const validStatuses = [
        "PENDING",
        "IN_PREPARATION",
        "READY_FOR_PICKUP",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "COMPLETED",
        "DISPUTED",
        "CANCELED",
        "GRACE_PERIOD",
      ];

      if (validStatuses.includes(status.toUpperCase())) {
        whereClause.orderStatus = status.toUpperCase();
      }
    }

    // Filter by specific date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
    // Filter by date range if provided
    else if (startDate || endDate) {
      whereClause.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        whereClause.createdAt.gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    // Search by order ID (case insensitive partial match)
    if (search && search.trim() !== "") {
      whereClause.id = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    // Count total orders matching the criteria (for pagination)
    const totalOrders = await prisma.order.count({
      where: whereClause,
    });

    // Fetch paginated orders
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        deliveryAddress: {
          select: {
            label: true,
            recipientName: true,
            recipientPhone: true,
            fullAddress: true,
            city: true,
            province: true,
            postalCode: true,
            latitude: true, // ✅ ADDED for courier tracking
            longitude: true, // ✅ ADDED for courier tracking
          },
        },
        pickupStore: {
          include: {
            address: true,
          },
        },
        courier: {
          select: {
            id: true,
            name: true,
            phone: true,
            image: {
              select: {
                id: true,
                url: true,
                altText: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limitNum,
      skip: offset,
    });

    // Format response
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderItems: order.orderItems, // JSON field
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.subtotal) + Number(order.deliveryFee),
      cashAmount: Number(order.cashAmount),
      changeAmount: Number(order.changeAmount),
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryAddress,
      pickupStore: order.pickupStore,
      pickupTime: order.pickupTime,
      courier: order.courier,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    const totalPages = Math.ceil(totalOrders / limitNum);

    return res.status(200).json({
      success: true,
      orders: formattedOrders,
      pagination: {
        total: totalOrders,
        page: pageNum,
        limit: limitNum,
        totalPages: totalPages,
        hasMore: pageNum < totalPages,
        showing: formattedOrders.length,
      },
      filters: {
        status: status || "all",
        date: date || null,
        startDate: startDate || null,
        endDate: endDate || null,
        search: search || null,
      },
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get single order by ID for authenticated user
router.get("/detail/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // console.log(`📦 Fetching order ${orderId} for user ${userId}`);

    // Fetch order with full details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
      include: {
        deliveryAddress: {
          select: {
            label: true,
            recipientName: true,
            recipientPhone: true,
            fullAddress: true,
            city: true,
            province: true,
            postalCode: true,
            latitude: true,
            longitude: true,
          },
        },
        pickupStore: {
          include: {
            address: true,
          },
        },
        courier: {
          select: {
            id: true,
            name: true,
            phone: true,
            // vehicleType: true, !IMPORTANT TO ADD LATER
            // vehiclePlate: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you don't have permission to view it",
      });
    }

    // Format response
    const formattedOrder = {
      id: order.id,
      orderItems: order.orderItems, // JSON field
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.subtotal) + Number(order.deliveryFee),
      cashAmount: Number(order.cashAmount),
      changeAmount: Number(order.changeAmount),
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryAddress,
      pickupStore: order.pickupStore,
      pickupTime: order.pickupTime,
      courier: order.courier,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    console.log(`✅ Order fetched successfully:`, {
      orderId: order.id,
      status: order.orderStatus,
      hasCourier: !!order.courier,
      hasCoordinates: !!(
        order.deliveryAddress?.latitude && order.deliveryAddress?.longitude
      ),
    });

    return res.status(200).json({
      success: true,
      order: formattedOrder,
    });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get order statistics for authenticated user
router.get("/my-orders/stats/summary", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all orders
    const allOrders = await prisma.order.findMany({
      where: { userId },
      select: {
        orderStatus: true,
        subtotal: true,
        deliveryFee: true,
      },
    });

    // Calculate statistics
    const totalOrders = allOrders.length;

    // Calculate total spending from completed/delivered orders
    const totalSpending = allOrders
      .filter((order) => ["DELIVERED", "COMPLETED"].includes(order.orderStatus))
      .reduce(
        (sum, order) =>
          sum + Number(order.subtotal) + Number(order.deliveryFee),
        0
      );

    // Count by status
    const ordersByStatus = {
      PENDING: 0,
      IN_PREPARATION: 0,
      READY_FOR_PICKUP: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      COMPLETED: 0,
      DISPUTED: 0,
      CANCELED: 0,
      GRACE_PERIOD: 0,
    };

    allOrders.forEach((order) => {
      ordersByStatus[order.orderStatus] =
        (ordersByStatus[order.orderStatus] || 0) + 1;
    });

    // Count active orders (not completed/canceled/disputed)
    const activeOrders = allOrders.filter((order) =>
      [
        "PENDING",
        "IN_PREPARATION",
        "READY_FOR_PICKUP",
        "OUT_FOR_DELIVERY",
      ].includes(order.orderStatus)
    ).length;

    return res.status(200).json({
      summary: {
        totalOrders,
        totalSpending,
        ordersByStatus,
        activeOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching order statistics:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get orders by status for authenticated user (HARUS DI ATAS :orderId)
router.get("/my-orders/status/:status", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.params;

    // Validate status
    const validStatuses = [
      "PENDING",
      "IN_PREPARATION",
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "COMPLETED",
      "DISPUTED",
      "CANCELED",
      "GRACE_PERIOD",
    ];

    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        message: "Invalid order status",
        validStatuses,
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId,
        orderStatus: status.toUpperCase(),
      },
      include: {
        deliveryAddress: {
          select: {
            label: true,
            recipientName: true,
            fullAddress: true,
            city: true,
          },
        },
        pickupStore: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderItems: order.orderItems,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.subtotal) + Number(order.deliveryFee),
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryAddress,
      pickupStore: order.pickupStore,
      pickupTime: order.pickupTime,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
    }));

    return res.status(200).json({
      orders: formattedOrders,
      status: status.toUpperCase(),
      total: formattedOrders.length,
    });
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get single order by ID for authenticated user (HARUS DI BAWAH semua route spesifik)
router.get("/my-orders/:orderId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // Dari authenticate middleware
    const { orderId } = req.params;

    // Validasi format UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID format. Must be a valid UUID.",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId, // Pastikan order milik user yang login
      },
      include: {
        deliveryAddress: true,
        pickupStore: {
          include: {
            address: true,
          },
        },
        courier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        disputes: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found or you don't have permission to access it",
      });
    }

    // Format response
    const formattedOrder = {
      id: order.id,
      orderItems: order.orderItems, // JSON field with product details
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.subtotal) + Number(order.deliveryFee),
      cashAmount: Number(order.cashAmount),
      changeAmount: Number(order.changeAmount),
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryAddress,
      pickupStore: order.pickupStore,
      pickupTime: order.pickupTime,
      courier: order.courier,
      disputes: order.disputes,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return res.status(200).json({
      order: formattedOrder,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// ==================== CHECKOUT ROUTE ====================

router.post("/checkout", async (req, res) => {
  try {
    const {
      userId,
      deliveryAddressId,
      cartItemIds,
      cashAmount,
      deliveryType, // 'DELIVERY' | 'PICKUP_TO_STORE'
      deliveryFee,
      pickupStoreId, // Required jika deliveryType = PICKUP_TO_STORE
      pickupTime, // Required jika deliveryType = PICKUP_TO_STORE
    } = req.body;

    // Validasi input dasar
    if (
      !userId ||
      !deliveryAddressId ||
      !Array.isArray(cartItemIds) ||
      cartItemIds.length === 0
    ) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Validasi cash amount
    if (!cashAmount || cashAmount <= 0) {
      return res.status(400).json({
        message: "Cash amount is required and must be greater than 0",
      });
    }

    // Validasi delivery type
    if (
      !deliveryType ||
      !["DELIVERY", "PICKUP_TO_STORE"].includes(deliveryType)
    ) {
      return res.status(400).json({
        message:
          "Delivery type is required. Must be 'DELIVERY' or 'PICKUP_TO_STORE'",
      });
    }

    // Validasi delivery fee
    if (deliveryFee === undefined || deliveryFee < 0) {
      return res.status(400).json({
        message:
          "Delivery fee is required and must be greater than or equal to 0",
      });
    }

    // Validasi khusus untuk PICKUP_TO_STORE
    if (deliveryType === "PICKUP_TO_STORE") {
      if (!pickupStoreId) {
        return res.status(400).json({
          message: "Pickup store ID is required for pickup orders",
        });
      }

      if (!pickupTime) {
        return res.status(400).json({
          message: "Pickup time is required for pickup orders",
        });
      }

      // Cek apakah store exists dan active
      const store = await prisma.store.findUnique({
        where: { id: pickupStoreId },
      });

      if (!store) {
        return res.status(404).json({ message: "Pickup store not found" });
      }

      if (!store.isActive || store.isDeleted) {
        return res.status(400).json({ message: "Pickup store is not active" });
      }
    }

    // Fetch cart user
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: {
        cartItems: true,
      },
    });

    if (!cart || !cart.cartItems) {
      return res.status(404).json({ message: "Cart not found or empty" });
    }

    // Parse cart items dari JSON
    const allCartItems = Array.isArray(cart.cartItems)
      ? cart.cartItems
      : JSON.parse(cart.cartItems);

    // Filter hanya cart items yang dipilih
    const selectedCartItems = allCartItems.filter((item) =>
      cartItemIds.includes(item.productId)
    );

    if (selectedCartItems.length === 0) {
      return res.status(404).json({ message: "Selected cart items not found" });
    }

    // Fetch product details untuk setiap item
    const productIds = selectedCartItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        sellingPrice: true,
        images: {
          select: { url: true, thumbnailUrl: true, altText: true },
          take: 1,
        },
      },
    });

    // Map products ke cart items
    const cartItemsWithProducts = selectedCartItems.map((cartItem) => {
      const product = products.find((p) => p.id === cartItem.productId);
      if (!product) {
        throw new Error(`Product ${cartItem.productId} not found`);
      }
      return {
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        product: {
          id: product.id,
          name: product.name,
          sellingPrice: product.sellingPrice,
          image: product.images?.[0]?.url || null,
          thumbnailUrl: product.images?.[0]?.thumbnailUrl || null,
          altText: product.images?.[0]?.altText || null,
        },
      };
    });

    // Hitung subtotal
    const subtotal = cartItemsWithProducts.reduce((acc, item) => {
      return acc + Number(item.product.sellingPrice) * item.quantity;
    }, 0);

    // Hitung total dengan delivery fee
    const total = subtotal + Number(deliveryFee);

    // Hitung kembalian
    const changeAmount = Number(cashAmount) - total;

    // Validasi uang cukup
    if (changeAmount < 0) {
      return res.status(400).json({
        message: "Cash amount is insufficient",
        required: total,
        provided: cashAmount,
        shortage: Math.abs(changeAmount),
      });
    }

    // Format order items
    const orderItems = cartItemsWithProducts.map((item) => {
      const itemTotal = Number(item.product.sellingPrice) * item.quantity;
      return {
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        pricePerItem: Number(item.product.sellingPrice),
        total: itemTotal,
      };
    });

    // Buat order baru (langsung dengan delivery info dan orderItems)
    const order = await prisma.order.create({
      data: {
        userId,
        deliveryAddressId,
        subtotal,
        cashAmount: Number(cashAmount),
        changeAmount,
        deliveryType,
        deliveryFee: Number(deliveryFee),
        orderItems: orderItems, // Store items as JSON (field name: orderItems)
        pickupStoreId:
          deliveryType === "PICKUP_TO_STORE" ? pickupStoreId : null,
        pickupTime:
          deliveryType === "PICKUP_TO_STORE" && pickupTime
            ? new Date(pickupTime)
            : null,
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
      },
      include: {
        deliveryAddress: true,
        pickupStore:
          deliveryType === "PICKUP_TO_STORE"
            ? {
                include: {
                  address: true,
                },
              }
            : false,
      },
    });

    // Update cart: hapus items yang sudah di-checkout
    const remainingCartItems = allCartItems.filter(
      (item) => !cartItemIds.includes(item.productId)
    );

    await prisma.cart.update({
      where: { userId },
      data: {
        cartItems: remainingCartItems,
      },
    });

    // Buat notifikasi untuk user
    const notificationItems = cartItemsWithProducts.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      pricePerItem: Number(item.product.sellingPrice),
      total: Number(item.product.sellingPrice) * item.quantity,
      imageUrl: item.product.image,
      thumbnailUrl: item.product.thumbnailUrl,
      altText: item.product.altText,
    }));

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: "ORDER",
        title: "Pesanan dibuat",
        message: `Pesanan ${order.id} berhasil dibuat`,
        metadata: {
          orderId: order.id,
          total,
          deliveryType,
          itemCount: orderItems.length,
          items: notificationItems,
        },
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        metadata: true,
        createdAt: true,
      },
    });

    // Emit realtime notification via Socket.IO ke room user
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit("notification:new", notification);
      }
    } catch (emitErr) {
      console.warn("Socket emit failed:", emitErr?.message);
    }

    // ==================== AUTO-ASSIGN COURIER ====================
    // Only auto-assign for DELIVERY type orders
    let assignedCourier = null;
    if (deliveryType === "DELIVERY") {
      try {
        // Get postal code from delivery address
        const deliveryAddress = await prisma.address.findUnique({
          where: { id: deliveryAddressId },
          select: {
            postalCode: true,
            fullAddress: true,
            city: true,
            province: true,
          },
        });

        // Get customer data for courier notification
        const customerData = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        });

        if (deliveryAddress?.postalCode) {
          // Find best courier for this postal code
          const bestCourier = await findBestCourier(deliveryAddress.postalCode);

          if (bestCourier) {
            // Assign courier to order
            const updatedOrder = await assignCourierToOrder(
              order.id,
              bestCourier.id
            );

            assignedCourier = updatedOrder.courier;

            // Send notification to courier via Socket.IO
            const io = getIO();
            if (io) {
              try {
                const courierNotification = await prisma.notification.create({
                  data: {
                    userId: bestCourier.id,
                    type: "ORDER",
                    title: "Pengantaran Baru",
                    message: `Anda ditugaskan untuk mengantarkan pesanan #${order.id.substring(
                      0,
                      8
                    )} ke ${
                      deliveryAddress.city || deliveryAddress.postalCode
                    }`,
                    metadata: {
                      orderId: order.id,
                      deliveryAddressId: deliveryAddressId,
                      postalCode: deliveryAddress.postalCode,
                      pickupTime: order.pickupTime,
                      itemCount: orderItems.length,
                      deliveryFee: Number(order.deliveryFee),
                    },
                  },
                });

                // Emit to courier with complete order data
                io.to(`user:${bestCourier.id}`).emit(
                  "new-delivery-assignment",
                  {
                    orderId: order.id,
                    message: courierNotification.message,
                    notification: {
                      id: courierNotification.id,
                      title: courierNotification.title,
                      message: courierNotification.message,
                      type: courierNotification.type,
                      createdAt: courierNotification.createdAt,
                      metadata: courierNotification.metadata,
                    },
                    order: {
                      id: order.id,
                      orderStatus: order.orderStatus,
                      subtotal: Number(order.subtotal),
                      deliveryFee: Number(order.deliveryFee),
                      deliveryAddress: {
                        id: deliveryAddressId,
                        fullAddress:
                          deliveryAddress.fullAddress || deliveryAddress.street,
                        city: deliveryAddress.city,
                        province: deliveryAddress.province,
                        postalCode: deliveryAddress.postalCode,
                      },
                      itemCount: orderItems.length,
                      customer: {
                        id: customerData?.id,
                        name: customerData?.name || "Customer",
                        phone: customerData?.phone || "-",
                        email: customerData?.email,
                      },
                    },
                  }
                );

                console.log(
                  `📱 Delivery assignment notification sent to courier ${bestCourier.name} (${bestCourier.id})`
                );
              } catch (notifErr) {
                console.error(
                  "❌ Error creating courier notification:",
                  notifErr
                );
              }
            }
          } else {
            console.warn(
              `⚠️ No courier available for postal code: ${deliveryAddress.postalCode}`
            );
            // Order tetap dibuat, tapi belum ada courier assigned
          }
        }
      } catch (courierErr) {
        console.error("❌ Error assigning courier:", courierErr);
        // Don't fail order creation if courier assignment fails
      }
    }

    // Format response: nama produk, quantity, total per item
    const summary = cartItemsWithProducts.map((item) => {
      const itemTotal = Number(item.product.sellingPrice) * item.quantity;
      return {
        productName: item.product.name,
        quantity: item.quantity,
        pricePerItem: Number(item.product.sellingPrice),
        total: itemTotal,
      };
    });

    return res.status(201).json({
      message: "Order created successfully",
      order: {
        id: order.id,
        items: summary,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.deliveryFee),
        total: total,
        cashAmount: Number(order.cashAmount),
        changeAmount: Number(order.changeAmount),
        deliveryType: order.deliveryType,
        courier: assignedCourier
          ? {
              id: assignedCourier.id,
              name: assignedCourier.name,
              phone: assignedCourier.phone,
            }
          : null,
        pickupStore: order.pickupStore
          ? {
              id: order.pickupStore.id,
              name: order.pickupStore.name,
              phoneNumber: order.pickupStore.phoneNumber,
              address: order.pickupStore.address,
            }
          : null,
        pickupTime: order.pickupTime,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
