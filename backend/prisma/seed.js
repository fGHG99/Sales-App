// prisma/seed.js
import prisma from "../utils/prisma.js";

async function main() {
  console.log("🌱 Seeding database...");

  // Seed Roles and Access Permissions
  console.log("📝 Creating roles and permissions...");

  const rolesData = [
    {
      name: "superadmin",
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
      permissions: ["order.read", "order.update", "user.read"],
    },
    {
      name: "user",
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
      permissions: [
        "user.read",
        "user.update",
        "product.read",
        "order.read",
        "category.read",
        "audit.read",
        "system.manage",
      ],
    },
  ];

  for (const roleData of rolesData) {
    // Create access permissions for this role
    const permissionsToCreate = [];

    for (const accessKey of roleData.permissions) {
      // Check if permission already exists
      let permission = await prisma.accessPermission.findFirst({
        where: { accessKey },
      });

      if (!permission) {
        permission = await prisma.accessPermission.create({
          data: { accessKey },
        });
      }

      permissionsToCreate.push({ id: permission.id });
    }

    // Create role with permissions
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        permissions: {
          set: permissionsToCreate,
        },
      },
      create: {
        name: roleData.name,
        roleType: roleData.name.toLowerCase(),
        isDefault: roleData.name === "user",
        isSystem: true, // prevent deletion
        permissions: {
          connect: permissionsToCreate,
        },
      },
    });
    console.log(
      `✅ Role created: ${role.name} with ${roleData.permissions.length} permissions`
    );
  }

  console.log("📦 Creating categories and products...");

  const categories = [
    { name: "Makanan", description: "Aneka makanan siap saji" },
    { name: "Bahan Masakan", description: "Bahan untuk memasak sehari-hari" },
    { name: "Minuman", description: "Aneka minuman segar dan kemasan" },
    { name: "Ibu dan Anak", description: "Produk kebutuhan ibu dan anak" },
    { name: "Kebutuhan Rumah", description: "Barang kebutuhan rumah tangga" },
  ];

  for (const category of categories) {
    const createdCategory = await prisma.category.create({
      data: {
        name: category.name,
        description: category.description,
        products: {
          create: Array.from({ length: 5 }).map((_, i) => ({
            name: `${category.name} Product ${i + 1}`,
            barcode: `${category.name.substring(0, 3).toUpperCase()}-${i + 1}`,
            description: `Deskripsi untuk ${category.name} produk ${i + 1}`,
            unit: "pcs",
            sellingPrice: 1000 * (i + 1), // harga dummy
            isPerishable:
              category.name === "Makanan" || category.name === "Bahan Masakan",
          })),
        },
      },
    });

    console.log(`✅ Category created: ${createdCategory.name}`);
  }

  console.log("🌱 Seeding selesai!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
