import express from "express";
import prisma from "../../utils/prisma.js";
import bcrypt from "bcrypt";
import { authenticate, authorize } from "../Middlewares/accessControl.js";

const router = express.Router();

// ========================================
// ROLE MANAGEMENT
// ========================================

// GET all roles
router.get(
  "/roles",
  authenticate,
  authorize("support.role.view"),
  async (req, res) => {
    try {
      const roles = await prisma.role.findMany({
        where: { isDeleted: false },
        include: {
          permissions: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        roles,
      });
    } catch (err) {
      console.error("Error fetching roles:", err);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  }
);

// GET single role by ID
router.get(
  "/roles/:id",
  authenticate,
  authorize("support.role.view"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: true,
          users: {
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!role || role.isDeleted) {
        return res.status(404).json({ error: "Role not found" });
      }

      res.json({
        success: true,
        role,
      });
    } catch (err) {
      console.error("Error fetching role:", err);
      res.status(500).json({ error: "Failed to fetch role" });
    }
  }
);

// POST create new role
router.post(
  "/roles",
  authenticate,
  authorize("support.role.create"),
  async (req, res) => {
    try {
      const { name, roleType, isDefault, isSystem, permissionIds } = req.body;

      // Validation
      if (!name || !roleType) {
        return res
          .status(400)
          .json({ error: "Name and roleType are required" });
      }

      // Check if role with same name already exists (and not deleted)
      const existingRole = await prisma.role.findFirst({
        where: {
          name,
          isDeleted: false,
        },
      });

      if (existingRole) {
        return res
          .status(400)
          .json({ error: "Role with this name already exists" });
      }

      // Check if roleType already exists (and not deleted)
      if (roleType) {
        const existingRoleType = await prisma.role.findFirst({
          where: {
            roleType,
            isDeleted: false,
          },
        });

        if (existingRoleType) {
          return res
            .status(400)
            .json({ error: "Role with this roleType already exists" });
        }
      }

      // Create role with permissions
      const role = await prisma.role.create({
        data: {
          name,
          roleType,
          isDefault: isDefault || false,
          isSystem: isSystem || false,
          permissions:
            permissionIds && permissionIds.length > 0
              ? {
                  connect: permissionIds.map((id) => ({ id })),
                }
              : undefined,
        },
        include: {
          permissions: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Role created successfully",
        role,
      });
    } catch (err) {
      console.error("Error creating role:", err);
      res.status(500).json({ error: "Failed to create role" });
    }
  }
);

// PUT update role
router.put(
  "/roles/:id",
  authenticate,
  authorize("support.role.update"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, roleType, isDefault, permissionIds } = req.body;

      // Check if role exists
      const existingRole = await prisma.role.findUnique({
        where: { id },
        include: { permissions: true },
      });

      if (!existingRole || existingRole.isDeleted) {
        return res.status(404).json({ error: "Role not found" });
      }

      // Prevent updating system roles
      if (existingRole.isSystem) {
        return res.status(403).json({ error: "Cannot update system role" });
      }

      // Check if new name already exists (if changing name)
      if (name && name !== existingRole.name) {
        const duplicateName = await prisma.role.findFirst({
          where: {
            name,
            isDeleted: false,
          },
        });

        if (duplicateName) {
          return res
            .status(400)
            .json({ error: "Role with this name already exists" });
        }
      }

      // Update role
      const role = await prisma.role.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(roleType && { roleType }),
          ...(typeof isDefault === "boolean" && { isDefault }),
          ...(permissionIds && {
            permissions: {
              set: permissionIds.map((permId) => ({ id: permId })),
            },
          }),
        },
        include: {
          permissions: true,
        },
      });

      res.json({
        success: true,
        message: "Role updated successfully",
        role,
      });
    } catch (err) {
      console.error("Error updating role:", err);
      res.status(500).json({ error: "Failed to update role" });
    }
  }
);

