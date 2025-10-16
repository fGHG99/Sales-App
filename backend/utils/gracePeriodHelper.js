import prisma from "./prisma.js";
import { logUpdate } from "./auditlog.js";
import { getIO } from "./socket.js";

/**
 * Grace Period Helper untuk Order Management
 *
 * Flow:
 * 1. Courier update status ke DELIVERED → Order otomatis menjadi GRACE_PERIOD
 * 2. Setelah 3 jam jika user tidak complete → Order tetap GRACE_PERIOD
 * 3. Setelah 3 hari tidak ada dispute → Order otomatis menjadi COMPLETED
 */

/**
 * Set order ke GRACE_PERIOD ketika courier update ke DELIVERED
 * @param {string} orderId - Order ID
 * @param {string} courierId - Courier ID yang melakukan update
 * @returns {Promise<Object>} Updated order data
 */
export const setOrderToGracePeriod = async (orderId, courierId) => {
  try {
    console.log(`🔄 Setting order ${orderId} to GRACE_PERIOD...`);

    // Update order status ke GRACE_PERIOD
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: "GRACE_PERIOD",
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        courier: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Audit log
    logUpdate(
      "Order",
      orderId,
      { orderStatus: "DELIVERED" },
      {
        orderStatus: "GRACE_PERIOD",
        updatedBy: courierId,
        updatedAt: new Date().toISOString(),
        reason: "Auto-transition to grace period after delivery",
      },
      courierId
    );

    // Create notification untuk user
    const userNotification = await prisma.notification.create({
      data: {
        userId: updatedOrder.userId,
        type: "ORDER",
        title: "Pesanan Telah Dikirim",
        message: `Pesanan #${orderId.slice(0, 8)} telah dikirim oleh kurir.`,
        metadata: {
          orderId: orderId,
          orderStatus: "GRACE_PERIOD",
          gracePeriodEnds: new Date(
            // Date.now() + 3 * 24 * 60 * 60 * 1000
            Date.now() + 30 * 1000
          ).toISOString(), // 3 hari untuk 30 detik Date.now() + 30 * 1000
          courier: updatedOrder.courier,
        },
      },
    });

    // Emit realtime notification ke user
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${updatedOrder.userId}`).emit(
          "notification:new",
          userNotification
        );
        console.log(
          `📱 Grace period notification sent to user ${updatedOrder.user.name}`
        );
      }
    } catch (emitErr) {
      console.warn("Socket emit failed:", emitErr?.message);
    }

    // Set timeout untuk auto-complete setelah 3 hari
    setTimeout(async () => {
      await autoCompleteOrder(orderId);
    }, 30 * 1000); //30 detik untuk testing // 3 hari dalam milliseconds 

    console.log(`✅ Order ${orderId} set to GRACE_PERIOD successfully`);
    return updatedOrder;
  } catch (error) {
    console.error(`❌ Error setting order ${orderId} to GRACE_PERIOD:`, error);
    throw error;
  }
};

/**
 * Auto-complete order setelah 3 hari tidak ada dispute
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Updated order data
 */
export const autoCompleteOrder = async (orderId) => {
  try {
    console.log(`🔄 Auto-completing order ${orderId} after 3 days...`);

    // Cek apakah order masih dalam GRACE_PERIOD dan tidak ada dispute aktif
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        disputes: {
          where: {
            status: {
              in: ["PENDING", "IN_PROGRESS"],
            },
          },
        },
      },
    });

    if (!order) {
      console.log(`⚠️ Order ${orderId} not found for auto-complete`);
      return null;
    }

    if (order.orderStatus !== "GRACE_PERIOD") {
      console.log(
        `⚠️ Order ${orderId} is not in GRACE_PERIOD status (current: ${order.orderStatus})`
      );
      return null;
    }

    if (order.disputes && order.disputes.length > 0) {
      console.log(
        `⚠️ Order ${orderId} has active disputes, skipping auto-complete`
      );
      return null;
    }

    // Update order status ke COMPLETED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: "COMPLETED",
        updatedAt: new Date(),
      },
    });

    // Audit log
    logUpdate(
      "Order",
      orderId,
      { orderStatus: "GRACE_PERIOD" },
      {
        orderStatus: "COMPLETED",
        updatedBy: "SYSTEM",
        updatedAt: new Date().toISOString(),
        reason: "Auto-completed after 3 days grace period without dispute",
      },
      "SYSTEM"
    );

    // Create notification untuk user
    const userNotification = await prisma.notification.create({
      data: {
        userId: order.userId,
        type: "ORDER",
        title: "Pesanan Selesai",
        message: `Pesanan #${orderId.slice(
          0,
          8
        )} telah otomatis diselesaikan oleh sistem setelah periode grace 3 hari.`,
        metadata: {
          orderId: orderId,
          orderStatus: "COMPLETED",
          completedBy: "SYSTEM",
          completedAt: new Date().toISOString(),
        },
      },
    });

    // Emit realtime notification ke user
    try {
      const io = getIO();
      if (io) {
        io.to(`user:${order.userId}`).emit(
          "notification:new",
          userNotification
        );
        console.log(
          `📱 Auto-complete notification sent to user ${order.user.name}`
        );
      }
    } catch (emitErr) {
      console.warn("Socket emit failed:", emitErr?.message);
    }

    console.log(`✅ Order ${orderId} auto-completed successfully`);
    return updatedOrder;
  } catch (error) {
    console.error(`❌ Error auto-completing order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Cancel auto-complete jika user mengajukan dispute
 * @param {string} orderId - Order ID
 * @returns {Promise<boolean>} Success status
 */
export const cancelAutoComplete = async (orderId) => {
  try {
    console.log(
      `🔄 Canceling auto-complete for order ${orderId} due to dispute...`
    );

    // Cek apakah order masih dalam GRACE_PERIOD
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderStatus: true,
        userId: true,
      },
    });

    if (!order || order.orderStatus !== "GRACE_PERIOD") {
      console.log(`⚠️ Order ${orderId} is not in GRACE_PERIOD status`);
      return false;
    }

    // Update order status ke DISPUTED
    await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: "DISPUTED",
        updatedAt: new Date(),
      },
    });

    // Audit log
    logUpdate(
      "Order",
      orderId,
      { orderStatus: "GRACE_PERIOD" },
      {
        orderStatus: "DISPUTED",
        updatedBy: order.userId,
        updatedAt: new Date().toISOString(),
        reason: "User submitted dispute, canceling auto-complete",
      },
      order.userId
    );

    console.log(
      `✅ Auto-complete canceled for order ${orderId} due to dispute`
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Error canceling auto-complete for order ${orderId}:`,
      error
    );
    throw error;
  }
};

/**
 * Get grace period info untuk order
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Grace period info
 */
export const getGracePeriodInfo = async (orderId) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderStatus: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!order || order.orderStatus !== "GRACE_PERIOD") {
      return null;
    }

    const gracePeriodStart = order.updatedAt;
    const gracePeriodEnd = new Date(
      gracePeriodStart.getTime() + 3 * 24 * 60 * 60 * 1000
    );
    const now = new Date();
    const timeRemaining = gracePeriodEnd.getTime() - now.getTime();

    return {
      orderId: order.id,
      status: order.orderStatus,
      gracePeriodStart,
      gracePeriodEnd,
      timeRemaining: Math.max(0, timeRemaining),
      isExpired: timeRemaining <= 0,
      hoursRemaining: Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60))),
    };
  } catch (error) {
    console.error(
      `❌ Error getting grace period info for order ${orderId}:`,
      error
    );
    throw error;
  }
};
