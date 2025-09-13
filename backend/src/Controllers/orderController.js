import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";

router.post("/checkout", async (req, res) => {
  try {
    const { userId, deliveryAddressId, cartItemIds } = req.body;

    if (!userId || !deliveryAddressId || !Array.isArray(cartItemIds) || cartItemIds.length === 0) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // fetch semua cart items berdasarkan id
    const cartItems = await prisma.cartItem.findMany({
      where: {
        id: { in: cartItemIds },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sellingPrice: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return res.status(404).json({ message: "Cart items not found" });
    }

    // buat order baru
    const order = await prisma.order.create({
      data: {
        userId,
        deliveryAddressId,
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
      },
    });

    // buat order items dari cart items
    const orderItemsData = cartItems.map((item) => ({
      orderId: order.id,
      productId: item.product.id,
      quantity: item.quantity,
    }));

    await prisma.orderItem.createMany({
      data: orderItemsData,
    });

    // update cart items → kurangi quantity atau hapus jika sudah habis
    for (const item of cartItems) {
      if (item.quantity > 1) {
        // kalau quantity masih ada sisa → kurangi sesuai yg di-checkout
        await prisma.cartItem.update({
          where: { id: item.id },
          data: {
            quantity: item.quantity - item.quantity, // hasilnya 0
          },
        });

        // hapus jika sudah jadi 0
        await prisma.cartItem.delete({
          where: { id: item.id },
        });
      } else {
        // langsung hapus kalau quantity = 1
        await prisma.cartItem.delete({
          where: { id: item.id },
        });
      }
    }

    // format response: nama produk, quantity, total per item
    const summary = cartItems.map((item) => {
      const total = Number(item.product.sellingPrice) * item.quantity;
      return {
        productName: item.product.name,
        quantity: item.quantity,
        total,
      };
    });

    // hitung subtotal
    const subtotal = summary.reduce((acc, item) => acc + item.total, 0);

    return res.status(201).json({
      message: "Order created successfully",
      orderId: order.id,
      items: summary,
      subtotal,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;