import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate } from "../Middlewares/accessControl.js";
import { logUpdate } from "../../utils/auditlog.js";

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
    return Number(obj); // 👉 ubah ke Number, bisa juga .toString() kalau mau aman
  }
  return obj;
}

// GET /cart/:userId - Get user's cart with all items
router.get("/get-cart", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // Get userId from authenticated user

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find cart for the user
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!cart) {
      return res.status(200).json({
        message: "Cart not found, returning empty cart",
        cart: {
          id: null,
          userId,
          cartItems: [],
          totalItems: 0,
          totalPrice: 0,
        },
      });
    }

    // Parse cartItems from JSON
    const cartItems = cart.cartItems || [];

    // Calculate totals
    let totalItems = 0;
    let totalPrice = 0;

    if (Array.isArray(cartItems)) {
      totalItems = cartItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
      totalPrice = cartItems.reduce((sum, item) => {
        const price = Number(item.sellingPrice || 0);
        const quantity = item.quantity || 0;
        return sum + price * quantity;
      }, 0);
    }

    // Serialize BigInt values
    const serializedCart = serializeBigInt({
      id: cart.id,
      userId: cart.userId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      cartItems: cartItems,
      totalItems,
      totalPrice,
      user: cart.user,
    });

    return res.status(200).json({
      message: "Cart retrieved successfully",
      cart: serializedCart,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /cart/add or update quantity
router.post("/add", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // Get userId from authenticated user
    const { productId } = req.body;
    const quantity = Number(req.body.quantity);

    if (!productId || !quantity) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          select: {
            url: true,
            altText: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find or create cart for authenticated user
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    let isNewCart = false;
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          cartItems: [],
        },
      });
      isNewCart = true;
    }

    // Get current cart items (parse from JSON)
    let cartItems = Array.isArray(cart.cartItems) ? cart.cartItems : [];
    const oldCartItems = [...cartItems]; // Store old state for audit

    // Check if product already exists in cart
    const existingItemIndex = cartItems.findIndex(
      (item) => item.productId === productId
    );

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      cartItems[existingItemIndex].quantity += quantity;

      // If quantity becomes 0 or negative, remove the item
      if (cartItems[existingItemIndex].quantity <= 0) {
        cartItems.splice(existingItemIndex, 1);
      }
    } else {
      // Only add new item if quantity is positive
      if (quantity > 0) {
        const newItem = {
          productId: product.id,
          name: product.name,
          quantity: quantity,
          sellingPrice: Number(product.sellingPrice),
          images: product.images,
        };
        cartItems.push(newItem);
      }
    }

    // Update cart with new items
    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        cartItems: cartItems,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Calculate totals
    let totalItems = 0;
    let totalPrice = 0;

    if (Array.isArray(updatedCart.cartItems)) {
      totalItems = updatedCart.cartItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
      totalPrice = updatedCart.cartItems.reduce((sum, item) => {
        const price = Number(item.sellingPrice || 0);
        const quantity = item.quantity || 0;
        return sum + price * quantity;
      }, 0);
    }

    // Serialize BigInt values
    const serializedCart = serializeBigInt({
      id: updatedCart.id,
      userId: updatedCart.userId,
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt,
      cartItems: updatedCart.cartItems,
      totalItems,
      totalPrice,
      user: updatedCart.user,
    });

    return res.status(200).json({
      message: "Cart updated successfully",
      cart: serializedCart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /cart/remove-item - Remove specific item(s) from cart
router.patch("/remove-item", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, productIds } = req.body;

    // Support both single productId and array of productIds
    let idsToRemove = [];

    if (productId) {
      // Single product deletion
      idsToRemove = [productId];
    } else if (productIds && Array.isArray(productIds)) {
      // Bulk deletion
      idsToRemove = productIds;
    } else {
      return res.status(400).json({
        message: "Either productId or productIds array is required",
      });
    }

    if (idsToRemove.length === 0) {
      return res.status(400).json({
        message: "At least one product ID is required",
      });
    }

    // Find user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Get current cart items
    let cartItems = Array.isArray(cart.cartItems) ? cart.cartItems : [];
    const oldCartItems = [...cartItems]; // Store old state for audit

    // Filter out the items to remove
    const filteredItems = cartItems.filter(
      (item) => !idsToRemove.includes(item.productId)
    );

    const removedCount = cartItems.length - filteredItems.length;

    if (removedCount === 0) {
      return res.status(404).json({
        message: "None of the specified items were found in cart",
      });
    }

    // Update cart with filtered items
    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        cartItems: filteredItems,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Calculate totals
    let totalItems = 0;
    let totalPrice = 0;

    if (Array.isArray(updatedCart.cartItems)) {
      totalItems = updatedCart.cartItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
      totalPrice = updatedCart.cartItems.reduce((sum, item) => {
        const price = Number(item.sellingPrice || 0);
        const quantity = item.quantity || 0;
        return sum + price * quantity;
      }, 0);
    }

    // Serialize BigInt values
    const serializedCart = serializeBigInt({
      id: updatedCart.id,
      userId: updatedCart.userId,
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt,
      cartItems: updatedCart.cartItems,
      totalItems,
      totalPrice,
      user: updatedCart.user,
    });

    return res.status(200).json({
      message: `${removedCount} item(s) removed from cart`,
      removedCount,
      cart: serializedCart,
    });
  } catch (error) {
    console.error("Remove item error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /cart/clear - Clear all items from cart
router.delete("/clear", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Store old cart items for audit
    const oldCartItems = Array.isArray(cart.cartItems) ? cart.cartItems : [];
    const oldTotalItems = oldCartItems.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    // Clear all items
    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        cartItems: [],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Serialize BigInt values
    const serializedCart = serializeBigInt({
      id: updatedCart.id,
      userId: updatedCart.userId,
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt,
      cartItems: [],
      totalItems: 0,
      totalPrice: 0,
      user: updatedCart.user,
    });

    // Log cart clear
    logUpdate(
      "Cart",
      updatedCart.id,
      {
        cartItems: oldCartItems,
        totalItems: oldTotalItems,
        itemsCount: oldCartItems.length,
      },
      {
        cartItems: [],
        totalItems: 0,
        itemsCount: 0,
        action: "cleared",
      },
      userId
    );

    return res.status(200).json({
      message: "Cart cleared successfully",
      cart: serializedCart,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
