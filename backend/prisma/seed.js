// prisma/seed.js
import prisma from "../utils/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================================
  // 1. Seed Roles and Access Permissions (including IT Support)
  // ============================================================
  console.log("\n📝 Creating roles and permissions...");

  const rolesData = [
    {
      name: "superadmin",
      roleType: "superadmin",
      permissions: [
        "user.create",
        "user.read",
        "user.update",
        "user.delete",
        "product.create",
        "product.read",
        "product.update",
        "product.delete",
        "order.create",
        "order.read",
        "order.update",
        "order.delete",
        "category.create",
        "category.read",
        "category.update",
        "category.delete",
        "role.create",
        "role.read",
        "role.update",
        "role.delete",
        "dispute.create",
        "dispute.read",
        "dispute.update",
        "dispute.delete",
        "audit.read",
        "system.manage",
      ],
    },
    {
      name: "admin",
      roleType: "admin",
      permissions: [
        "user.read",
        "user.update",
        "product.create",
        "product.read",
        "product.update",
        "product.delete",
        "order.read",
        "order.update",
        "category.create",
        "category.read",
        "category.update",
        "dispute.read",
        "dispute.update",
        "audit.read",
      ],
    },
    {
      name: "courier",
      roleType: "courier",
      permissions: ["order.read", "order.update", "user.read"],
    },
    {
      name: "user",
      roleType: "user",
      permissions: [
        "product.read",
        "order.create",
        "order.read",
        "category.read",
        "dispute.create",
        "dispute.read",
      ],
    },
    {
      name: "itsupport",
      roleType: "itsupport",
      permissions: [
        "user.read",
        "user.update",
        "product.read",
        "order.read",
        "category.read",
        "audit.read",
        "system.manage",
        // IT Support specific permissions
        "support.role.view",
        "support.role.create",
        "support.role.update",
        "support.role.delete",
        "support.permission.view",
        "support.permission.create",
        "support.permission.update",
        "support.permission.delete",
        "support.user.view",
        "support.user.create",
        "support.user.update",
        "support.user.delete",
        "support.access",
      ],
    },
  ];

  const createdRoles = {};

  for (const roleData of rolesData) {
    // Create access permissions for this role
    const permissionsToCreate = [];

    for (const accessKey of roleData.permissions) {
      // Check if permission already exists
      let permission = await prisma.accessPermission.findFirst({
        where: { accessKey, isDeleted: false },
      });

      if (!permission) {
        permission = await prisma.accessPermission.create({
          data: { accessKey },
        });
        console.log(`   ✅ Created permission: ${accessKey}`);
      }

      permissionsToCreate.push({ id: permission.id });
    }

    // Create role with permissions
    const role = await prisma.role.upsert({
      where: { roleType: roleData.roleType },
      update: {
        permissions: {
          set: permissionsToCreate,
        },
      },
      create: {
        name: roleData.name,
        roleType: roleData.roleType,
        isDefault: roleData.roleType === "user",
        isSystem: true, // prevent deletion
        permissions: {
          connect: permissionsToCreate,
        },
      },
    });

    createdRoles[roleData.roleType] = role;
    console.log(
      `✅ Role created: ${role.name} with ${roleData.permissions.length} permissions`
    );
  }

  // ============================================================
  // 2. Seed Users
  // ============================================================
  console.log("\n👥 Creating users...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const usersData = [
    {
      name: "Super Admin",
      email: "superadmin@test.com",
      phone: "081234567890",
      password: hashedPassword,
      sex: "MALE",
      dob: new Date("1990-01-01"),
      isVerified: true,
      roleType: "superadmin",
      workAreaPostalCodes: [],
    },
    {
      name: "Admin User",
      email: "admin@test.com",
      phone: "081234567891",
      password: hashedPassword,
      sex: "FEMALE",
      dob: new Date("1992-05-15"),
      isVerified: true,
      roleType: "admin",
      workAreaPostalCodes: [],
    },
    {
      name: "Kurir Satu",
      email: "courier1@test.com",
      phone: "081234567892",
      password: hashedPassword,
      sex: "MALE",
      dob: new Date("1995-08-20"),
      isVerified: true,
      roleType: "courier",
      workAreaPostalCodes: ["40111", "40112", "40113"],
    },
    {
      name: "Kurir Dua",
      email: "courier2@test.com",
      phone: "081234567893",
      password: hashedPassword,
      sex: "MALE",
      dob: new Date("1993-03-10"),
      isVerified: true,
      roleType: "courier",
      workAreaPostalCodes: ["40114", "40115", "40116"],
    },
    {
      name: "Regular User One",
      email: "user1@test.com",
      phone: "081234567894",
      password: hashedPassword,
      sex: "FEMALE",
      dob: new Date("1998-12-25"),
      isVerified: true,
      roleType: "user",
      workAreaPostalCodes: [],
    },
    {
      name: "Regular User Two",
      email: "user2@test.com",
      phone: "081234567895",
      password: hashedPassword,
      sex: "MALE",
      dob: new Date("1997-07-07"),
      isVerified: true,
      roleType: "user",
      workAreaPostalCodes: [],
    },
    {
      name: "IT Support",
      email: "itsupport@test.com",
      phone: "081234567896",
      password: hashedPassword,
      sex: "MALE",
      dob: new Date("1991-11-11"),
      isVerified: true,
      roleType: "itsupport",
      workAreaPostalCodes: [],
    },
  ];

  const createdUsers = {};

  for (const userData of usersData) {
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        sex: userData.sex,
        dob: userData.dob,
        isVerified: userData.isVerified,
        workAreaPostalCodes: userData.workAreaPostalCodes,
        roleId: createdRoles[userData.roleType].id,
      },
    });

    createdUsers[userData.roleType] = createdUsers[userData.roleType] || [];
    createdUsers[userData.roleType].push(user);
    console.log(`✅ User created: ${user.name} (${user.email})`);
  }

  // ============================================================
  // 3. Seed Categories
  // ============================================================
  console.log("\n📦 Creating categories...");

  const categories = [
    { name: "Makanan", description: "Aneka makanan siap saji" },
    { name: "Bahan Masakan", description: "Bahan untuk memasak sehari-hari" },
    { name: "Minuman", description: "Aneka minuman segar dan kemasan" },
    { name: "Ibu dan Anak", description: "Produk kebutuhan ibu dan anak" },
    { name: "Kebutuhan Rumah", description: "Barang kebutuhan rumah tangga" },
  ];

  const createdCategories = [];

  for (const category of categories) {
    const createdCategory = await prisma.category.create({
      data: {
        name: category.name,
        description: category.description,
      },
    });
    createdCategories.push(createdCategory);
    console.log(`✅ Category created: ${createdCategory.name}`);
  }

  // ============================================================
  // 4. Seed Products with Batches
  // ============================================================
  console.log("\n🛍️  Creating products with inventory...");

  const createdProducts = [];
  let productCount = 0;

  for (const category of createdCategories) {
    for (let i = 1; i <= 5; i++) {
      const product = await prisma.product.create({
        data: {
          name: `${category.name} Product ${i}`,
          barcode: `${category.name.substring(0, 3).toUpperCase()}-${
            productCount + i
          }`,
          description: `Deskripsi untuk ${category.name} produk ${i}`,
          unit: "pcs",
          sellingPrice: 5000 + i * 2000,
          isPerishable:
            category.name === "Makanan" || category.name === "Bahan Masakan",
          categoryId: category.id,
        },
      });

      // Create ProductBatch for this product
      const batch = await prisma.productBatch.create({
        data: {
          productId: product.id,
          quantity: 100 + i * 10,
          costPrice: 3000 + i * 1000,
          status: "AVAILABLE",
          receivedAt: new Date(),
          expiredAt: product.isPerishable
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            : null,
        },
      });

      // Create StockMovement for initial stock
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          productBatchId: batch.id,
          quantity: batch.quantity,
          movementType: "IN",
          note: "Initial stock",
        },
      });

      createdProducts.push(product);
    }
    productCount += 5;
    console.log(`✅ Created 5 products for category: ${category.name}`);
  }

  // ============================================================
  // 5. Seed Addresses for Users
  // ============================================================
  console.log("\n📍 Creating user addresses...");

  const addressesData = [
    {
      userId: createdUsers["user"][0].id,
      recipientName: "Regular User One",
      recipientPhone: "081234567894",
      label: "Rumah",
      fullAddress: "Jl. Merdeka No. 123",
      subDistrict: "Cicendo",
      district: "Cicendo",
      city: "Bandung",
      province: "Jawa Barat",
      country: "Indonesia",
      postalCode: "40111",
      latitude: -6.914744,
      longitude: 107.60981,
    },
    {
      userId: createdUsers["user"][0].id,
      recipientName: "Regular User One",
      recipientPhone: "081234567894",
      label: "Kantor",
      fullAddress: "Jl. Asia Afrika No. 456",
      subDistrict: "Sumur Bandung",
      district: "Sumur Bandung",
      city: "Bandung",
      province: "Jawa Barat",
      country: "Indonesia",
      postalCode: "40112",
      latitude: -6.92184,
      longitude: 107.606343,
    },
    {
      userId: createdUsers["user"][1].id,
      recipientName: "Regular User Two",
      recipientPhone: "081234567895",
      label: "Rumah",
      fullAddress: "Jl. Braga No. 789",
      subDistrict: "Braga",
      district: "Sumur Bandung",
      city: "Bandung",
      province: "Jawa Barat",
      country: "Indonesia",
      postalCode: "40111",
      latitude: -6.917464,
      longitude: 107.609344,
    },
  ];

  const createdAddresses = [];

  for (const addressData of addressesData) {
    const address = await prisma.address.create({
      data: addressData,
    });
    createdAddresses.push(address);
    console.log(
      `✅ Address created: ${address.label} for ${address.recipientName}`
    );
  }

  // ============================================================
  // 6. Seed Store Addresses and Stores
  // ============================================================
  console.log("\n🏪 Creating stores...");

  const storeAddressesData = [
    {
      userId: createdUsers["admin"][0].id,
      fullAddress: "Jl. Cihampelas No. 100",
      subDistrict: "Cipaganti",
      district: "Coblong",
      city: "Bandung",
      province: "Jawa Barat",
      country: "Indonesia",
      postalCode: "40131",
      latitude: -6.9,
      longitude: 107.61567,
    },
    {
      userId: createdUsers["admin"][0].id,
      fullAddress: "Jl. Dago No. 200",
      subDistrict: "Dago",
      district: "Coblong",
      city: "Bandung",
      province: "Jawa Barat",
      country: "Indonesia",
      postalCode: "40135",
      latitude: -6.8625,
      longitude: 107.61879,
    },
  ];

  const createdStores = [];

  for (let i = 0; i < storeAddressesData.length; i++) {
    const storeAddress = await prisma.storeAddress.create({
      data: storeAddressesData[i],
    });

    const store = await prisma.store.create({
      data: {
        name: `Toko Cabang ${i + 1}`,
        phoneNumber: `02212345${i}00`,
        openHour: new Date("2024-01-01T08:00:00Z"),
        closeHour: new Date("2024-01-01T20:00:00Z"),
        isActive: true,
        addressId: storeAddress.id,
        adminId: createdUsers["admin"][0].id,
      },
    });

    createdStores.push(store);
    console.log(`✅ Store created: ${store.name}`);
  }

  // ============================================================
  // 7. Seed Delivery Fee Settings
  // ============================================================
  console.log("\n💰 Creating delivery fee settings...");

  const deliveryFeeSetting = await prisma.deliveryFeeSettings.create({
    data: {
      feeAmount: 10000,
      isActive: true,
      description: "Standard delivery fee",
    },
  });

  console.log(
    `✅ Delivery fee setting created: Rp ${deliveryFeeSetting.feeAmount}`
  );

  // ============================================================
  // 8. Seed Carts
  // ============================================================
  console.log("\n🛒 Creating shopping carts...");

  // Cart for user1 with some items
  const cart1Items = [
    {
      productId: createdProducts[0].id,
      name: createdProducts[0].name,
      quantity: 2,
      price: Number(createdProducts[0].sellingPrice),
    },
    {
      productId: createdProducts[1].id,
      name: createdProducts[1].name,
      quantity: 3,
      price: Number(createdProducts[1].sellingPrice),
    },
  ];

  await prisma.cart.create({
    data: {
      userId: createdUsers["user"][0].id,
      cartItems: cart1Items,
    },
  });

  console.log(`✅ Cart created for ${createdUsers["user"][0].name}`);

  // ============================================================
  // 9. Seed Orders
  // ============================================================
  console.log("\n📦 Creating orders...");

  const ordersData = [
    {
      userId: createdUsers["user"][0].id,
      deliveryAddressId: createdAddresses[0].id,
      courierId: createdUsers["courier"][0].id,
      deliveryType: "DELIVERY",
      orderStatus: "COMPLETED",
      paymentStatus: "COMPLETED",
      orderItems: [
        {
          productId: createdProducts[0].id,
          name: createdProducts[0].name,
          quantity: 2,
          price: Number(createdProducts[0].sellingPrice),
        },
        {
          productId: createdProducts[1].id,
          name: createdProducts[1].name,
          quantity: 1,
          price: Number(createdProducts[1].sellingPrice),
        },
      ],
      subtotal: 0, // will calculate
      deliveryFee: 10000,
      cashAmount: 0, // will calculate
      changeAmount: 0,
    },
    {
      userId: createdUsers["user"][1].id,
      deliveryAddressId: createdAddresses[2].id,
      courierId: createdUsers["courier"][1].id,
      deliveryType: "DELIVERY",
      orderStatus: "OUT_FOR_DELIVERY",
      paymentStatus: "COMPLETED",
      orderItems: [
        {
          productId: createdProducts[2].id,
          name: createdProducts[2].name,
          quantity: 3,
          price: Number(createdProducts[2].sellingPrice),
        },
      ],
      subtotal: 0, // will calculate
      deliveryFee: 10000,
      cashAmount: 0, // will calculate
      changeAmount: 0,
    },
    {
      userId: createdUsers["user"][0].id,
      deliveryAddressId: createdAddresses[1].id,
      pickupStoreId: createdStores[0].id,
      deliveryType: "PICKUP_TO_STORE",
      orderStatus: "READY_FOR_PICKUP",
      paymentStatus: "COMPLETED",
      pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      orderItems: [
        {
          productId: createdProducts[3].id,
          name: createdProducts[3].name,
          quantity: 1,
          price: Number(createdProducts[3].sellingPrice),
        },
      ],
      subtotal: 0, // will calculate
      deliveryFee: 0, // no delivery fee for pickup
      cashAmount: 0, // will calculate
      changeAmount: 0,
      qrCode: JSON.stringify({
        orderId: "will-be-set",
        pickupCode: "PICKUP-001",
      }),
    },
  ];

  const createdOrders = [];

  for (const orderData of ordersData) {
    // Calculate subtotal
    const subtotal = orderData.orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    orderData.subtotal = subtotal;
    orderData.cashAmount = subtotal + orderData.deliveryFee + 5000; // extra 5000
    orderData.changeAmount =
      orderData.cashAmount - (subtotal + orderData.deliveryFee);

    const order = await prisma.order.create({
      data: orderData,
    });

    // Update QR code with actual order ID
    if (order.qrCode) {
      const qrData = JSON.parse(order.qrCode);
      qrData.orderId = order.id;
      await prisma.order.update({
        where: { id: order.id },
        data: { qrCode: JSON.stringify(qrData) },
      });
    }

    createdOrders.push(order);
    console.log(
      `✅ Order created: ${order.id.substring(0, 8)}... (${order.orderStatus})`
    );
  }

  // ============================================================
  // 10. Seed Disputes
  // ============================================================
  console.log("\n⚠️  Creating disputes...");

  const dispute = await prisma.dispute.create({
    data: {
      orderId: createdOrders[0].id,
      userId: createdUsers["user"][0].id,
      reason: "DAMAGED_ITEM",
      status: "PENDING",
      description: "Produk diterima dalam kondisi rusak",
      imageUrl: ["/uploads/disputes/dispute-example.jpg"],
    },
  });

  console.log(
    `✅ Dispute created for order: ${dispute.orderId.substring(0, 8)}...`
  );

  // ============================================================
  // 11. Seed Notifications
  // ============================================================
  console.log("\n🔔 Creating notifications...");

  const notificationsData = [
    {
      userId: createdUsers["user"][0].id,
      type: "ORDER",
      title: "Pesanan Diterima",
      message: "Pesanan Anda telah diterima dan sedang diproses",
      hasRead: false,
      metadata: { orderId: createdOrders[0].id },
    },
    {
      userId: createdUsers["user"][0].id,
      type: "ORDER",
      title: "Pesanan Selesai",
      message: "Pesanan Anda telah selesai dikirim",
      hasRead: true,
      metadata: { orderId: createdOrders[0].id },
    },
    {
      userId: createdUsers["user"][1].id,
      type: "ORDER",
      title: "Kurir Dalam Perjalanan",
      message: "Kurir sedang dalam perjalanan menuju lokasi Anda",
      hasRead: false,
      metadata: { orderId: createdOrders[1].id },
    },
    {
      userId: createdUsers["courier"][0].id,
      type: "INFO",
      title: "Pengiriman Baru",
      message: "Anda mendapat pengiriman baru",
      hasRead: false,
      metadata: { orderId: createdOrders[0].id },
    },
  ];

  for (const notifData of notificationsData) {
    await prisma.notification.create({
      data: notifData,
    });
  }

  console.log(`✅ Created ${notificationsData.length} notifications`);

  // ============================================================
  // 12. Seed Promotional Banners
  // ============================================================
  console.log("\n🎉 Creating promotional banners...");

  const promotionalsData = [
    {
      imageUrl: "/uploads/promotionals/promo-banner-1.jpg",
      altText: "Diskon 50% untuk produk pilihan",
    },
    {
      imageUrl: "/uploads/promotionals/promo-banner-2.jpg",
      altText: "Gratis ongkir untuk pembelian minimum Rp 100.000",
    },
    {
      imageUrl: "/uploads/promotionals/promo-banner-3.jpg",
      altText: "Promo bundling hemat hingga 30%",
    },
  ];

  for (const promoData of promotionalsData) {
    await prisma.promotional.create({
      data: promoData,
    });
  }

  console.log(`✅ Created ${promotionalsData.length} promotional banners`);

  // ============================================================
  // 13. Seed Audit Logs
  // ============================================================
  console.log("\n📋 Creating audit logs...");

  const auditLogsData = [
    {
      userId: createdUsers["superadmin"][0].id,
      action: "LOGIN",
      entity: "User",
      entityId: createdUsers["superadmin"][0].id,
      newValues: { email: "superadmin@test.com", timestamp: new Date() },
    },
    {
      userId: createdUsers["admin"][0].id,
      action: "CREATE",
      entity: "Product",
      entityId: createdProducts[0].id,
      newValues: {
        name: createdProducts[0].name,
        price: createdProducts[0].sellingPrice,
      },
    },
    {
      userId: createdUsers["user"][0].id,
      action: "CREATE",
      entity: "Order",
      entityId: createdOrders[0].id,
      newValues: {
        subtotal: createdOrders[0].subtotal,
        status: createdOrders[0].orderStatus,
      },
    },
    {
      userId: createdUsers["admin"][0].id,
      action: "UPDATE",
      entity: "Order",
      entityId: createdOrders[0].id,
      oldValues: { status: "PENDING" },
      newValues: { status: "COMPLETED" },
    },
  ];

  for (const auditData of auditLogsData) {
    await prisma.auditLog.create({
      data: auditData,
    });
  }

  console.log(`✅ Created ${auditLogsData.length} audit logs`);

  // ============================================================
  // Summary
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));

  const counts = {
    roles: await prisma.role.count(),
    permissions: await prisma.accessPermission.count(),
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    productBatches: await prisma.productBatch.count(),
    stockMovements: await prisma.stockMovement.count(),
    addresses: await prisma.address.count(),
    storeAddresses: await prisma.storeAddress.count(),
    stores: await prisma.store.count(),
    deliveryFeeSettings: await prisma.deliveryFeeSettings.count(),
    carts: await prisma.cart.count(),
    orders: await prisma.order.count(),
    disputes: await prisma.dispute.count(),
    notifications: await prisma.notification.count(),
    promotionals: await prisma.promotional.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log("\n📊 DATABASE SUMMARY:");
  Object.entries(counts).forEach(([key, count]) => {
    console.log(`   ${key.padEnd(20)}: ${count}`);
  });

  console.log("\n🔑 TEST CREDENTIALS:");
  console.log("   All users password: password123");
  console.log("   - superadmin@test.com");
  console.log("   - admin@test.com");
  console.log("   - courier1@test.com");
  console.log("   - courier2@test.com");
  console.log("   - user1@test.com");
  console.log("   - user2@test.com");
  console.log("   - itsupport@test.com");
  console.log("\n✨ Database seeded successfully!\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("\n❌ Seeding error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
