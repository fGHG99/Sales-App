import prisma from "../../utils/prisma.js";
import jwt from "jsonwebtoken";

/**
 * Middleware untuk cek akses endpoint berdasarkan accessKey
 * @param {string} accessKey - nama akses key yg dibutuhkan untuk endpoint ini
 */

export function authorize(accessKey) {
  return async (req, res, next) => {
    try {
      // Ambil user dari request (misalnya sudah di-attach di auth middleware)
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }

      // Cari user beserta role dan permissions
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      if (!user || !user.role) {
        return res.status(401).json({ error: "Unauthorized: No role assigned" });
      }

      // Cek apakah role user punya accessKey yang sesuai
      const hasAccess = user.role.permissions.some(
        (perm) => perm.acccess_key === accessKey && !perm.is_deleted
      );

      if (!hasAccess) {
        return res.status(401).json({ error: "Unauthorized: Access denied" });
      }

      // Jika lolos → lanjut ke handler berikutnya
      next();
    } catch (err) {
      console.error("Authorization error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
}

//middleware hybrid auth dari access token dan refresh token, melakukan inject ke dalam req.user
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];
    const refreshToken = req.cookies?.refreshToken;

    // Step 1: coba verify Access Token
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        req.user = { id: decoded.userId, email: decoded.email };
        return next();
      } catch (err) {
        console.warn("Access token invalid/expired, fallback ke refresh token...");
      }
    }

    // Step 2: kalau accessToken gagal → coba verify Refresh Token
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        req.user = { id: decoded.userId, email: decoded.email };
        return next();
      } catch (err) {
        console.warn("Refresh token invalid/expired:", err.message);
      }
    }

    // Step 3: kalau dua-duanya gagal
    return res
      .status(401)
      .json({ error: "session expired, try re-login" });
  } catch (err) {
    console.error("Hybrid auth error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}