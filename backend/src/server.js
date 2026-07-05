// backend/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { initDb } from "./data/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve slip uploads directory statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);

await initDb();

// Fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`[Server] Kiosk Backend is running on port ${PORT}`);
});
