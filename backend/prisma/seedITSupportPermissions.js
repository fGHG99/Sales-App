import prisma from "../utils/prisma.js";

const seedITSupportPermissions = async () => {
  console.log("🌱 Seeding IT Support permissions...");

  try {
    // 1. Create permissions for IT Support
    const supportPermissions = [
      // Role management
      { accessKey: "support.role.view" },
      { accessKey: "support.role.create" },
      { accessKey: "support.role.update" },
      { accessKey: "support.role.delete" },

      // Permission management
      { accessKey: "support.permission.view" },
      { accessKey: "support.permission.create" },
      { accessKey: "support.permission.update" },
      { accessKey: "support.permission.delete" },

      // User management
      { accessKey: "support.user.view" },
      { accessKey: "support.user.create" },
      { accessKey: "support.user.update" },
      { accessKey: "support.user.delete" },

      // General support access
      { accessKey: "support.access" },
    ];

    // Create permissions (skip if already exists)
    const createdPermissions = [];
    for (const perm of supportPermissions) {
      const existing = await prisma.accessPermission.findFirst({
        where: { accessKey: perm.accessKey, isDeleted: false },
      });

      if (!existing) {
        const created = await prisma.accessPermission.create({
          data: perm,
        });
        createdPermissions.push(created);
        console.log(`✅ Created permission: ${perm.accessKey}`);
      } else {
        console.log(`⏭️  Permission already exists: ${perm.accessKey}`);
        createdPermissions.push(existing);
      }
    }

    // 2. Find or create IT Support role
    let itSupportRole = await prisma.role.findUnique({
      where: { roleType: "itsupport" },
    });

    if (!itSupportRole) {
      itSupportRole = await prisma.role.create({
        data: {
          name: "IT Support",
          roleType: "itsupport",
          isSystem: true, // System role cannot be deleted
          isDefault: false,
        },
      });
      console.log("✅ Created IT Support role");
    } else {
      console.log("⏭️  IT Support role already exists");
    }

    // 3. Assign all permissions to IT Support role
    await prisma.role.update({
      where: { id: itSupportRole.id },
      data: {
        permissions: {
          connect: createdPermissions.map((p) => ({ id: p.id })),
        },
      },
    });
    console.log(
      `✅ Assigned ${createdPermissions.length} permissions to IT Support role`
    );

    // 4. Summary
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: itSupportRole.id },
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
    });

    console.log("\n📊 IT Support Role Summary:");
    console.log(`   Role ID: ${roleWithPermissions.id}`);
    console.log(`   Role Name: ${roleWithPermissions.name}`);
    console.log(`   Role Type: ${roleWithPermissions.roleType}`);
    console.log(
      `   Total Permissions: ${roleWithPermissions.permissions.length}`
    );
    console.log(`   Total Users: ${roleWithPermissions._count.users}`);
    console.log("\n✅ IT Support permissions seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding IT Support permissions:", error);
    throw error;
  }
};

// Run seed
seedITSupportPermissions()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
