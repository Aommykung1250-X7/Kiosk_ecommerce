// backend/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/productRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Register API routes
app.use("/api", productRoutes);

// Fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`[Server] Kiosk Backend is running on port ${PORT}`);
});
