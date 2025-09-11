import router from "../../utils/express.js"; 
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import prisma from "../../utils/prisma.js";

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
    const { name, email, password } = req.body;

    // cek kalau email sudah ada
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // buat user (verified default false)
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isVerified: false,
      },
    });

    // buat token verifikasi
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const verifyUrl = `http://localhost:3000/auth/verify/${token}`;

    // kirim email
    await transporter.sendMail({
      from: `"Sales App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Verify your email",
      html: `<p>Hi ${user.name},</p>
             <p>Please verify your email by clicking the link below:</p>
             <a href="${verifyUrl}">${verifyUrl}</a>`,
    });

    res.status(201).json({ message: "User registered, please check your email for verification" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// VERIFY
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await prisma.users.update({
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
    // 1. cari user berdasarkan email atau phone
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
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

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? "30d" : "1d" }
    );

    // 5. set refresh token di httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // pakai HTTPS only di production
      sameSite: "strict",
      maxAge: rememberMe ? 30*24*60*60*1000 : 24*60*60*1000, // 30d / 1d
    });

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
router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided, try re-logging" });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const newAccessToken = jwt.sign(
      { userId: payload.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ NewAccessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
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
