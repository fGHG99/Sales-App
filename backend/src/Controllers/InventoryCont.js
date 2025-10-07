//!IMPORTANT! REMOVE THIS CONTROLLER LATER AND FETCH IT FROM INVENTORY API

import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate } from "../Middlewares/accessControl.js";

/**
 * Helper untuk konversi BigInt dan Decimal -> Number
 * (rekursif untuk nested object/array dari Prisma)
 */
function serializeBigInt(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item));
  } else if (obj && typeof obj === "object") {
    // Check if it's a Prisma Decimal object (has toNumber method)
    if (typeof obj.toNumber === "function") {
      return obj.toNumber();
    }
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
    );
  } else if (typeof obj === "bigint") {
    return Number(obj);
  }
  return obj;
}

// GET /inventory - Get all products (authenticated users only)
router.get("/", authenticate, async (req, res) => {
  try {
    console.log("📦 Fetching all products from inventory...");

    // Fetch all active products with their images and category
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      include: {
        images: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            altText: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Found ${products.length} products`);

    // Serialize BigInt values (for sellingPrice from Decimal type)
    const serializedProducts = serializeBigInt(products);

    return res.status(200).json({
      message: "Products retrieved successfully",
      products: serializedProducts,
      total: products.length,
    });
  } catch (error) {
    console.error("❌ Get products error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
