import router from "../../utils/express.js";
import prisma from "../../utils/prisma.js";
import { authenticate, authorize } from "../Middlewares/accessControl.js";
import { logCreate, logUpdate, logDelete } from "../../utils/auditlog.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for promotional image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/promotionals";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "promotional-" + uniqueSuffix + path.extname(file.originalname));
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
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

/**
 * GET /promotionals
 * Get all promotional images
 * Returns: List of promotional images
 */
router.get("/get-promotionals", async (req, res) => {
  try {
    const promotionals = await prisma.promotional.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        imageUrl: true,
        altText: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      promotionals,
      count: promotionals.length,
    });
  } catch (error) {
    console.error("Error fetching promotionals:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch promotional images",
      details: error.message,
    });
  }
});

/**
 * POST /promotionals
 * Create new promotional image (Admin only)
 * Body: { altText: string }
 * File: promotional image
 */
router.post(
  "/post-promotional",
  authenticate,
  // authorize("promotional.create"),
  upload.single("image"),
  async (req, res) => {
    try {
      const { altText } = req.body;
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image file uploaded",
        });
      }

      if (!altText || altText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Alt text is required",
        });
      }

      // Get the file path (relative to server root)
      const imageUrl = `/uploads/promotionals/${req.file.filename}`;

      // Create promotional record
      const promotional = await prisma.promotional.create({
        data: {
          imageUrl,
          altText: altText.trim(),
        },
        select: {
          id: true,
          imageUrl: true,
          altText: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Audit log
      logCreate(
        "Promotional",
        promotional.id,
        {
          imageUrl: promotional.imageUrl,
          altText: promotional.altText,
        },
        userId
      );

      res.status(201).json({
        success: true,
        message: "Promotional image created successfully",
        promotional,
      });
    } catch (error) {
      console.error("Error creating promotional:", error);

      // Delete uploaded file if database operation fails
      if (req.file) {
        const filePath = path.join(
          process.cwd(),
          "uploads/promotionals",
          req.file.filename
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to create promotional image",
        details: error.message,
      });
    }
  }
);

/**
 * PUT /promotionals/:id
 * Update promotional image (Admin only)
 * Body: { altText: string }
 * Optional File: new promotional image
 */
router.put(
  "/update-promotional/:id",
  authenticate,
  // authorize("promotional.update"),
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { altText } = req.body;
      const userId = req.user.id;

      // Check if promotional exists
      const existingPromotional = await prisma.promotional.findUnique({
        where: { id },
      });

      if (!existingPromotional) {
        return res.status(404).json({
          success: false,
          error: "Promotional image not found",
        });
      }

      const updateData = {};

      // Update alt text if provided
      if (altText !== undefined) {
        if (altText.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: "Alt text cannot be empty",
          });
        }
        updateData.altText = altText.trim();
      }

      // Update image if new file uploaded
      if (req.file) {
        // Delete old image file
        const oldImagePath = path.join(
          process.cwd(),
          existingPromotional.imageUrl
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }

        // Set new image URL
        updateData.imageUrl = `/uploads/promotionals/${req.file.filename}`;
      }

      // Update promotional
      const updatedPromotional = await prisma.promotional.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          imageUrl: true,
          altText: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Audit log
      logUpdate(
        "Promotional",
        id,
        {
          imageUrl: existingPromotional.imageUrl,
          altText: existingPromotional.altText,
        },
        {
          imageUrl: updatedPromotional.imageUrl,
          altText: updatedPromotional.altText,
        },
        userId
      );

      res.json({
        success: true,
        message: "Promotional image updated successfully",
        promotional: updatedPromotional,
      });
    } catch (error) {
      console.error("Error updating promotional:", error);

      // Delete uploaded file if database operation fails
      if (req.file) {
        const filePath = path.join(
          process.cwd(),
          "uploads/promotionals",
          req.file.filename
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(500).json({
        success: false,
        error: "Failed to update promotional image",
        details: error.message,
      });
    }
  }
);

/**
 * DELETE /promotionals/:id
 * Delete promotional image (Admin only)
 */
router.delete(
  "/delete-promotional/:id",
  authenticate,
  // authorize("promotional.delete"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if promotional exists
      const promotional = await prisma.promotional.findUnique({
        where: { id },
      });

      if (!promotional) {
        return res.status(404).json({
          success: false,
          error: "Promotional image not found",
        });
      }

      // Delete image file
      const imagePath = path.join(process.cwd(), promotional.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      // Delete promotional record
      await prisma.promotional.delete({
        where: { id },
      });

      // Audit log
      logDelete(
        "Promotional",
        id,
        {
          imageUrl: promotional.imageUrl,
          altText: promotional.altText,
        },
        userId
      );

      res.json({
        success: true,
        message: "Promotional image deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting promotional:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete promotional image",
        details: error.message,
      });
    }
  }
);

export default router;
