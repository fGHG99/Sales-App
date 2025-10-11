import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { setIO, initializeSocketHandlers } from "../utils/socket.js";
import { connectRedis } from "../utils/redis.js";
import { startLocationCleanup } from "../utils/cronJobs.js";
import cookieParser from "cookie-parser";
import cors from "cors"; // ✅ import cors
import userRoute from "./Controllers/userController.js";
import authRoute from "./Controllers/authController.js";
import addressRoute from "./Controllers/addressCont.js";
import courierLoc from "./Controllers/courierLocCont.js";
import cartRoutes from "./Controllers/cartController.js";
import orderRoutes from "./Controllers/orderController.js";
import courierOrderRoutes from "./Controllers/courierOrderController.js";
import notificationRoutes from "./Controllers/notificationController.js";
import inventoryRoutes from "./Controllers/InventoryCont.js";
import storeRoute from "./Controllers/storeController.js";
import supportRoute from "./Controllers/supportController.js";
import { PORT, HOST } from "../utils/serverConf.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

setIO(io);

// Initialize Socket.IO event handlers (includes courier location tracking)
initializeSocketHandlers(io);

// Initialize Redis connection
connectRedis()
  .then(() => {
    console.log("✅ Redis initialized successfully");
    // Start location cleanup cron job after Redis connected
    startLocationCleanup();
  })
  .catch((err) => {
    console.error("❌ Failed to initialize Redis:", err);
    console.warn(
      "⚠️ Server will continue without Redis (location tracking disabled)"
    );
  });

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

// Delivery proofs - Publicly accessible for customer verification
app.use(
  "/uploads/delivery-proofs",
  express.static(path.join(__dirname, "../uploads/delivery-proofs"))
);

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`🔍 Incoming request: ${req.method} ${req.originalUrl}`);
  console.log(`🎯 Base URL: ${req.baseUrl}`);
  console.log(`📝 Path: ${req.path}`);
  next();
});
// Routes
app.use("/users", userRoute);
app.use("/store", storeRoute);
app.use("/auth", authRoute);
app.use("/courier", courierLoc);
app.use("/inventory", inventoryRoutes);
app.use("/cart", cartRoutes);
app.use("/order", orderRoutes);
app.use("/orders", courierOrderRoutes); // Courier order management
app.use("/notifications", notificationRoutes); // Notification management
app.use("/support", supportRoute);
app.use("/address", addressRoute);

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Your IP address is: ${HOST}`);
});
