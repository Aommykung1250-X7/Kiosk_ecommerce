import { Router } from "express";
import pool from "../data/db.js";

const router = Router();

router.get("/health", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    await pool.query({ text: "SELECT 1", query_timeout: 3000 });
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

export default router;
