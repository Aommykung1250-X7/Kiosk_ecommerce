// backend/src/server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
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
import { initDb } from "./data/db.js";
import { getAllowedOrigins } from "./config/security.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Serve uploads statically
app.use("/uploads", express.static("uploads"));

// Register API routes
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

// Fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`[Server] Kiosk Backend is running on port ${PORT}`);
});
