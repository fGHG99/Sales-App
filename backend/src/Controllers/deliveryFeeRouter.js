// be/backend/src/Controllers/deliveryFeeSettingsController.js
import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate } from "../Middlewares/accessControl.js";
import { logCreate, logUpdate } from "../../utils/auditlog.js";

// GET /delivery-fee - Get current delivery fee
router.get("/delivery-fee", authenticate, async (req, res) => {
  try {
    const deliveryFeeSetting = await prisma.deliveryFeeSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const feeAmount = deliveryFeeSetting
      ? Number(deliveryFeeSetting.feeAmount)
      : 0;

    res.json({
      success: true,
      data: {
        feeAmount: feeAmount,
        description: deliveryFeeSetting?.description,
        lastUpdated: deliveryFeeSetting?.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching delivery fee:", error);
    res.status(500).json({ error: "Failed to fetch delivery fee" });
  }
});

// POST /delivery-fee - Update delivery fee
router.post("/delivery-fee", authenticate, async (req, res) => {
  try {
    const { feeAmount, description } = req.body;

    // Validate user has permission to update fees
    if (
      !req.user.role?.roleType ||
      !["superadmin", "admin"].includes(req.user.role.roleType)
    ) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

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

    // Audit log for update/create
    if (currentActiveSetting) {
      // Update case
      logUpdate(
        "DeliveryFeeSettings",
        result.id,
        {
          feeAmount: Number(currentActiveSetting.feeAmount),
          description: currentActiveSetting.description,
        },
        {
          feeAmount: Number(result.feeAmount),
          description: result.description,
        },
        req.user.id
      );
    } else {
      // Create case
      logCreate(
        "DeliveryFeeSettings",
        result.id,
        {
          feeAmount: Number(result.feeAmount),
          description: result.description,
        },
        req.user.id
      );
    }

    res.json({
      success: true,
      message: "Delivery fee updated successfully",
      data: {
        feeAmount: Number(result.feeAmount),
        description: result.description,
        lastUpdated: result.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating delivery fee:", error);
    res.status(500).json({ error: "Failed to update delivery fee" });
  }
});

// GET /delivery-fee/history - Get delivery fee change history
router.get("/delivery-fee/history", authenticate, async (req, res) => {
  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity: "DeliveryFeeSettings",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    res.json({
      success: true,
      data: auditLogs,
    });
  } catch (error) {
    console.error("Error fetching delivery fee history:", error);
    res.status(500).json({ error: "Failed to fetch delivery fee history" });
  }
});

export default router;