// DELETE role (soft delete)
router.delete(
  "/roles/:id",
  authenticate,
  authorize("support.role.delete"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      if (!role || role.isDeleted) {
        return res.status(404).json({ error: "Role not found" });
      }

      // Prevent deleting system roles
      if (role.isSystem) {
        return res.status(403).json({ error: "Cannot delete system role" });
      }

      // Check if role has active users
      const activeUsersCount = await prisma.user.count({
        where: {
          roleId: id,
          isDeleted: false,
        },
      });

      if (activeUsersCount > 0) {
        return res.status(400).json({
          error: `Cannot delete role. ${activeUsersCount} active user(s) are assigned to this role`,
        });
      }

      // Soft delete role
      await prisma.role.update({
        where: { id },
        data: { isDeleted: true },
      });

      res.json({
        success: true,
        message: "Role deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting role:", err);
      res.status(500).json({ error: "Failed to delete role" });
    }
  }
);

// ========================================
// ACCESS PERMISSION MANAGEMENT
// ========================================

// GET all permissions with pagination
router.get(
  "/permissions",
  authenticate,
  authorize("support.permission.view"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = { isDeleted: false };

      const [permissions, total] = await Promise.all([
        prisma.accessPermission.findMany({
          where,
          include: {
            role: {
              where: { isDeleted: false },
              select: {
                id: true,
                name: true,
                roleType: true,
              },
            },
          },
          orderBy: { accessKey: "asc" },
          skip,
          take: parseInt(limit),
        }),
        prisma.accessPermission.count({ where }),
      ]);

      res.json({
        success: true,
        permissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (err) {
      console.error("Error fetching permissions:", err);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  }
);

// GET search permissions by accessKey - returns multiple permissions with pagination
router.get("/permissions/search", authenticate, async (req, res) => {
  try {
    const { accessKey, page = 1, limit = 10} = req.query;

    // Validation: ensure accessKey parameter exists and has minimum length
    if (!accessKey || accessKey.trim().length < 2) {
      return res.status(400).json({
        error: "AccessKey query parameter is required (minimum 2 characters)",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      accessKey: { contains: accessKey.trim(), mode: "insensitive" },
      isDeleted: false,
    };

    // Parallel queries for permissions and total count (efficient)
    const [permissions, total] = await Promise.all([
      prisma.accessPermission.findMany({
        where,
        include: {
          role: {
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              roleType: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { accessKey: "asc" },
      }),
      prisma.accessPermission.count({ where }),
    ]);

    res.json({
      success: true,
      permissions, // Array of permissions
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Error searching permissions:", err);
    res.status(500).json({ error: "Failed to search permissions" });
  }
});

// POST create new permission
router.post(
  "/permissions",
  authenticate,
  authorize("support.permission.create"),
  async (req, res) => {
    try {
      const { accessKey, roleIds } = req.body;

      if (!accessKey) {
        return res.status(400).json({ error: "Access key is required" });
      }

      // Check if permission already exists
      const existing = await prisma.accessPermission.findFirst({
        where: { accessKey, isDeleted: false },
      });

      if (existing) {
        return res
          .status(400)
          .json({ error: "Permission with this access key already exists" });
      }

      // Validate roleIds if provided
      if (roleIds && Array.isArray(roleIds) && roleIds.length > 0) {
        const roles = await prisma.role.findMany({
          where: {
            id: { in: roleIds },
            isDeleted: false,
          },
        });

        if (roles.length !== roleIds.length) {
          return res.status(400).json({
            error: "One or more role IDs are invalid or deleted",
          });
        }
      }

      // Create permission with optional role connections
      const permission = await prisma.accessPermission.create({
        data: {
          accessKey,
          ...(roleIds &&
            roleIds.length > 0 && {
              role: {
                connect: roleIds.map((roleId) => ({ id: roleId })),
              },
            }),
        },
        include: {
          role: {
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              roleType: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Permission created successfully",
        permission,
      });
    } catch (err) {
      console.error("Error creating permission:", err);
      res.status(500).json({ error: "Failed to create permission" });
    }
  }
);

// PUT update permission
router.put(
  "/permissions/:id",
  authenticate,
  authorize("support.permission.update"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { accessKey, roleIds } = req.body;

      if (!accessKey) {
        return res.status(400).json({ error: "Access key is required" });
      }

      // Check if permission exists
      const existing = await prisma.accessPermission.findUnique({
        where: { id },
        include: { role: true },
      });

      if (!existing || existing.isDeleted) {
        return res.status(404).json({ error: "Permission not found" });
      }

      // Check if new access key already exists (if changing)
      if (accessKey !== existing.accessKey) {
        const duplicate = await prisma.accessPermission.findFirst({
          where: {
            accessKey,
            isDeleted: false,
            NOT: { id },
          },
        });

        if (duplicate) {
          return res
            .status(400)
            .json({ error: "Permission with this access key already exists" });
        }
      }

      // Validate roleIds if provided
      if (roleIds !== undefined) {
        if (Array.isArray(roleIds) && roleIds.length > 0) {
          const roles = await prisma.role.findMany({
            where: {
              id: { in: roleIds },
              isDeleted: false,
            },
          });

          if (roles.length !== roleIds.length) {
            return res.status(400).json({
              error: "One or more role IDs are invalid or deleted",
            });
          }
        }
      }

      // Update permission
      const permission = await prisma.accessPermission.update({
        where: { id },
        data: {
          accessKey,
          ...(roleIds !== undefined && {
            role: {
              set: roleIds.map((roleId) => ({ id: roleId })),
            },
          }),
        },
        include: {
          role: {
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              roleType: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: "Permission updated successfully",
        permission,
      });
    } catch (err) {
      console.error("Error updating permission:", err);
      res.status(500).json({ error: "Failed to update permission" });
    }
  }
);

// DELETE permission (soft delete with role disconnection)
router.delete(
  "/permissions/:id",
  authenticate,
  authorize("support.permission.delete"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const permission = await prisma.accessPermission.findUnique({
        where: { id },
        include: {
          role: {
            select: { id: true, name: true },
          },
        },
      });

      if (!permission || permission.isDeleted) {
        return res.status(404).json({ error: "Permission not found" });
      }

      // Use transaction to ensure atomicity:
      // 1. Disconnect permission from all roles
      // 2. Soft delete the permission
      await prisma.$transaction(async (tx) => {
        // Step 1: Disconnect from all roles (prevent ambiguous data)
        await tx.accessPermission.update({
          where: { id },
          data: {
            role: {
              set: [], // Disconnect all roles
            },
          },
        });

        // Step 2: Soft delete the permission
        await tx.accessPermission.update({
          where: { id },
          data: { isDeleted: true },
        });
      });

      res.json({
        success: true,
        message:
          "Permission deleted successfully and disconnected from all roles",
        affectedRoles: permission.role.length,
      });
    } catch (err) {
      console.error("Error deleting permission:", err);
      res.status(500).json({ error: "Failed to delete permission" });
    }
  }
);

// ========================================
// USER MANAGEMENT
// ========================================

// GET all users with pagination
router.get(
  "/users",
  authenticate,
  authorize("support.user.view"),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        roleId,
        includeDeleted,
      } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {
        // Only filter isDeleted if includeDeleted is not 'true'
        ...(includeDeleted !== "true" && { isDeleted: false }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(roleId && { roleId }),
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            sex: true,
            dob: true,
            isVerified: true,
            isDeleted: true,
            createdAt: true,
            role: {
              select: {
                id: true,
                name: true,
                roleType: true,
              },
            },
          },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

// GET single user by ID
router.get(
  "/users/:id",
  authenticate,
  authorize("support.user.view"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          sex: true,
          dob: true,
          isVerified: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              name: true,
              roleType: true,
              permissions: {
                select: {
                  id: true,
                  accessKey: true,
                },
              },
            },
          },
          addresses: {
            select: {
              id: true,
              label: true,
              fullAddress: true,
              city: true,
              province: true,
            },
          },
        },
      });

      if (!user || user.isDeleted) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        success: true,
        user,
      });
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
);

// GET search users by name - returns multiple users with pagination
router.get("/get-user/search", authenticate, async (req, res) => {
  try {
    const { name, page = 1, limit = 10, includeDeleted } = req.query;

    // Validation: ensure name parameter exists and has minimum length
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        error: "Name query parameter is required (minimum 2 characters)",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      name: { contains: name.trim(), mode: "insensitive" },
      // Only filter isDeleted if includeDeleted is not 'true'
      ...(includeDeleted !== "true" && { isDeleted: false }),
    };

    // Parallel queries for users and total count (efficient)
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          sex: true,
          dob: true,
          isVerified: true,
          isDeleted: true, // Include isDeleted field in response
          createdAt: true,
          role: {
            select: {
              id: true,
              name: true,
              roleType: true,
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      users, // Array of users
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: "Failed to search users" });
  }
});

// POST create new user
router.post("/users", authenticate, async (req, res) => {
  try {
    const { name, email, password, phone, sex, dob, roleId } = req.body;

    // Validation
    if (!name || !email || !password || !roleId) {
      return res.status(400).json({
        error: "Name, email, password, and roleId are required",
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Check if phone exists (if provided)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        return res
          .status(400)
          .json({ error: "User with this phone already exists" });
      }
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        sex,
        dob: dob ? new Date(dob) : null,
        roleId,
        isVerified: true, // IT Support created users are auto-verified
        createdById: req.user.id, // Track who created this user
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        sex: true,
        dob: true,
        isVerified: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            roleType: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PUT update user
router.put(
  "/users/:id",
  authenticate,
  authorize("support.user.update"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, sex, dob, roleId, isVerified } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser || existingUser.isDeleted) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check email uniqueness (if changing)
      if (email && email !== existingUser.email) {
        const duplicateEmail = await prisma.user.findUnique({
          where: { email },
        });

        if (duplicateEmail) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }

      // Check phone uniqueness (if changing)
      if (phone && phone !== existingUser.phone) {
        const duplicatePhone = await prisma.user.findUnique({
          where: { phone },
        });

        if (duplicatePhone) {
          return res.status(400).json({ error: "Phone already in use" });
        }
      }

      // Check if role exists (if changing)
      if (roleId && roleId !== existingUser.roleId) {
        const role = await prisma.role.findUnique({
          where: { id: roleId },
        });

        if (!role) {
          return res.status(404).json({ error: "Role not found" });
        }
      }

      // Update user
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone !== undefined && { phone }),
          ...(sex && { sex }),
          ...(dob && { dob: new Date(dob) }),
          ...(roleId && { roleId }),
          ...(typeof isVerified === "boolean" && { isVerified }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          sex: true,
          dob: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              name: true,
              roleType: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: "User updated successfully",
        user,
      });
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

// DELETE user (soft delete)
router.delete(
  "/users/:id",
  authenticate,
  authorize("support.user.delete"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user || user.isDeleted) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent deleting self
      if (user.id === req.user.id) {
        return res
          .status(403)
          .json({ error: "Cannot delete your own account" });
      }

      // Soft delete
      await prisma.user.update({
        where: { id },
        data: { isDeleted: true },
      });

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);

// PUT reset user password
router.put(
  "/users/:id/reset-password",
  authenticate,
  authorize("support.user.update"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          error: "New password is required and must be at least 6 characters",
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user || user.isDeleted) {
        return res.status(404).json({ error: "User not found" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (err) {
      console.error("Error resetting password:", err);
      res.status(500).json({ error: "Failed to reset password" });
    }
  }
);

export default router;
