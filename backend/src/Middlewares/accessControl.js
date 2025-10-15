import prisma from "../../utils/prisma.js";
import jwt from "jsonwebtoken";

/**
 * Middleware untuk cek akses endpoint berdasarkan accessKey
 * @param {string} accessKey - Access key yang dibutuhkan untuk endpoint ini
 * @returns {Function} Express middleware function
 *
 * Usage:
 * router.get("/endpoint", authenticate, authorize("permission.view"), handler);
 */
export const authorize = (accessKey) => {
  return async (req, res, next) => {
    try {
      // Ambil user dari request (sudah di-inject oleh authenticate middleware)
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized: User not authenticated",
        });
      }

      // Cari user beserta role dan permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            where: { isDeleted: false },
            include: {
              permissions: {
                where: { isDeleted: false },
              },
            },
          },
        },
      });

      if (!user) {
        return res.status(401).json({
          error: "Unauthorized: User not found",
        });
      }

      if (!user.role) {
        return res.status(403).json({
          error: "Forbidden: No role assigned to user",
        });
      }

      // Cek apakah user sudah dihapus (soft delete)
      if (user.isDeleted) {
        return res.status(403).json({
          error: "Forbidden: User account is disabled",
        });
      }

      // Cek apakah role sudah dihapus (soft delete)
      if (user.role.isDeleted) {
        return res.status(403).json({
          error: "Forbidden: User role is disabled",
        });
      }

      // Cek apakah role user punya accessKey yang sesuai
      const hasAccess = user.role.permissions.some(
        (perm) => perm.accessKey === accessKey && !perm.isDeleted
      );

      if (!hasAccess) {
        return res.status(403).json({
          error: "Forbidden: Insufficient permissions",
          required: accessKey,
        });
      }

      // Jika lolos → lanjut ke handler berikutnya
      next();
    } catch (err) {
      console.error("Authorization error:", err);
      return res.status(500).json({
        error: "Internal Server Error during authorization",
      });
    }
  };
};

/**
 * Hybrid authentication middleware
 * Verifies user from Access Token (Bearer) or Refresh Token (HTTP-only cookie)
 * Injects user data into req.user
 *
 * Usage:
 * router.get("/endpoint", authenticate, handler);
 */
// be/backend/src/Middlewares/accessControl.js
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];
    const refreshToken = req.cookies?.refreshToken;

    let userId = null;

    // Step 1: Try to verify Access Token
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        userId = decoded.userId || decoded.id;
      } catch (err) {
        console.warn(
          "Access token invalid/expired, attempting refresh token fallback..."
        );
      }
    }

    // Step 2: If access token fails → try Refresh Token
    if (!userId && refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        userId = decoded.userId || decoded.id;
      } catch (err) {
        console.warn("Refresh token invalid/expired:", err.message);
      }
    }

    // Step 3: Both tokens failed
    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized: Session expired, please login again",
      });
    }

    // Step 4: Fetch user data with role
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              roleType: true,
              isDeleted: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(401).json({
          error: "Unauthorized: User not found",
        });
      }

      if (user.isDeleted) {
        return res.status(403).json({
          error: "Forbidden: User account is disabled",
        });
      }

      // Set user properties
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (dbError) {
      console.error("Database error during authentication:", dbError);
      return res.status(500).json({
        error: "Internal server error during authentication",
      });
    }
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(500).json({
      error: "Internal server error during authentication",
    });
  }
};
