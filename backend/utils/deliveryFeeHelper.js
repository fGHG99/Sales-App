// be/backend/utils/deliveryFeeHelper.js
import prisma from "./prisma.js";

/**
 * Get current active delivery fee
 * @returns {Promise<number>} Current delivery fee amount
 */
export const getCurrentDeliveryFee = async () => {
  try {
    const currentFee = await prisma.deliveryFeeSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return currentFee ? Number(currentFee.feeAmount) : 0;
  } catch (error) {
    console.error("Error fetching current delivery fee:", error);
    return 0; // Fallback to 0 if error
  }
};

/**
 * Update delivery fee (deactivate old, create new)
 * @param {number} feeAmount - New fee amount
 * @param {string} description - Description for the change
 * @param {string} userId - User ID who made the change
 * @returns {Promise<Object>} Created delivery fee setting
 */
export const updateDeliveryFee = async (feeAmount, description, userId) => {
  try {
    // Get current active setting for audit log
    const currentActiveSetting = await prisma.deliveryFeeSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Deactivate all active settings
    await prisma.deliveryFeeSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new active setting
    const result = await prisma.deliveryFeeSettings.create({
      data: {
        feeAmount: parseFloat(feeAmount),
        description: description || `Delivery fee updated to Rp ${feeAmount}`,
        isActive: true,
      },
    });

    return {
      result,
      previousSetting: currentActiveSetting,
    };
  } catch (error) {
    console.error("Error updating delivery fee:", error);
    throw error;
  }
};

/**
 * Get delivery fee history
 * @param {number} limit - Number of records to return
 * @returns {Promise<Array>} Delivery fee settings history
 */
export const getDeliveryFeeHistory = async (limit = 10) => {
  try {
    const history = await prisma.deliveryFeeSettings.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return history;
  } catch (error) {
    console.error("Error fetching delivery fee history:", error);
    throw error;
  }
};
