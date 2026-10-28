// backend/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import screensaverRoutes from "./routes/screensaverRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import pool, { initDb } from "./data/db.js";
import dailyReportService from "./services/dailyReportService.js";
import { getAllowedOrigins } from "./config/security.js";

const app = express();
const PORT = process.env.PORT || 5000;

// The production API is reachable only through the Stack's Nginx proxy.
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Serve uploads statically
app.use("/uploads", express.static("uploads"));

// Register API routes
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", paymentRoutes);
app.use("/api", memberRoutes);
app.use("/api", screensaverRoutes);
app.use("/api", categoryRoutes);
app.use("/api", settingRoutes);
app.use("/api/admin/reports", reportRoutes);

await initDb();

// เริ่มตัวตั้งเวลาส่งอีเมลสรุปออเดอร์ค้างรายวัน (อ่านค่าจาก system_settings ทุกนาที)
dailyReportService.startScheduler();

// Fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`[Server] Kiosk Backend is running on port ${PORT}`);
});

const shutdown = () => {
  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error("[Server] Shutdown failed:", error);
      process.exit(1);
    }
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
