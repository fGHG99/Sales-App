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

// GET /inventory/names - Get all product names only (lightweight endpoint)
router.get("/categories-name", async (req, res) => {
  try {
    console.log("📦 Fetching product names only (lightweight)...");

    // Fetch only product names for active products
    const categories = await prisma.category.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`✅ Found ${categories.length} category names`);

    return res.status(200).json({
      message: "Category names retrieved successfully",
      categories: categories,
      total: categories.length,
    });
  } catch (error) {
    console.error("❌ Get category names error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// GET /inventory/products?offset=0&limit=18 - Get all products with pagination
router.get("/products", async (req, res) => {
  try {
    const { offset = 0, limit = 18 } = req.query;

    // Parse and validate parameters
    const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 18, 1), 50); // Max 50 items per page

    console.log(
      `📦 Fetching products with offset: ${parsedOffset}, limit: ${parsedLimit}`
    );

    // Fetch products with pagination
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
      skip: parsedOffset,
      take: parsedLimit,
    });

    // Get total count for pagination info
    const totalCount = await prisma.product.count({
      where: {
        isDeleted: false,
        isActive: true,
      },
    });

    console.log(
      `✅ Found ${products.length} products (${parsedOffset + 1}-${
        parsedOffset + products.length
      } of ${totalCount})`
    );

    // Serialize BigInt values (for sellingPrice from Decimal type)
    const serializedProducts = serializeBigInt(products);

    // Calculate pagination info
    const hasNextPage = parsedOffset + parsedLimit < totalCount;
    const hasPreviousPage = parsedOffset > 0;
    const totalPages = Math.ceil(totalCount / parsedLimit);
    const currentPage = Math.floor(parsedOffset / parsedLimit) + 1;

    return res.status(200).json({
      message: "Products retrieved successfully",
      products: serializedProducts,
      pagination: {
        offset: parsedOffset,
        limit: parsedLimit,
        total: totalCount,
        currentPage,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("❌ Get products with pagination error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// GET /inventory/trending - Get trending products (top 13 based on sales)
router.get("/trending", async (req, res) => {
  try {
    console.log("📦 Fetching newest products...");

    // Get newest products based on createdAt
    const newProducts = await prisma.product.findMany({
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
      take: 13,
    });

    console.log(`✅ Found ${newProducts.length} newest products`);

    // Serialize BigInt values
    const serializedProducts = serializeBigInt(newProducts);

    return res.status(200).json({
      message: "New products retrieved successfully",
      products: serializedProducts,
      total: newProducts.length,
    });
  } catch (error) {
    console.error("❌ Get new products error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// GET /inventory/new - Get newest products (13 most recent)
router.get("/new", async (req, res) => {
  try {
    console.log("📦 Fetching newest products...");

    // Get newest products based on createdAt
    const newProducts = await prisma.product.findMany({
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
      take: 13,
    });

    console.log(`✅ Found ${newProducts.length} newest products`);

    // Serialize BigInt values
    const serializedProducts = serializeBigInt(newProducts);

    return res.status(200).json({
      message: "New products retrieved successfully",
      products: serializedProducts,
      total: newProducts.length,
    });
  } catch (error) {
    console.error("❌ Get new products error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// GET /inventory/related/:categoryName - Get related products based on category with pagination
router.get("/related/:categoryName", async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { offset = 0, limit = 20 } = req.query;

    // Parse and validate pagination parameters
    const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50); // Max 50 items per page

    console.log("📦 Fetching related products for category:", categoryName);
    console.log("Pagination - offset:", parsedOffset, "limit:", parsedLimit);

    // Convert URL parameter (with hyphens) back to proper category name (with spaces)
    const categoryDisplayName = categoryName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    console.log("Converted category name:", categoryDisplayName);

    // Define expanded related categories mapping for more diverse results
    const relatedCategories = {
      "Kebutuhan Rumah": ["Ibu Dan Anak", "Dapur", "Elektronik", "Makanan"],
      "Ibu Dan Anak": ["Kebutuhan Rumah", "Makanan", "Minuman"],
      Makanan: ["Minuman", "Ibu Dan Anak", "Kebutuhan Rumah", "Dapur"],
      Minuman: ["Makanan", "Kebutuhan Rumah", "Ibu Dan Anak"],
      "Bahan Masakan": ["Kebutuhan Rumah", "Dapur", "Makanan"],
      Dapur: ["Kebutuhan Rumah", "Bahan Masakan", "Makanan"],
      Elektronik: ["Kebutuhan Rumah", "Dapur"],
      "Perawatan Tubuh": ["Ibu Dan Anak", "Kebutuhan Rumah"],
      Pakaian: ["Ibu Dan Anak", "Kebutuhan Rumah"],
    };

    // Find the main category (case insensitive)
    const allCategories = await prisma.category.findMany({
      where: { isDeleted: false },
      select: { name: true },
    });

    const categoryNames = allCategories.map((cat) => cat.name);
    const mainCategory = categoryNames.find(
      (cat) => cat.toLowerCase() === categoryDisplayName.toLowerCase()
    );

    if (!mainCategory) {
      return res.status(404).json({
        message: "Category not found",
        error: `Category "${categoryDisplayName}" does not exist`,
      });
    }

    console.log("Found main category:", mainCategory);

    // Get related categories
    const relatedCategoryNames = relatedCategories[mainCategory] || [];
    const allRelatedCategories = [mainCategory, ...relatedCategoryNames];

    console.log("Searching in categories:", allRelatedCategories);

    // Fetch products from main category first, then related categories
    let allProducts = [];
    let totalFetched = 0;
    const targetCount = parsedOffset + parsedLimit + 10; // Fetch extra for randomization

    // First, try to get products from main and related categories
    for (const category of allRelatedCategories) {
      if (totalFetched >= targetCount) break;

      const categoryProducts = await prisma.product.findMany({
        where: {
          isDeleted: false,
          isActive: true,
          category: {
            name: category,
            isDeleted: false,
          },
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
        take: Math.min(15, targetCount - totalFetched), // Limit per category
      });

      allProducts = [...allProducts, ...categoryProducts];
      totalFetched += categoryProducts.length;
      console.log(
        `Found ${categoryProducts.length} products in category: ${category} (total: ${totalFetched})`
      );
    }

    // If we still don't have enough products, fetch from other categories
    if (totalFetched < targetCount) {
      const remainingCategories = categoryNames.filter(
        (cat) => !allRelatedCategories.includes(cat)
      );

      // Shuffle remaining categories for random selection
      const shuffledRemaining = remainingCategories.sort(
        () => Math.random() - 0.5
      );

      for (const category of shuffledRemaining) {
        if (totalFetched >= targetCount) break;

        const categoryProducts = await prisma.product.findMany({
          where: {
            isDeleted: false,
            isActive: true,
            category: {
              name: category,
              isDeleted: false,
            },
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
          take: Math.min(10, targetCount - totalFetched),
        });

        allProducts = [...allProducts, ...categoryProducts];
        totalFetched += categoryProducts.length;
        console.log(
          `Found ${categoryProducts.length} additional products in category: ${category} (total: ${totalFetched})`
        );
      }
    }

    // Randomize the products
    const shuffledProducts = allProducts.sort(() => Math.random() - 0.5);

    // Apply pagination
    const paginatedProducts = shuffledProducts.slice(
      parsedOffset,
      parsedOffset + parsedLimit
    );

    // Get total count for pagination info
    const totalCount = shuffledProducts.length;

    console.log(
      `✅ Found ${totalCount} total products, returning ${paginatedProducts.length} products (offset: ${parsedOffset})`
    );

    // Serialize BigInt values
    const serializedProducts = serializeBigInt(paginatedProducts);

    // Calculate pagination info
    const hasNextPage = parsedOffset + parsedLimit < totalCount;
    const hasPreviousPage = parsedOffset > 0;
    const totalPages = Math.ceil(totalCount / parsedLimit);
    const currentPage = Math.floor(parsedOffset / parsedLimit) + 1;

    return res.status(200).json({
      message: "Related products retrieved successfully",
      products: serializedProducts,
      pagination: {
        offset: parsedOffset,
        limit: parsedLimit,
        total: totalCount,
        currentPage,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      mainCategory: mainCategory,
      searchedCategories: allRelatedCategories,
    });
  } catch (error) {
    console.error("❌ Get related products error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// GET /inventory/product/:id - Get product detail by ID
router.get("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("📦 Fetching product detail for ID:", id);

    // Validate ID format (should be UUID)
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Invalid product ID",
        error: "Product ID is required and must be a valid string",
      });
    }

    // Fetch product by ID with all related data
    const product = await prisma.product.findUnique({
      where: {
        id: id,
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
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        error: `Product with ID "${id}" does not exist or is not active`,
      });
    }

    console.log(`✅ Found product: ${product.name}`);

    // Serialize BigInt values (for sellingPrice from Decimal type)
    const serializedProduct = serializeBigInt(product);

    return res.status(200).json({
      message: "Product detail retrieved successfully",
      product: serializedProduct,
    });
  } catch (error) {
    console.error("❌ Get product detail error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
