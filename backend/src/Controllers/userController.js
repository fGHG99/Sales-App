import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authorize, authenticate } from "../Middlewares/accessControl.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/profile-pictures";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024, // 200KB max file size
  },
});

router.post("/create", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get notifications for the authenticated user
router.get("/notifications", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, limit, cursor } = req.query;

    const maxLimit = 50;
    const defaultLimit = 20;
    const parsedLimit = Number.parseInt(limit, 10);
    const take = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), maxLimit)
      : defaultLimit;

    const whereClause = {
      userId,
      ...(type ? { type: type } : {}),
    };

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        hasRead: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const nextCursor =
      notifications.length === take
        ? notifications[notifications.length - 1].id
        : null;

    return res.json({
      notifications,
      nextCursor,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get notification counts (all, ORDER, INFO)
router.get("/notifications/count", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [allCount, orderCount, infoCount] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, type: "ORDER" } }),
      prisma.notification.count({ where: { userId, type: "INFO" } }),
    ]);

    return res.json({ total: allCount, ORDER: orderCount, INFO: infoCount });
  } catch (error) {
    console.error("Get notifications count error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark a notification as read
router.patch("/notifications/:id/read", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notif = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notif)
      return res.status(404).json({ error: "Notification not found" });

    const updated = await prisma.notification.update({
      where: { id },
      data: { hasRead: true },
      select: { id: true, hasRead: true },
    });
    return res.json({ notification: updated });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/test", authenticate, authorize("VIEW_TEST"), async (req, res) => {
  res.send("hi");
});

// Get authenticated user's data
router.get("/me", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // from authenticate middleware

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        image: true,
        addresses: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: user,
    });
  } catch (error) {
    console.error("Get user data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get access permissions owned by the authenticated user's role
router.get("/permissions", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              where: { isDeleted: false },
              select: { id: true, accessKey: true },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return res.status(404).json({ error: "Role not found for user" });
    }

    const permissions = user.role.permissions.map((p) => p.accessKey);

    return res.json({
      role: {
        id: user.role.id,
        name: user.role.name,
      },
      permissions,
    });
  } catch (error) {
    console.error("Get permissions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile
router.put("/profile", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // from authenticate middleware (changed from req.user.userId)
    const { name, phone, sex, dob } = req.body;

    // Validate inputs
    const updateData = {};

    if (name) {
      if (name.trim().length < 2) {
        return res
          .status(400)
          .json({ error: "Name must be at least 2 characters" });
      }
      updateData.name = name.trim();
    }

    if (phone) {
      // Check if phone is already taken by another user
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: phone,
          NOT: { id: userId },
        },
      });

      if (existingPhone) {
        return res.status(400).json({ error: "Phone number already in use" });
      }
      updateData.phone = phone;
    }

    if (sex) {
      if (!["MALE", "FEMALE"].includes(sex)) {
        return res
          .status(400)
          .json({ error: "Invalid gender. Must be MALE or FEMALE" });
      }
      updateData.sex = sex;
    }

    if (dob) {
      // Validate date format and convert to DateTime
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        return res.status(400).json({ error: "Invalid date of birth format" });
      }
      updateData.dob = dobDate;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        sex: true,
        dob: true,
        image: {
          select: {
            url: true,
            thumbnailUrl: true,
          },
        },
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upload profile picture
router.post(
  "/profile/picture",
  authenticate,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const userId = req.user.id; // from authenticate middleware (changed from req.user.userId)

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Get the file path (relative to server root)
      const imageUrl = `/uploads/profile-pictures/${req.file.filename}`;

      // Check if user already has a profile picture
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { image: true },
      });

      // If user has an existing image, delete the old file
      if (existingUser.image) {
        const oldImagePath = path.join(process.cwd(), existingUser.image.url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }

        // Update existing image record
        await prisma.image.update({
          where: { id: existingUser.imageId },
          data: {
            url: imageUrl,
            thumbnailUrl: imageUrl,
            altText: `${existingUser.name}'s profile picture`,
          },
        });
      } else {
        // Create new image record
        const newImage = await prisma.image.create({
          data: {
            url: imageUrl,
            thumbnailUrl: imageUrl,
            altText: `${existingUser.name}'s profile picture`,
          },
        });

        // Link image to user
        await prisma.user.update({
          where: { id: userId },
          data: { imageId: newImage.id },
        });
      }

      res.json({
        message: "Profile picture uploaded successfully",
        imageUrl: imageUrl,
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);

      // Delete uploaded file if database operation fails
      if (req.file) {
        const filePath = path.join(
          process.cwd(),
          "uploads/profile-pictures",
          req.file.filename
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete profile picture
router.delete("/profile/picture", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // from authenticate middleware (changed from req.user.userId)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { image: true },
    });

    if (!user.image) {
      return res.status(404).json({ error: "No profile picture found" });
    }

    // Delete the file
    const imagePath = path.join(process.cwd(), user.image.url);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete image record and unlink from user
    await prisma.image.delete({
      where: { id: user.imageId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { imageId: null },
    });

    res.json({ message: "Profile picture deleted successfully" });
  } catch (error) {
    console.error("Profile picture deletion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
