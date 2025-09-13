import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";

/**
 * Helper untuk konversi BigInt -> String atau Number
 * (rekursif untuk nested object/array dari Prisma)
 */
function serializeBigInt(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item));
  } else if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
    );
  } else if (typeof obj === "bigint") {
    return Number(obj); // 👉 ubah ke Number, bisa juga .toString() kalau mau aman
  }
  return obj;
}

// POST /cart/add
router.post("/add", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const quantity = Number(req.body.quantity);

    if (!userId || !productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // cek apakah user punya cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // cek product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // cek apakah product sudah ada di cart
    let cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (cartItem) {
      // update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: cartItem.quantity + quantity },
      });
    } else {
      // buat cartItem baru
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // ambil cart terbaru dengan isi item + product
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        cartItems: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                name: true,
                images: {
                    select: {
                        url: true,
                        altText: true
                    }
                },
                sellingPrice: true,
              },
            },
          },
        },
      },
    });

    // serialize BigInt sebelum dikirim ke frontend
    const serializedCart = serializeBigInt(updatedCart);

    return res.status(200).json({
      message: "Product added to cart",
      cart: serializedCart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
