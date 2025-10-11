//!IMPORTANT! REMOVE THIS CONTROLLER LATER AND FETCH IT FROM INVENTORY API

import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";

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

// GET /inventory - Get all products (public access - no authentication required)
router.get("/", async (req, res) => {
  try {
    console.log("📦 Fetching all products from inventory (public access)...");

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

// GET /inventory/search?q=...&limit=10 - Lightweight search endpoint (public)
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    let { limit } = req.query;

    const searchQuery = (q || "").toString().trim();
    if (!searchQuery) {
      return res.status(400).json({ message: "Query parameter q is required" });
    }

    const maxLimit = 20;
    const defaultLimit = 10;
    const parsedLimit = Number.parseInt(limit, 10);
    const take = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), maxLimit)
      : defaultLimit;

    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        name: { contains: searchQuery, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        // pick one thumbnail if exists
        images: {
          select: { thumbnailUrl: true, url: true },
          take: 1,
        },
        // optionally include price if needed by UI; keep minimal
        // sellingPrice: true,
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    // flatten first image
    const payload = products.map((p) => ({
      id: p.id,
      name: p.name,
      thumbnailUrl: p.images?.[0]?.thumbnailUrl || p.images?.[0]?.url || null,
    }));

    return res.status(200).json({
      message: "Search results",
      results: payload,
      count: payload.length,
    });
  } catch (error) {
    console.error("❌ Product search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
