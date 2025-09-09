import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import prisma from "../../utils/prisma.js";

const router = express.Router();
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

export default router;
