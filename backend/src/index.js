import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { setIO, initializeSocketHandlers } from "../utils/socket.js";
import { connectRedis } from "../utils/redis.js";
import { startLocationCleanup } from "../utils/cronJobs.js";
import cookieParser from "cookie-parser";
import cors from "cors";
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
import adminStoreRoute from "./Controllers/adminStoreController.js";
import disputeManagementRoute from "./Controllers/disputeManagementController.js";
import superAdminAnalyticsRoute from "./Controllers/superAdminAnalyticsController.js";
import feeRoute from "./Controllers/deliveryFeeRouter.js";
import auditLogRoute from "./Controllers/auditlogController.js";
import promotionalRoute from "./Controllers/promotionalController.js";
import { PORT, HOST } from "../utils/serverConf.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const server = http.createServer(app);

// ✅ CORS Configuration - Dynamic from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173"]; // fallback untuk development

console.log("🌐 Allowed CORS origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log("✅ CORS allowed origin:", origin);
      callback(null, true);
    } else {
      console.log("❌ CORS blocked origin:", origin);
      console.log("   Allowed origins:", allowedOrigins);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["set-cookie"],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// ✅ Apply CORS middleware BEFORE other middlewares
app.use(cors(corsOptions));
// Initialize Socket.IO with WebSocket-first configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins, // Menggunakan allowedOrigins yang sama dari environment variable
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6,
  perMessageDeflate: {
    threshold: 1024,
  },
});

setIO(io);

// Initialize Socket.IO event handlers
initializeSocketHandlers(io);

// Initialize Redis connection
connectRedis()
  .then(() => {
    console.log("✅ Redis initialized successfully");
    startLocationCleanup();
  })
  .catch((err) => {
    console.error("❌ Failed to initialize Redis:", err);
    console.warn(
      "⚠️ Server will continue without Redis (location tracking disabled)"
    );
  });

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the public directory
app.use("/public", express.static(path.join(__dirname, "../public")));

// ========================================
// STATIC FILE ROUTES
// ========================================

// Profile pictures - Publicly accessible
app.use(
  "/uploads/profile-pictures",
  express.static(path.join(__dirname, "../uploads/profile-pictures"))
);

// Delivery proofs - Publicly accessible
app.use(
  "/uploads/delivery-proofs",
  express.static(path.join(__dirname, "../uploads/delivery-proofs"))
);

// Promotional images - Publicly accessible
app.use(
  "/uploads/promotionals",
  express.static(path.join(__dirname, "../uploads/promotionals"))
);

// ✅ Body parser middleware (AFTER CORS)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Request logging middleware (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.get("origin")}`);
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
app.use("/orders", courierOrderRoutes);
app.use("/notifications", notificationRoutes);
app.use("/support", supportRoute);
app.use("/admin", adminStoreRoute);
app.use("/disputes", disputeManagementRoute);
app.use("/super-admin", superAdminAnalyticsRoute);
app.use("/fee", feeRoute);
app.use("/audit", auditLogRoute);
app.use("/address", addressRoute);
app.use("/promotionals", promotionalRoute);

// ✅ Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Your IP address is: ${HOST}`);
  console.log(`Allowed origins:`, allowedOrigins);
});
