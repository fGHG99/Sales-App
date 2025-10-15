import prisma from "./prisma.js";

export const findBestCourier = async (postalCode) => {
  try {
    // Find all couriers who can serve this postal code area
    const availableCouriers = await prisma.user.findMany({
      where: {
        workAreaPostalCodes: {
          has: postalCode, // Array contains postal code
        },
        isVerified: true,
        isDeleted: false,
        role: {
          roleType: "courier",
          isDeleted: false,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        workAreaPostalCodes: true,
        _count: {
          select: {
            courierOrders: {
              where: {
                orderStatus: {
                  in: [
                    "PENDING",
                    "IN_PREPARATION",
                    "READY_FOR_PICKUP",
                    "OUT_FOR_DELIVERY",
                  ],
                },
              },
            },
          },
        },
      },
    });

    if (availableCouriers.length === 0) {
      console.warn(`⚠️ No available couriers for postal code: ${postalCode}`);
      return null;
    }

    // Sort by workload (ascending) - courier with least active orders first
    const sortedCouriers = availableCouriers.sort(
      (a, b) => a._count.courierOrders - b._count.courierOrders
    );

    const bestCourier = sortedCouriers[0];

    console.log(
      `✅ Best courier found: ${bestCourier.name} (ID: ${bestCourier.id}) with ${bestCourier._count.courierOrders} active orders`
    );

    return bestCourier;
  } catch (error) {
    console.error("❌ Error finding best courier:", error);
    throw error;
  }
};

export const assignCourierToOrder = async (orderId, courierId) => {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        courierId,
      },
      include: {
        courier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        deliveryAddress: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(
      `📦 Order ${orderId} assigned to courier ${updatedOrder.courier.name}`
    );

    return updatedOrder;
  } catch (error) {
    console.error("❌ Error assigning courier to order:", error);
    throw error;
  }
};

export const getCourierWorkload = async (courierId) => {
  try {
    const count = await prisma.order.count({
      where: {
        courierId,
        orderStatus: {
          in: [
            "PENDING",
            "IN_PREPARATION",
            "READY_FOR_PICKUP",
            "OUT_FOR_DELIVERY",
          ],
        },
      },
    });

    return count;
  } catch (error) {
    console.error("❌ Error getting courier workload:", error);
    throw error;
  }
};
