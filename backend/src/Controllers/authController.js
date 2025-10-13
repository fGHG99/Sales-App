import router from "../../utils/express.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import prisma from "../../utils/prisma.js";
import { authenticate } from "../Middlewares/accessControl.js";
import { format } from "date-fns-tz";
import { id as localeId } from "date-fns/locale";

/**
 * !IMPORTANT PAKE ADD ERROR HANDLING UNTUK VALIDATOR EMAIL, PASSWORD DLL
 */

// setup transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // kalau pakai Gmail
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // cek kalau email sudah ada
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Find by roleType or isDefault flag (safer than name)
      const userRole = await tx.role.findFirst({
        where: {
          OR: [{ roleType: "user" }, { isDefault: true }],
        },
      });

      if (!userRole) {
        throw new Error(
          "Default user role not found. Please run database seed."
        );
      }

      // buat user dulu (tapi transaksi belum commit)
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          isVerified: false,
          roleId: userRole.id,
        },
      });

      // set createdById ke diri sendiri
      await tx.user.update({
        where: { id: user.id },
        data: { createdById: user.id },
      });

      // generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      const verifyUrl = `http://localhost:3000/auth/verify/${token}`;

      // kirim email → kalau gagal, lempar error biar trx rollback
      await transporter.sendMail({
        from: `"Sales App" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Verify your email",
        html: `<p>Hi ${user.name},</p>
               <p>Please verify your email by clicking the link below:</p>
               <a href="${verifyUrl}">${verifyUrl}</a>`,
      });

      // kalau semua berhasil, return user
      return user;
    });

    res.status(201).json({
      message: "User registered, please check your email for verification",
      userId: result.id,
    });
  } catch (error) {
    console.error("Registration failed:", error);
    res
      .status(500)
      .json({ message: "Registration failed, email not sent or db error" });
  }
});

//router untuk mengirimkan ulang email verifikasi jika user belum menerima email verifikasi atau gagal terkirim
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // buat token baru
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const verifyUrl = `http://localhost:3000/auth/verify/${token}`;

    await transporter.sendMail({
      from: `"Sales App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Verify your email (resend)",
      html: `<p>Hi ${user.name},</p>
             <p>Please verify your email by clicking the link below:</p>
             <a href="${verifyUrl}">${verifyUrl}</a>`,
    });

    res.json({ message: "Verification email resent" });
  } catch (error) {
    console.error("Resend failed:", error);
    res.status(500).json({ message: "Failed to resend verification email" });
  }
});

// VERIFY
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { isVerified: true },
    });

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

// === LOGIN ===
router.post("/login", async (req, res) => {
  const { identifier, password, rememberMe } = req.body;

  try {
    // 1. Cari user berdasarkan email atau phone, include role
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            roleType: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // // 2. cek verifikasi
    // if (!user.isVerified) {
    //   return res.status(403).json({ message: "Please verify your account first" });
    // }

    // 3. cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. buat tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: rememberMe ? "30d" : "1d",
    });

    //untuk testing waktu expired dari token dengan waktu singkat
    // const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    //   expiresIn: rememberMe ? "2min" : "1min",
    // });

    // 5. set refresh token di httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // pakai HTTPS only di production
      sameSite: "strict",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30d / 1d
    });

    //untuk testing token expired dengan waktu singkat
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production", // pakai HTTPS only di production
    //   sameSite: "strict",
    //   maxAge: rememberMe ? 2 * 60 * 1000 : 1 * 60 * 1000, // 2 menit untuk testing
    // });

    // 6. kirim access token + user info
    const { password: _, verifyToken, ...userWithoutPassword } = user;
    res.json({
      message: "Login successful",
      accessToken,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// === REFRESH TOKEN ===
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res
      .status(401)
      .json({ message: "No refresh token provided, try re-logging" });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Fetch user data with role
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            roleType: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newAccessToken = jwt.sign(
      { userId: payload.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return both token and user data
    const { password, verifyToken, ...userWithoutPassword } = user;
    res.json({
      NewAccessToken: newAccessToken,
      user: userWithoutPassword,
    });
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
});

router.post("/change-password", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Semua field wajib diisi." });
    }
    
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "Konfirmasi password tidak cocok." });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan." });
    }
    
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Password lama salah." });
    }
    
    // Validasi: password baru tidak boleh sama dengan password lama
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        error: "Password baru tidak boleh sama dengan password lama." 
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Gunakan format waktu WIB (Asia/Jakarta)
    const nowWIB = format(new Date(), "dd MMMM yyyy HH:mm:ss", {
      timeZone: "Asia/Jakarta",
      locale: localeId,
    });
    
    // Kirim email konfirmasi password change SEBELUM update
    try {
      await transporter.sendMail({
        from: `"Sales App Support" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Konfirmasi Perubahan Password",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #333;">Halo ${user.name || "User"},</h2>
            <p>Password akun kamu baru saja diubah pada:</p>
            <p><strong>${nowWIB} WIB</strong></p>
            <p>Jika kamu tidak melakukan perubahan ini, segera hubungi tim support kami.</p>
            <br />
            <p>Salam hangat,</p>
            <p><strong>Tim Sales App</strong></p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("❌ Error sending email:", emailError);
      return res.status(500).json({ 
        error: "Gagal mengirim email konfirmasi. Password tidak diubah." 
      });
    }
    
    // Update password HANYA jika email berhasil dikirim
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    
    return res.json({
      message: "Password berhasil diubah. Email konfirmasi telah dikirim.",
    });
  } catch (error) {
    console.error("❌ Error in change-password:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
});

// === LOGOUT ===
// hapus refreshToken dari cookie
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out successfully" });
});

export default router;
