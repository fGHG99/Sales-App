import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors"; // ✅ import cors
import userRoute from "./Controllers/userController.js";
import authRoute from "./Controllers/authController.js";
import addressRoute from "./Controllers/addressCont.js";
import courierLoc from "./Controllers/courierLocCont.js";
import cartRoutes from "./Controllers/cartController.js";
import orderRoutes from "./Controllers/orderController.js";
import { PORT, HOST } from "../utils/serverConf.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const server = http.createServer(app);

// ✅ Tambahkan konfigurasi CORS
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true, // agar bisa kirim cookie/token antar origin
  })
);

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the public directory
app.use("/public", express.static(path.join(__dirname, "../public")));

// ========================================
// STATIC FILE ROUTES
// ========================================

// Profile pictures - Publicly accessible (standard for profile images)
app.use(
  "/uploads/profile-pictures",
  express.static(path.join(__dirname, "../uploads/profile-pictures"))
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/users", userRoute);
app.use("/auth", authRoute);
app.use("/address", addressRoute);
app.use("/courier", courierLoc);
app.use("/cart", cartRoutes);
app.use("/order", orderRoutes);

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Your IP address is: ${HOST}`);
});
